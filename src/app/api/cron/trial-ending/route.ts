// ═══════════════════════════════════════════════════════════════
// COPLIO — Cron : emails fin d'essai
//
// Tourne chaque nuit à 9h (heure de Paris).
// Envoie automatiquement un email aux cabinets dont le trial
// expire dans exactement 7 jours ou 1 jour.
//
// Sécurité : requête autorisée uniquement si le header
// Authorization correspond au CRON_SECRET (vérifié par Vercel).
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { Email } from '@/lib/email'
import { EMAIL_CONFIG } from '@/lib/email/config'

export const runtime = 'nodejs'
export const maxDuration = 60 // secondes — large pour les gros volumes

// ─── Sécurité ────────────────────────────────────────────────

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET

  if (!secret) {
    // En dev sans secret : autoriser (warn uniquement)
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Cron] CRON_SECRET non défini — accès non protégé')
      return true
    }
    return false
  }

  return authHeader === `Bearer ${secret}`
}

// ─── Handler ─────────────────────────────────────────────────

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const startedAt = Date.now()
  const supabase = createAdminClient()
  const appUrl = EMAIL_CONFIG.brand.appUrl

  // Calculer les dates cibles (J-7 et J-1)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const targets = [
    { joursRestants: 7, label: 'J-7' },
    { joursRestants: 1, label: 'J-1' },
  ]

  let totalSent = 0
  let totalFailed = 0
  const details: string[] = []

  for (const { joursRestants, label } of targets) {
    const targetDate = new Date(today)
    targetDate.setDate(targetDate.getDate() + joursRestants)

    // Fenêtre : tout le jour cible (00:00 → 23:59)
    const dateStart = targetDate.toISOString().split('T')[0] + 'T00:00:00.000Z'
    const dateEnd   = targetDate.toISOString().split('T')[0] + 'T23:59:59.999Z'

    // Récupérer les cabinets en trial qui expirent ce jour
    const { data: cabinets, error } = await supabase
      .from('cabinets')
      .select('id, nom, email_contact')
      .eq('plan', 'trial')
      .eq('subscription_status', 'trialing')
      .gte('trial_ends_at', dateStart)
      .lte('trial_ends_at', dateEnd)

    if (error) {
      console.error(`[Cron trial-ending] Erreur Supabase (${label}):`, error)
      continue
    }

    if (!cabinets || cabinets.length === 0) {
      details.push(`${label}: 0 cabinet`)
      continue
    }

    // Pour chaque cabinet, trouver le owner et envoyer l'email
    for (const cabinet of cabinets) {
      try {
        // Récupérer le propriétaire du cabinet
        const { data: owner } = await supabase
          .from('profiles')
          .select('prenom, nom, email')
          .eq('cabinet_id', cabinet.id)
          .eq('role', 'owner')
          .single()

        const recipientEmail = owner?.email ?? cabinet.email_contact
        if (!recipientEmail) {
          console.warn(`[Cron trial-ending] Pas d'email pour le cabinet ${cabinet.id}`)
          continue
        }

        const result = await Email.trialEnding(
          {
            prenom: owner?.prenom ?? 'Gestionnaire',
            nomCabinet: cabinet.nom,
            joursRestants,
            upgradeUrl: `${appUrl}/facturation`,
          },
          recipientEmail
        )

        if (result.success) {
          totalSent++
          console.log(`[Cron trial-ending] ${label} → ${recipientEmail} (cabinet: ${cabinet.nom})`)
        } else {
          totalFailed++
          console.error(`[Cron trial-ending] Échec ${label} → ${recipientEmail}:`, result.error?.message)
        }
      } catch (err) {
        totalFailed++
        console.error(`[Cron trial-ending] Erreur cabinet ${cabinet.id}:`, err)
      }
    }

    details.push(`${label}: ${cabinets.length} cabinet(s) traité(s)`)
  }

  const durationMs = Date.now() - startedAt
  console.log(
    JSON.stringify({
      level: 'info',
      service: 'cron',
      job: 'trial-ending',
      totalSent,
      totalFailed,
      durationMs,
      details,
    })
  )

  return NextResponse.json({
    success: true,
    totalSent,
    totalFailed,
    durationMs,
    details,
  })
}
