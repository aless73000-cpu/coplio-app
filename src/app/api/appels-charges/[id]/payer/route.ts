import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/api-handler'
import { logAction } from '@/lib/audit'

export const PATCH = withErrorHandler(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params

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

  // Charger l'appel avec copropriété
  const { data: appel } = await admin
    .from('appels_charges')
    .select('id, montant, libelle, copropriete_id, date_appel, copropriete:coproprietes(cabinet_id)')
    .eq('id', id)
    .single()

  if (!appel) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((appel.copropriete as { cabinet_id: string } | null)?.cabinet_id !== profile.cabinet_id) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const today = new Date().toISOString().slice(0, 10)

  // Marquer comme payé
  const { error: payErr } = await admin
    .from('appels_charges')
    .update({ paye: true, montant_paye: appel.montant, date_paiement: today })
    .eq('id', id)

  if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 })

  // ─── Générer l'écriture comptable automatiquement ──────────────
  // Chercher le journal BQ (Banque) de la copropriété
  const { data: journalBQ } = await admin
    .from('journaux')
    .select('id')
    .eq('copropriete_id', appel.copropriete_id)
    .eq('type_journal', 'banque')
    .eq('actif', true)
    .limit(1)
    .single()

  // Chercher l'exercice en cours
  const { data: exercice } = await admin
    .from('exercices')
    .select('id')
    .eq('copropriete_id', appel.copropriete_id)
    .eq('statut', 'en_cours')
    .order('annee', { ascending: false })
    .limit(1)
    .single()

  // Chercher les comptes 512 (Banque) et 701 (Produits charges)
  const { data: comptes } = await admin
    .from('comptes_comptables')
    .select('id, numero')
    .is('cabinet_id', null)
    .or('numero.like.512%,numero.like.701%')
    .eq('type_compte', 'detail')

  const compteBanque  = (comptes ?? []).find(c => c.numero.startsWith('512'))
  const compteCharges = (comptes ?? []).find(c => c.numero.startsWith('701'))

  // Créer l'écriture seulement si journal + comptes trouvés
  if (journalBQ && compteBanque && compteCharges) {
    const { data: ecriture } = await admin
      .from('ecritures_comptables')
      .insert({
        copropriete_id: appel.copropriete_id,
        journal_id:     journalBQ.id,
        exercice_id:    exercice?.id ?? null,
        date_ecriture:  today,
        libelle:        `Encaissement — ${appel.libelle}`,
        statut:         'valide',
        created_by:     user.id,
      })
      .select('id')
      .single()

    if (ecriture) {
      // Ligne 1 : Débit Banque (512)
      // Ligne 2 : Crédit Produits charges (701)
      await admin.from('lignes_ecriture').insert([
        {
          ecriture_id: ecriture.id,
          compte_id:   compteBanque.id,
          debit:       appel.montant,
          credit:      0,
          libelle:     appel.libelle,
          ordre:       0,
        },
        {
          ecriture_id: ecriture.id,
          compte_id:   compteCharges.id,
          debit:       0,
          credit:      appel.montant,
          libelle:     appel.libelle,
          ordre:       1,
        },
      ])
    }
  }
  // ── Fin génération écriture ──────────────────────────────────

  await logAction(admin, {
    cabinet_id: profile.cabinet_id,
    user_id: user.id,
    action: 'pay',
    entite: 'appel_charges',
    entite_id: appel.id,
    entite_nom: appel.libelle,
  })

  return NextResponse.json({ success: true })
})
