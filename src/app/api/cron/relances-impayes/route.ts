// ═══════════════════════════════════════════════════════════════
// COPLIO — Cron : relances automatiques impayés
//
// Tourne chaque nuit à 8h00 (heure de Paris).
// Pour chaque appel de charges impayé :
//   - J+30 → relance niveau 1 (rappel courtois)
//   - J+60 → relance niveau 2 (mise en garde)
//   - J+90 → relance niveau 3 (mise en demeure)
//
// Ne renvoie pas si une relance a déjà été envoyée dans les 25j.
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { Email } from '@/lib/email'
import { formatEuro, formatDate } from '@/lib/utils'
import { withErrorHandler } from '@/lib/api-handler'
import { captureException } from '@/lib/monitoring'

export const runtime = 'nodejs'
export const maxDuration = 120

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'development') return true
    return false
  }
  return authHeader === `Bearer ${secret}`
}

// Seuils en jours après échéance → niveau de relance
const NIVEAUX = [
  { joursMin: 30, joursMax: 59, niveau: 1 },
  { joursMin: 60, joursMax: 89, niveau: 2 },
  { joursMin: 90, joursMax: 999, niveau: 3 },
] as const

export const GET = withErrorHandler(async (request: Request) => {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const startedAt = Date.now()
  const admin = createAdminClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coplio.fr'

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Récupérer tous les appels impayés avec échéance dépassée
  const { data: appels, error } = await admin
    .from('appels_charges')
    .select(`
      id,
      montant,
      montant_paye,
      date_echeance,
      nb_relances,
      derniere_relance_at,
      lot_id,
      copropriete:coproprietes(id, nom, cabinet_id),
      lot:lots(id, numero)
    `)
    .eq('paye', false)
    .lt('date_echeance', today.toISOString())
    .not('lot_id', 'is', null)

  if (error) {
    captureException(error, { context: 'cron-relances-supabase' })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const appelsList = appels ?? []

  // Pré-charger profiles et cabinets en 2 requêtes (évite N+1 : 3 req/appel → 1 req/appel)
  const lotIds = Array.from(new Set(appelsList.map(a => a.lot_id).filter(Boolean))) as string[]
  const cabinetIds = Array.from(new Set(
    appelsList
      .map(a => (a.copropriete as unknown as { cabinet_id: string } | null)?.cabinet_id)
      .filter(Boolean)
  )) as string[]

  const [{ data: profilesData }, { data: cabinetsData }] = await Promise.all([
    lotIds.length > 0
      ? admin.from('profiles').select('prenom, nom, email, lot_id').in('lot_id', lotIds).eq('role', 'owner_resident')
      : Promise.resolve({ data: [] }),
    cabinetIds.length > 0
      ? admin.from('cabinets').select('id, nom').in('id', cabinetIds)
      : Promise.resolve({ data: [] }),
  ])

  const profileByLot = new Map(
    (profilesData ?? []).map(p => [p.lot_id as string, p])
  )
  const cabinetById = new Map(
    (cabinetsData ?? []).map(c => [c.id as string, c.nom as string])
  )

  let totalSent = 0
  let totalSkipped = 0
  let totalFailed = 0

  for (const appel of appelsList) {
    try {
      const echeance = new Date(appel.date_echeance)
      const joursDepuisEcheance = Math.floor(
        (today.getTime() - echeance.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Déterminer le niveau applicable
      const palier = NIVEAUX.find(
        (n) => joursDepuisEcheance >= n.joursMin && joursDepuisEcheance <= n.joursMax
      )
      if (!palier) { totalSkipped++; continue }

      // Verrouillage optimiste : UPDATE atomique avec toutes les conditions.
      // Si une autre instance du cron a déjà traité ce rang, l'UPDATE retourne 0 lignes.
      const cutoffDate = new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString()
      const { data: claimed } = await admin
        .from('appels_charges')
        .update({
          nb_relances: palier.niveau,
          derniere_relance_at: new Date().toISOString(),
        })
        .eq('id', appel.id)
        .lt('nb_relances', palier.niveau)
        .or(`derniere_relance_at.is.null,derniere_relance_at.lt.${cutoffDate}`)
        .select('id')

      if (!claimed?.length) { totalSkipped++; continue }

      // Lookup O(1) depuis les Maps pré-chargées
      const ownerProfile = profileByLot.get(appel.lot_id ?? '')
      if (!ownerProfile?.email) { totalSkipped++; continue }

      const copropriete = appel.copropriete as unknown as { id: string; nom: string; cabinet_id: string } | null
      const cabinetNom = cabinetById.get(copropriete?.cabinet_id ?? '') ?? 'Votre syndic'

      const montantDu = appel.montant - (appel.montant_paye ?? 0)

      const result = await Email.relanceImpayes(
        {
          prenom: ownerProfile.prenom ?? '',
          nom: ownerProfile.nom ?? '',
          montant: formatEuro(montantDu),
          dateEcheance: formatDate(appel.date_echeance),
          cabinetNom: cabinetNom,
          nomCopropriete: copropriete?.nom ?? 'votre résidence',
          numeroLot: (appel.lot as unknown as { numero: string } | null)?.numero ?? '',
          niveau: palier.niveau,
          portailUrl: `${appUrl}/mes-charges`,
        },
        ownerProfile.email
      )

      if (result.success) {
        totalSent++
      } else {
        totalFailed++
      }
    } catch (err) {
      totalFailed++
      captureException(err, { context: 'cron-relances', appel_id: appel.id })
    }
  }

  const durationMs = Date.now() - startedAt

  return NextResponse.json({
    success: true,
    totalSent,
    totalSkipped,
    totalFailed,
    durationMs,
  })
})
