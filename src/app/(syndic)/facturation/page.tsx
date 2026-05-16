import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Check, Zap, Crown, Star, AlertTriangle, Mail } from 'lucide-react'
import { PLANS_CONFIG } from '@/types'
import { SubscribeButton } from '@/components/stripe/SubscribeButton'
import { ManageButton } from '@/components/stripe/ManageButton'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Facturation' }

export default async function FacturationPage({
  searchParams,
}: {
  searchParams: { success?: string; canceled?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'owner') redirect('/dashboard')

  const { data: cabinet } = await supabase
    .from('cabinets')
    .select('*')
    .eq('id', profile.cabinet_id ?? '')
    .single()

  const currentPlan = cabinet?.plan ?? 'trial'
  const isActive = ['active', 'trialing'].includes(cabinet?.subscription_status ?? '')

  const trialDaysLeft = cabinet?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(cabinet.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-coplio-text">Facturation</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gérez votre abonnement Coplio
        </p>
      </div>

      {/* Trial urgence */}
      {currentPlan === 'trial' && trialDaysLeft > 0 && trialDaysLeft <= 7 && (
        <div className="flex items-start gap-3 p-4 bg-coplio-amber-bg border border-coplio-amber/20 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-coplio-amber flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-coplio-amber">
              Votre essai expire dans {trialDaysLeft} jour{trialDaysLeft > 1 ? 's' : ''}
            </p>
            <p className="text-sm text-coplio-amber/80 mt-1">
              Choisissez un plan ci-dessous pour conserver l&apos;accès à toutes vos données.
              Aucune donnée n&apos;est supprimée à l&apos;expiration.
            </p>
          </div>
        </div>
      )}

      {/* Alertes */}
      {searchParams.success && (
        <div className="p-4 bg-coplio-green-light border border-coplio-green/20 rounded-xl">
          <p className="text-coplio-green font-medium">✓ Abonnement activé avec succès !</p>
          <p className="text-sm text-coplio-green/80 mt-1">Vous avez maintenant accès à toutes les fonctionnalités de votre plan.</p>
        </div>
      )}
      {searchParams.canceled && (
        <div className="p-4 bg-coplio-amber-bg border border-coplio-amber/20 rounded-xl">
          <p className="text-coplio-amber font-medium">Paiement annulé</p>
          <p className="text-sm text-coplio-amber/80 mt-1">Aucun prélèvement n&apos;a été effectué.</p>
        </div>
      )}

      {/* Abonnement actuel */}
      {cabinet && (
        <div className="coplio-card">
          <h2 className="font-semibold text-coplio-text mb-4">Abonnement actuel</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-coplio-text capitalize">
                  Plan {currentPlan === 'trial' ? 'Essai gratuit' : currentPlan}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isActive ? 'bg-coplio-green-light text-coplio-green' : 'bg-coplio-amber-bg text-coplio-amber'
                }`}>
                  {isActive ? 'Actif' : cabinet.subscription_status}
                </span>
              </div>
              {currentPlan === 'trial' && trialDaysLeft > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {trialDaysLeft} jour{trialDaysLeft > 1 ? 's' : ''} d&apos;essai restant{trialDaysLeft > 1 ? 's' : ''}
                </p>
              )}
              {cabinet.current_period_end && (
                <p className="text-sm text-muted-foreground mt-1">
                  Prochain renouvellement :{' '}
                  {new Date(cabinet.current_period_end).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {cabinet.max_gestionnaires ?? 0} gestionnaire{(cabinet.max_gestionnaires ?? 0) > 1 ? 's' : ''} ·{' '}
                {cabinet.max_lots === 999 ? 'Lots illimités' : `${cabinet.max_lots} lots max`}
              </p>
            </div>
            {cabinet.stripe_subscription_id && (
              <ManageButton />
            )}
          </div>
        </div>
      )}

      {/* Plans */}
      <div>
        <h2 className="font-semibold text-coplio-text mb-4">Choisir un plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.entries(PLANS_CONFIG) as [string, typeof PLANS_CONFIG[keyof typeof PLANS_CONFIG]][]).map(([key, plan]) => {
            const isCurrentPlan = currentPlan === key
            const isPro = 'popular' in plan && (plan as { popular?: boolean }).popular

            return (
              <div
                key={key}
                className={`relative rounded-2xl border p-6 ${
                  isPro
                    ? 'border-coplio-green shadow-md bg-coplio-green-light/30'
                    : 'border-border bg-white'
                }`}
              >
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-coplio-green text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Le plus populaire
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="font-bold text-coplio-text text-lg">{plan.name}</h3>
                  <div className="flex items-end gap-1 mt-2">
                    <span className="text-3xl font-bold text-coplio-text">{plan.price}€</span>
                    <span className="text-muted-foreground text-sm mb-1">/mois</span>
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-coplio-text">
                      <Check className="w-4 h-4 text-coplio-green flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <div className="w-full py-2.5 bg-coplio-green-light text-coplio-green text-center rounded-xl text-sm font-medium">
                    Plan actuel
                  </div>
                ) : (
                  <SubscribeButton plan={key} isPro={isPro} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* FAQ rapide */}
      <div className="coplio-card space-y-4">
        <h2 className="font-semibold text-coplio-text">Questions fréquentes</h2>
        {[
          {
            q: 'Puis-je changer de plan à tout moment ?',
            r: 'Oui. Le changement prend effet immédiatement avec proratisation.',
          },
          {
            q: 'Que se passe-t-il à la fin de l\'essai ?',
            r: 'Votre compte est suspendu mais toutes vos données sont conservées 30 jours. Vous pouvez souscrire à tout moment.',
          },
          {
            q: 'Comment régler ?',
            r: 'Par carte bancaire via Stripe (Visa, Mastercard, Amex). Prélèvement mensuel automatique.',
          },
          {
            q: 'Y a-t-il un engagement ?',
            r: 'Non. Vous pouvez résilier à tout moment depuis cette page, sans frais.',
          },
        ].map(({ q, r }) => (
          <div key={q} className="border-b border-border pb-4 last:border-0 last:pb-0">
            <p className="font-medium text-sm text-coplio-text">{q}</p>
            <p className="text-sm text-muted-foreground mt-1">{r}</p>
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="flex items-center gap-4 p-4 bg-coplio-bg rounded-xl border border-border">
        <Mail className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-coplio-text">Une question sur votre abonnement ?</p>
          <p className="text-sm text-muted-foreground">
            Contactez-nous :{' '}
            <a href="mailto:contact@coplio.fr" className="text-coplio-green hover:underline font-medium">
              contact@coplio.fr
            </a>
          </p>
        </div>
      </div>

      {/* Add-on portail brandé */}
      <div className="coplio-card">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-coplio-text">Add-on : Portail copropriétaire brandé</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Personnalisez le portail aux couleurs de votre cabinet (logo, couleurs, nom de domaine)
            </p>
            <p className="text-sm font-semibold text-coplio-text mt-2">0,30€ / lot / mois</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            cabinet?.addon_portail_actif ? 'badge-a-jour' : 'bg-coplio-bg text-muted-foreground'
          }`}>
            {cabinet?.addon_portail_actif ? 'Actif' : 'Inactif'}
          </span>
        </div>
      </div>
    </div>
  )
}
