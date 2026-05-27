/**
 * POST /api/assemblees/[id]/resolutions/[resolution_id]/resultat
 *
 * Recalcule et persiste le résultat (adoptee) d'une résolution en AG
 * en appliquant le MajorityEngine selon le type de vote (Art. 24/25/25-1/26).
 *
 * Appelé automatiquement après chaque vote depuis voterResolution(),
 * et manuellement par le gestionnaire pour forcer un recalcul.
 */

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/api-handler'
import { calculateMajority } from '@/lib/majority-engine'
import type { VoteType } from '@/lib/majority-engine'

export const POST = withErrorHandler(async (
  _request: Request,
  { params }: { params: Promise<{ id: string; resolution_id: string }> }
) => {
  const { id: agId, resolution_id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const admin = createAdminClient()

  // Vérifier appartenance cabinet
  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()

  // Charger l'AG (query séparée pour éviter ParserError sur colonne accentuée en nested join)
  const { data: ag } = await admin
    .from('assemblees_generales')
    .select('id, tantiemes_presents, copropriete_id')
    .eq('id', agId)
    .single()

  if (!ag) return NextResponse.json({ error: 'AG introuvable' }, { status: 404 })

  // Charger la copropriété séparément
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: copropriete } = await (admin.from('coproprietes') as any)
    .select('cabinet_id, "tantièmes_totaux", nb_copropriétaires')
    .eq('id', ag.copropriete_id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((copropriete as any)?.cabinet_id !== profile?.cabinet_id) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  // Charger la résolution
  const { data: resolution } = await admin
    .from('ag_resolutions')
    .select('id, type_vote, voix_pour, voix_contre, voix_abstention, tantiemes_pour, tantiemes_contre')
    .eq('id', resolution_id)
    .eq('ag_id', agId)
    .single()

  if (!resolution) return NextResponse.json({ error: 'Résolution introuvable' }, { status: 404 })

  // Recalculer les compteurs depuis les votes réels (source de vérité)
  const { data: votes } = await admin
    .from('ag_votes')
    .select('valeur, tantiemes')
    .eq('resolution_id', resolution_id)

  const compteurs = (votes ?? []).reduce(
    (acc, v) => {
      if (v.valeur === 'pour') {
        acc.voix_pour += 1
        acc.tantiemes_pour += v.tantiemes ?? 0
      } else if (v.valeur === 'contre') {
        acc.voix_contre += 1
        acc.tantiemes_contre += v.tantiemes ?? 0
      } else {
        acc.voix_abstention += 1
      }
      return acc
    },
    { voix_pour: 0, voix_contre: 0, voix_abstention: 0, tantiemes_pour: 0, tantiemes_contre: 0 }
  )

  // Calculer le résultat avec le MajorityEngine
  const result = calculateMajority({
    type_vote: (resolution.type_vote ?? 'art_24') as VoteType,
    tantiemes_pour:               compteurs.tantiemes_pour,
    tantiemes_contre:             compteurs.tantiemes_contre,
    voix_pour:                    compteurs.voix_pour,
    voix_contre:                  compteurs.voix_contre,
    voix_abstention:              compteurs.voix_abstention,
    tantiemes_presents:           ag.tantiemes_presents ?? 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tantiemes_totaux_copropriete: (copropriete as any)?.['tantièmes_totaux'] ?? 10000,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nombre_coproprietaires:       (copropriete as any)?.nb_copropriétaires ?? 0,
  })

  // Persister
  const { data: updated, error } = await admin
    .from('ag_resolutions')
    .update({
      ...compteurs,
      adoptee: result.adoptee,
    })
    .eq('id', resolution_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    resolution: updated,
    calcul: result,
  })
})
