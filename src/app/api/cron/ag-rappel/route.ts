// ═══════════════════════════════════════════════════════════════
// COPLIO — Cron : rappel AG à venir dans 7 jours
//
// Tourne chaque matin à 8h00 (heure de Paris).
// Envoie une alerte email aux gestionnaires du cabinet
// pour chaque AG planifiée dans exactement 7 jours.
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { Email } from '@/lib/email'
import { withErrorHandler } from '@/lib/api-handler'
import { captureException } from '@/lib/monitoring'
import { fireAndForget } from '@/lib/utils'

export const runtime = 'nodejs'
export const maxDuration = 60

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV === 'development'
  return authHeader === `Bearer ${secret}`
}

export const GET = withErrorHandler(async (request: Request) => {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const admin = createAdminClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coplio.fr'

  // AG dans 7 jours (fenêtre ±12h pour tolérer les dérives de cron)
  const in7Days = new Date()
  in7Days.setDate(in7Days.getDate() + 7)
  const windowStart = new Date(in7Days)
  const windowEnd   = new Date(in7Days)
  windowStart.setHours(0,  0,  0, 0)
  windowEnd.setHours(23, 59, 59, 999)

  const { data: ags, error } = await admin
    .from('assemblees_generales')
    .select('id, titre, date_ag, lieu, cabinet_id, copropriete:coproprietes(nom)')
    .in('status', ['planifiee', 'convocations_envoyees'])
    .gte('date_ag', windowStart.toISOString())
    .lte('date_ag', windowEnd.toISOString())

  if (error) {
    captureException(error, { context: 'cron-ag-rappel-fetch' })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0
  let skipped = 0

  for (const ag of ags ?? []) {
    // Récupérer les gestionnaires du cabinet
    const { data: gestionnaires } = await admin
      .from('profiles')
      .select('email, prenom')
      .eq('cabinet_id', ag.cabinet_id)
      .not('email', 'is', null)

    const coproprieteNom = (ag.copropriete as { nom?: string } | null)?.nom ?? '—'
    const dateAG = new Date(ag.date_ag).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })

    for (const g of gestionnaires ?? []) {
      if (!g.email) { skipped++; continue }

      fireAndForget(
        () => Email.criticalAlert(
          {
            titre: `AG dans 7 jours — ${coproprieteNom}`,
            message: `L'assemblée générale "${ag.titre}" est prévue dans 7 jours. Vérifiez que les convocations ont bien été envoyées et que l'ordre du jour est complet.`,
            severity: 'warning',
            details: {
              'Copropriété': coproprieteNom,
              'Date': dateAG,
              'Lieu': ag.lieu ?? '—',
            },
            actionUrl: `${appUrl}/assemblees/${ag.id}`,
            actionLabel: 'Préparer l\'AG',
          },
          g.email
        ),
        { attempts: 2, onFailure: err => captureException(err, { context: 'cron-ag-rappel-email' }) }
      )
      sent++
    }
  }

  return NextResponse.json({
    ok: true,
    ags_found: ags?.length ?? 0,
    emails_sent: sent,
    skipped,
    timestamp: new Date().toISOString(),
  })
})
