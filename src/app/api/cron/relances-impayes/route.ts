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

export async function GET(request: Request) {
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
    console.error('[Cron relances] Erreur Supabase:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let totalSent = 0
  let totalSkipped = 0
  let totalFailed = 0

  for (const appel of appels ?? []) {
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

      // Ne pas renvoyer si déjà relancé dans les 25 derniers jours
      if (appel.derniere_relance_at) {
        const derniereRelance = new Date(appel.derniere_relance_at)
        const joursDepuisRelance = Math.floor(
          (today.getTime() - derniereRelance.getTime()) / (1000 * 60 * 60 * 24)
        )
        if (joursDepuisRelance < 25) { totalSkipped++; continue }
      }

      // Ne pas envoyer un niveau inférieur à ce qui a déjà été envoyé
      if (appel.nb_relances >= palier.niveau) { totalSkipped++; continue }

      // Trouver le copropriétaire lié au lot
      const { data: ownerProfile } = await admin
        .from('profiles')
        .select('prenom, nom, email')
        .eq('lot_id', appel.lot_id)
        .eq('role', 'owner_resident')
        .single()

      if (!ownerProfile?.email) { totalSkipped++; continue }

      // Trouver le cabinet pour son nom
      const copropriete = appel.copropriete as unknown as { id: string; nom: string; cabinet_id: string } | null
      const { data: cabinet } = await admin
        .from('cabinets')
        .select('nom')
        .eq('id', copropriete?.cabinet_id ?? '')
        .single()

      const montantDu = appel.montant - appel.montant_paye

      const result = await Email.relanceImpayes(
        {
          prenom: ownerProfile.prenom ?? '',
          nom: ownerProfile.nom ?? '',
          montant: formatEuro(montantDu),
          dateEcheance: formatDate(appel.date_echeance),
          cabinetNom: cabinet?.nom ?? 'Votre syndic',
          nomCopropriete: copropriete?.nom ?? 'votre résidence',
          numeroLot: (appel.lot as unknown as { numero: string } | null)?.numero ?? '',
          niveau: palier.niveau,
          portailUrl: `${appUrl}/mes-charges`,
        },
        ownerProfile.email
      )

      if (result.success) {
        // Mettre à jour le compteur
        await admin
          .from('appels_charges')
          .update({
            nb_relances: palier.niveau,
            derniere_relance_at: new Date().toISOString(),
          })
          .eq('id', appel.id)

        totalSent++
      } else {
        totalFailed++
      }
    } catch (err) {
      totalFailed++
      console.error(`[Cron relances] Erreur appel ${appel.id}:`, err)
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
}
