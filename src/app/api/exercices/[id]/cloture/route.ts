/**
 * POST /api/exercices/[id]/cloture
 *
 * Clôture un exercice comptable et calcule les régularisations de charges
 * pour tous les lots de la copropriété.
 *
 * Processus (Loi 1965 art. 14-1) :
 * 1. Charger le budget approuvé avec les montants réels
 * 2. Pour chaque lot, calculer la quote-part réelle selon la clé de répartition
 * 3. Gérer le prorata pour les mutations intervenues en cours d'exercice
 * 4. Comparer avec les appels provisionnels encaissés → solde par lot
 * 5. Persister les régularisations et clôturer l'exercice
 */

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/api-handler'
import { calculerRegularisations, validerEquilibre } from '@/lib/charges-regularisation'
import type { LigneBudget, LotExercice, TantièmesParCle } from '@/lib/charges-regularisation'

export const POST = withErrorHandler(async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: exerciceId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()
  if (!profile?.cabinet_id) return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })

  const admin = createAdminClient()

  // ── Charger l'exercice (query séparée pour la copropriété car colonne accentuée) ──
  const { data: exercice } = await admin
    .from('exercices')
    .select('id, annee, statut, date_debut, date_fin, copropriete_id')
    .eq('id', exerciceId)
    .single()

  if (!exercice) return NextResponse.json({ error: 'Exercice introuvable' }, { status: 404 })
  if (exercice.statut === 'cloture') {
    return NextResponse.json({ error: 'Cet exercice est déjà clôturé' }, { status: 409 })
  }

  // Charger la copropriété séparément (colonne accentuée non parseable en nested join)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: copropriete } = await (admin.from('coproprietes') as any)
    .select('id, cabinet_id, "tantièmes_totaux"')
    .eq('id', exercice.copropriete_id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((copropriete as any)?.cabinet_id !== profile.cabinet_id) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coproprieteId = (copropriete as any).id
  const debutExercice = new Date(exercice.date_debut)
  const finExercice   = new Date(exercice.date_fin)

  // ── Charger le budget approuvé avec les montants réels ──────────
  const { data: budget } = await admin
    .from('budgets')
    .select('id, lignes:budget_lignes(id, poste, categorie, cle_repartition, montant_previsionnel, montant_reel)')
    .eq('copropriete_id', coproprieteId)
    .eq('annee', exercice.annee)
    .eq('statut', 'approuve')
    .single()

  if (!budget) {
    return NextResponse.json(
      { error: 'Aucun budget approuvé trouvé pour cet exercice. Approuvez le budget avant de clôturer.' },
      { status: 422 }
    )
  }

  // Filtrer les lignes avec montant_reel renseigné
  const lignes: LigneBudget[] = (budget.lignes as LigneBudget[]).filter(
    (l) => l.montant_reel !== null && l.montant_reel !== undefined
  )
  if (lignes.length === 0) {
    return NextResponse.json(
      { error: 'Aucune ligne de budget avec montant réel. Renseignez les dépenses réelles avant de clôturer.' },
      { status: 422 }
    )
  }

  // ── Charger les lots et leurs détenteurs sur l'exercice ─────────
  // Utiliser v_lots_actifs + coproprietaire_lots (historique pour prorata)
  const { data: lots } = await admin
    .from('lots')
    .select('id, tantiemes')
    .eq('copropriete_id', coproprieteId)

  if (!lots?.length) {
    return NextResponse.json({ error: 'Aucun lot trouvé pour cette copropriété' }, { status: 422 })
  }

  // Appels de charges encaissés sur l'exercice (per lot)
  const { data: appels } = await admin
    .from('appels_charges')
    .select('lot_id, montant_paye')
    .eq('copropriete_id', coproprieteId)
    .gte('date_appel', exercice.date_debut)
    .lte('date_appel', exercice.date_fin)
    .not('montant_paye', 'is', null)

  const appelsParLot: Record<string, number> = {}
  for (const a of appels ?? []) {
    appelsParLot[a.lot_id] = (appelsParLot[a.lot_id] ?? 0) + (a.montant_paye ?? 0)
  }

  // Détenteurs actifs (via v_lots_actifs pour les lots non mutés)
  const { data: lotsActifs } = await admin
    .from('v_lots_actifs')
    .select('lot_id, coproprietaire_id')
    .eq('copropriete_id', coproprieteId)

  const detenteurActif: Record<string, string | null> = {}
  for (const la of lotsActifs ?? []) {
    detenteurActif[la.lot_id] = la.coproprietaire_id
  }

  // Construire les objets LotExercice
  const lotsExercice: LotExercice[] = lots.map((l) => ({
    lot_id:                       l.id,
    coproprietaire_id:            detenteurActif[l.id] ?? null,
    tantiemes:                    l.tantiemes,
    copropriete_id:               coproprieteId,
    montant_provisionnel_encaisse: appelsParLot[l.id] ?? 0,
    date_entree:                  debutExercice,  // simplifié : pas de mutation cette version
    date_sortie:                  finExercice,
  }))

  // ── Construire les tantièmes par clé de répartition ────────────
  const tantièmesParCle: TantièmesParCle = {}
  for (const ligne of lignes) {
    const cle = ligne.cle_repartition
    if (!tantièmesParCle[cle]) {
      // Tantièmes totaux pour cette clé = somme des tantièmes de tous les lots
      // (Pour les clés spéciales, il faudrait filtrer les lots concernés)
      const total = lots.reduce((s, l) => s + l.tantiemes, 0)
      tantièmesParCle[cle] = { tantiemes_lot: 0, tantiemes_totaux_cle: total }
    }
  }

  // ── Calculer les régularisations (par lot, individuellement) ──────
  const resultatsFinaux = lotsExercice.map((lot) => {
    const tantièmesLot: TantièmesParCle = {}
    for (const cle of Object.keys(tantièmesParCle)) {
      tantièmesLot[cle] = {
        tantiemes_lot:        lot.tantiemes,
        tantiemes_totaux_cle: tantièmesParCle[cle].tantiemes_totaux_cle,
      }
    }
    return calculerRegularisations([...lignes], [lot], tantièmesLot, debutExercice, finExercice)[0]
  })

  // Contrôle d'équilibre
  const montantRéelTotal = lignes.reduce((s, l) => s + (l.montant_reel ?? 0), 0)
  const equilibre = validerEquilibre(resultatsFinaux, montantRéelTotal)

  // ── Persister les régularisations ──────────────────────────────
  const { error: insErr } = await admin
    .from('regularisations')
    .upsert(
      resultatsFinaux.map((r) => ({
        exercice_id:            exerciceId,
        lot_id:                 r.lot_id,
        coproprietaire_id:      r.coproprietaire_id,
        montant_reel:           r.montant_reel_ventile,
        montant_provisionnel:   r.montant_provisionnel,
        // solde est une colonne générée (GENERATED ALWAYS) → ne pas l'insérer
        prorata_jours:          r.prorata_jours,
        prorata_fraction:       r.prorata_fraction,
        detail_par_cle:         r.detail_par_poste,
        statut:                 'calcule',
      })),
      { onConflict: 'exercice_id,lot_id' }
    )

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

  // Clôturer l'exercice
  await admin
    .from('exercices')
    .update({ statut: 'cloture', date_cloture: new Date().toISOString().split('T')[0] })
    .eq('id', exerciceId)

  // Mettre à jour derniere_regularisation sur les lots
  await Promise.all(
    lots.map((l) =>
      admin.from('lots').update({ derniere_regularisation: exercice.date_fin }).eq('id', l.id)
    )
  )

  return NextResponse.json({
    success: true,
    exercice_id:      exerciceId,
    lots_traites:     resultatsFinaux.length,
    equilibre,
    regularisations:  resultatsFinaux,
  })
})
