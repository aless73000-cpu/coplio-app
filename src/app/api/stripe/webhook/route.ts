import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { PLAN_LIMITS } from '@/lib/stripe'
import { Email, sendEmail } from '@/lib/email'
import type Stripe from 'stripe'
import { withErrorHandler } from '@/lib/api-handler'
import { captureException } from '@/lib/monitoring'

export const runtime = 'nodejs'

const RELEVANT_EVENTS = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
])

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coplio.fr'

// ─── Helpers ───────────────────────────────────────────────────

/** Récupère le profil owner d'un cabinet (prenom + email + nom cabinet). */
async function getOwnerProfile(
  supabase: ReturnType<typeof createAdminClient>,
  cabinetId: string
): Promise<{ prenom: string; email: string; nomCabinet: string } | null> {
  const { data } = await supabase
    .from('profiles')
    .select('prenom, email, cabinets(nom)')
    .eq('cabinet_id', cabinetId)
    .eq('role', 'owner')
    .maybeSingle()

  if (!data?.email) return null

  return {
    prenom: data.prenom ?? '',
    email: data.email,
    nomCabinet: (data.cabinets as unknown as { nom: string } | null)?.nom ?? '',
  }
}

/** Récupère le profil owner depuis un stripe_customer_id. */
async function getOwnerByCustomerId(
  supabase: ReturnType<typeof createAdminClient>,
  customerId: string
): Promise<{ prenom: string; email: string; nomCabinet: string; cabinetId: string } | null> {
  const { data: cabinet } = await supabase
    .from('cabinets')
    .select('id, nom')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()

  if (!cabinet) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('prenom, email')
    .eq('cabinet_id', cabinet.id)
    .eq('role', 'owner')
    .maybeSingle()

  if (!profile?.email) return null

  return {
    prenom: profile.prenom ?? '',
    email: profile.email,
    nomCabinet: cabinet.nom ?? '',
    cabinetId: cabinet.id,
  }
}

/** Formate un montant en centimes en chaîne lisible (ex: "29,00 €"). */
function formatAmount(amountCents: number | null | undefined, currency = 'eur'): string {
  if (!amountCents) return '—'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountCents / 100)
}

/** Formate un timestamp Unix en date ISO lisible (ex: "1 juin 2025"). */
function formatDate(unixTs: number): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(unixTs * 1000))
}

// ─── Webhook handler ──────────────────────────────────────────

