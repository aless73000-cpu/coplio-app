// ═══════════════════════════════════════════════════════════════
// COPLIO — Webhook Resend
//
// Reçoit les événements de livraison de Resend :
//   email.sent, email.delivered, email.bounced,
//   email.complained, email.opened, email.clicked
//
// Sécurité : vérification de la signature SVix
// (Resend utilise Svix pour signer ses webhooks)
//
// Pour activer dans Resend Dashboard :
//   → Webhooks → Add endpoint → https://coplio.fr/api/webhooks/resend
//   → Sélectionner tous les événements email.*
//   → Copier le signing secret → RESEND_WEBHOOK_SECRET
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import type { ResendWebhookEvent } from '@/lib/email/types'
import { Email } from '@/lib/email'
import { withErrorHandler } from '@/lib/api-handler'
import { captureException } from '@/lib/monitoring'

export const runtime = 'nodejs'

/**
 * Vérifie la signature Svix d'un webhook Resend.
 * Resend utilise le même format de signature que Svix.
 */
async function verifySignature(
  payload: string,
  headers: Headers
): Promise<boolean> {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    // En dev sans secret configuré, on laisse passer (warn uniquement)
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Resend Webhook] RESEND_WEBHOOK_SECRET non configuré — signature non vérifiée')
      return true
    }
    return false
  }

  const svixId        = headers.get('svix-id')
  const svixTimestamp = headers.get('svix-timestamp')
  const svixSignature = headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) return false

  // Vérification anti-replay : timestamp max 5 minutes
  const ts = parseInt(svixTimestamp, 10)
  if (isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > 300) {
    console.warn('[Resend Webhook] Timestamp trop ancien — possible replay attack')
    return false
  }

  try {
    const { Webhook } = await import('svix')
    const wh = new Webhook(secret)
    wh.verify(payload, {
      'svix-id':        svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    })
    return true
  } catch {
    return false
  }
}

// ─── Handlers par type d'événement ───────────────────────────

async function handleBounce(event: ResendWebhookEvent) {
  const { email_id, to, bounce_type } = event.data

  // Hard bounce → alerter l'admin si critique
  if (bounce_type === 'hard') {
    await Email.criticalAlert(
      {
        titre: 'Email rejeté (hard bounce)',
        message: `L'email ${email_id} a été rejeté définitivement par le serveur destinataire.`,
        severity: 'warning',
        details: {
          emailId:    email_id,
          recipients: to.join(', '),
          bounceType: bounce_type ?? 'unknown',
          at:         event.data.bounced_at ?? event.created_at,
        },
      },
      process.env.ADMIN_ALERT_EMAIL ?? 'team@coplio.fr'
    ).catch(err => captureException(err, { context: 'resend-webhook' }))
  }
}

async function handleComplaint(event: ResendWebhookEvent) {
  const { email_id, to } = event.data
  console.warn(`[Resend] Plainte spam de ${to.join(', ')} (emailId=${email_id})`)

  // Signalement de spam → alerter l'admin
  await Email.criticalAlert(
    {
      titre: 'Signalement spam (complaint)',
      message: `Un destinataire a signalé un email Coplio comme spam.`,
      severity: 'warning',
      details: {
        emailId:    email_id,
        recipients: to.join(', '),
        at:         event.data.complained_at ?? event.created_at,
      },
    },
    process.env.ADMIN_ALERT_EMAIL ?? 'team@coplio.fr'
  ).catch(err => captureException(err, { context: 'resend-webhook' }))
}

// ─── Handler principal ────────────────────────────────────────

export const POST = withErrorHandler(async (request: Request) => {
  const payload = await request.text()

  // 1. Vérifier la signature
  const valid = await verifySignature(payload, request.headers)
  if (!valid) {
    captureException(new Error('Resend webhook signature invalide'), { context: 'resend-webhook' })
    return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })
  }

  let event: ResendWebhookEvent
  try {
    event = JSON.parse(payload) as ResendWebhookEvent
  } catch {
    return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })
  }

  // 2. Log structuré de tous les événements

  // 3. Traitement par type
  try {
    switch (event.type) {
      case 'email.bounced':
        await handleBounce(event)
        break
      case 'email.complained':
        await handleComplaint(event)
        break
      case 'email.delivered':
        // Confirmé livré → pas d'action, log suffit
        break
      case 'email.delivery_delayed':
        console.warn(`[Resend] Livraison retardée pour ${event.data.to.join(', ')}`)
        break
      case 'email.opened':
      case 'email.clicked':
        // Analytics optionnel — stocker en Supabase si besoin
        break
      default:
        // Événement inconnu — ignorer silencieusement
        break
    }
  } catch (err) {
    captureException(err, { context: 'resend-webhook-handler' })
    // On retourne 200 quand même pour éviter les retries Resend
    // (l'erreur est loggée, pas bloquante)
  }

  return NextResponse.json({ received: true })
})