export const POST = withErrorHandler(async (request: Request) => {
  // I-01 : guard explicite — si la variable manque, on refuse immédiatement
  // plutôt que de laisser constructEvent() exploser avec une erreur cryptique.
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    captureException(
      new Error('[Stripe] STRIPE_WEBHOOK_SECRET absent — webhook non opérationnel'),
      { context: 'stripe-webhook-missing-secret' }
    )
    return NextResponse.json(
      { error: 'Webhook non configuré (variable manquante)' },
      { status: 503 }
    )
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    captureException(err, { context: 'stripe-webhook-signature' })
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  if (!RELEVANT_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {

      // ── Checkout complété ────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const cabinetId = session.metadata?.cabinet_id
        const plan = session.metadata?.plan
        const addon = session.metadata?.addon

        // ── Add-on portail ────────────────────────────────────────
        if (cabinetId && addon === 'portail') {
          await supabase
            .from('cabinets')
            .update({ addon_portail_actif: true })
            .eq('id', cabinetId)

          const owner = await getOwnerProfile(supabase, cabinetId)
          if (owner) {
            await sendEmail({
              to: owner.email,
              subject: 'Add-on Portail activé — Coplio',
              html: `<p>Bonjour ${owner.prenom},</p><p>L'add-on <strong>Portail copropriétaire brandé</strong> est maintenant actif pour votre cabinet <strong>${owner.nomCabinet}</strong>.</p><p>Vos copropriétaires bénéficieront dès à présent d'un portail personnalisé aux couleurs de votre cabinet.</p><p>L'équipe Coplio</p>`,
            }).catch(() => null)
          }
          break
        }

        if (cabinetId && plan) {
          const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.starter

          await supabase
            .from('cabinets')
            .update({
              plan: plan as 'trial' | 'starter' | 'pro' | 'expert',
              subscription_status: 'active',
              stripe_subscription_id: session.subscription as string,
              max_gestionnaires: limits.max_gestionnaires,
              max_lots: limits.max_lots,
            })
            .eq('id', cabinetId)

          // ── Email confirmation abonnement ──────────────────
          const owner = await getOwnerProfile(supabase, cabinetId)
          if (owner) {
            // Récupération des dates de période depuis l'abonnement
            let periodeDebut = ''
            let periodeFin = ''
            let factureUrl: string | undefined

            if (session.subscription) {
              try {
                const sub = await stripe.subscriptions.retrieve(
                  session.subscription as string
                )
                periodeDebut = formatDate(sub.current_period_start)
                periodeFin = formatDate(sub.current_period_end)
              } catch {
                // Non bloquant — les dates resteront vides
              }
            }

            if (session.invoice) {
              try {
                const inv = await stripe.invoices.retrieve(
                  session.invoice as string
                )
                factureUrl = inv.hosted_invoice_url ?? undefined
              } catch {
                // Non bloquant
              }
            }

            await Email.checkoutConfirm(
              {
                prenom: owner.prenom,
                nomCabinet: owner.nomCabinet,
                plan,
                montant: formatAmount(session.amount_total, session.currency ?? 'eur'),
                periodeDebut,
                periodeFin,
                factureUrl,
              },
              owner.email
            ).catch((err) =>
              captureException(err, { context: 'stripe-checkout-confirm-email' })
            )
          }
        }
        break
      }

      // ── Abonnement créé / mis à jour ─────────────────────────
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object as Stripe.Subscription
        const cabinetId = sub.metadata?.cabinet_id

        if (cabinetId) {
          // I-04 : si plan absent du metadata, on log un warning au lieu de silencieusement
          // rétrograder le client en 'starter' — peut arriver sur des mutations Stripe automatiques.
          if (!sub.metadata?.plan) {
            const { captureMessage } = await import('@/lib/monitoring')
            captureMessage(
              `[Stripe] ${event.type} sans metadata.plan — cabinet ${cabinetId} NON modifié (évite downgrade silencieux)`,
              'warning',
              { subscription_id: sub.id, cabinet_id: cabinetId, event_type: event.type }
            )
            break
          }

          const plan = sub.metadata.plan
          const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.starter

          await supabase
            .from('cabinets')
            .update({
              plan: plan as 'trial' | 'starter' | 'pro' | 'expert',
              subscription_status: sub.status as 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete',
              stripe_subscription_id: sub.id,
              current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
              max_gestionnaires: limits.max_gestionnaires,
              max_lots: limits.max_lots,
            })
            .eq('id', cabinetId)

          // ── Email changement de plan (updated seulement) ──────
          if (event.type === 'customer.subscription.updated') {
            const prevAttrs = event.data.previous_attributes as
              | Partial<Stripe.Subscription>
              | undefined
            const ancienPlan = (prevAttrs?.metadata as Record<string, string> | undefined)?.plan

            if (ancienPlan && ancienPlan !== plan) {
              const owner = await getOwnerProfile(supabase, cabinetId)
              if (owner) {
                // Montant du prochain prélèvement
                const montant = sub.items.data[0]?.price.unit_amount
                  ? formatAmount(
                      sub.items.data[0].price.unit_amount,
                      sub.items.data[0].price.currency
                    )
                  : '—'

                await Email.planChange(
                  {
                    prenom: owner.prenom,
                    nomCabinet: owner.nomCabinet,
                    ancienPlan,
                    nouveauPlan: plan,
                    montant,
                    effectifLe: formatDate(sub.current_period_start),
                  },
                  owner.email
                ).catch((err) =>
                  captureException(err, { context: 'stripe-plan-change-email' })
                )
              }
            }
          }
        }
        break
      }

      // ── Abonnement annulé ────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const cabinetId = sub.metadata?.cabinet_id

        if (!cabinetId) break

        // Add-on portail annulé → désactiver
        if (sub.metadata?.addon === 'portail') {
          await supabase
            .from('cabinets')
            .update({ addon_portail_actif: false })
            .eq('id', cabinetId)
          break
        }

        // Abonnement principal annulé → reset plan + quotas
        const starterLimits = PLAN_LIMITS['starter']
        await supabase
          .from('cabinets')
          .update({
            plan: 'starter',
            subscription_status: 'canceled',
            stripe_subscription_id: null,
            max_lots: starterLimits.max_lots,
            max_gestionnaires: starterLimits.max_gestionnaires,
          })
          .eq('id', cabinetId)
        break
      }

      // ── Paiement échoué ──────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        await supabase
          .from('cabinets')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', customerId)

        // ── Alerte Sentry ──────────────────────────────────────
        try {
          const { captureException } = await import('@sentry/nextjs')
          captureException(new Error('[Stripe] invoice.payment_failed'), {
            tags: { stripe_customer_id: customerId, event_type: 'invoice.payment_failed' },
            extra: {
              invoice_id: invoice.id,
              amount_due: invoice.amount_due,
              currency: invoice.currency,
            },
          })
        } catch { /* Sentry facultatif */ }

        // ── Email échec de paiement ────────────────────────────
        const owner = await getOwnerByCustomerId(supabase, customerId)
        if (owner) {
          await Email.paymentFailed(
            {
              prenom: owner.prenom,
              nomCabinet: owner.nomCabinet,
              montant: formatAmount(invoice.amount_due, invoice.currency),
              dateEchec: formatDate(invoice.created),
              updatePaymentUrl: `${APP_URL}/facturation`,
            },
            owner.email
          ).catch((err) =>
            captureException(err, { context: 'stripe-payment-failed-email' })
          )
        }
        break
      }

      // ── Paiement réussi ──────────────────────────────────────
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        await supabase
          .from('cabinets')
          .update({ subscription_status: 'active' })
          .eq('stripe_customer_id', customerId)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    captureException(error, { context: 'stripe-webhook-handler' })
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
})