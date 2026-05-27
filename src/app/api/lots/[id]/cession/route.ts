/**
 * POST /api/lots/[id]/cession
 *
 * Enregistre la mutation (vente) d'un lot :
 * 1. Clôture la détention de l'ancien propriétaire (date_fin + motif)
 * 2. Crée une nouvelle ligne de détention pour le nouvel acquéreur
 * 3. Transfère les fonds de travaux au nouvel acquéreur (ALUR art. 14-2)
 *
 * Loi ALUR : les fonds de travaux ne peuvent pas être remboursés au vendeur.
 * Ils sont automatiquement transférés à l'acheteur lors de la mutation.
 */

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api-handler'

const cessionSchema = z.object({
  /** UUID du coproprietaire acquéreur (doit déjà exister dans coproprietaires) */
  acquereur_id:   z.string().uuid(),
  /** Date de l'acte notarié — le jour est attribué à l'acheteur */
  date_mutation:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD attendu'),
  /** Motif de la cession */
  motif_fin:      z.enum(['vente', 'succession', 'donation', 'saisie', 'autre']).default('vente'),
  /** Note libre (ex: nom du notaire, numéro d'acte) */
  note:           z.string().optional(),
})

export const POST = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: lotId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()
  if (!profile?.cabinet_id) return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })

  const body = await request.json()
  const parsed = cessionSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const admin = createAdminClient()

  // Vérifier que le lot appartient à ce cabinet
  const { data: lot } = await admin
    .from('lots')
    .select('id, copropriete:coproprietes(id, cabinet_id)')
    .eq('id', lotId)
    .single()

  if (!lot) return NextResponse.json({ error: 'Lot introuvable' }, { status: 404 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((lot.copropriete as any)?.cabinet_id !== profile.cabinet_id) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  // Trouver la détention active (date_fin IS NULL)
  const { data: detentionActive } = await admin
    .from('coproprietaire_lots')
    .select('coproprietaire_id, date_acquisition')
    .eq('lot_id', lotId)
    .is('date_fin', null)
    .single()

  if (!detentionActive) {
    return NextResponse.json({ error: 'Aucun propriétaire actif trouvé pour ce lot' }, { status: 404 })
  }

  const vendeurId    = detentionActive.coproprietaire_id
  const dateMutation = parsed.data.date_mutation
  const acquereurId  = parsed.data.acquereur_id

  if (vendeurId === acquereurId) {
    return NextResponse.json({ error: 'Le vendeur et l\'acquéreur sont la même personne' }, { status: 400 })
  }

  // Vérifier que l'acquéreur appartient à ce cabinet
  const { data: acquereur } = await admin
    .from('coproprietaires')
    .select('id')
    .eq('id', acquereurId)
    .eq('cabinet_id', profile.cabinet_id)
    .single()

  if (!acquereur) {
    return NextResponse.json({ error: 'Acquéreur introuvable. Créez d\'abord le copropriétaire.' }, { status: 404 })
  }

  // ── 1. Clôturer la détention du vendeur ───────────────────────
  const veilleMutation = new Date(dateMutation)
  veilleMutation.setDate(veilleMutation.getDate() - 1)
  const dateFinVendeur = veilleMutation.toISOString().split('T')[0]

  const { error: updateErr } = await admin
    .from('coproprietaire_lots')
    .update({
      date_fin:  dateFinVendeur,
      motif_fin: parsed.data.motif_fin,
      notes:     parsed.data.note ?? null,
    })
    .eq('coproprietaire_id', vendeurId)
    .eq('lot_id', lotId)
    .is('date_fin', null)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // ── 2. Créer la détention de l'acquéreur ──────────────────────
  const { error: insertErr } = await admin
    .from('coproprietaire_lots')
    .insert({
      coproprietaire_id: acquereurId,
      lot_id:            lotId,
      date_acquisition:  dateMutation,
      date_fin:          null,
      motif_fin:         null,
    })

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

  // ── 3. Transférer les fonds de travaux (ALUR art. 14-2) ───────
  // Les fonds de travaux ne sont PAS remboursés au vendeur.
  // Ils restent attachés au lot → le solde actuel est transféré à l'acquéreur.
  // On trace le transfert via un mouvement "transfert_mutation".
  const { data: fondsTravaux } = await admin
    .from('fonds_travaux')
    .select('id, solde_actuel, lot_id')
    .eq('lot_id', lotId)

  const transferts = []
  for (const ft of fondsTravaux ?? []) {
    if (ft.solde_actuel && ft.solde_actuel > 0) {
      // Insérer un mouvement de transfert pour traçabilité
      transferts.push(
        admin.from('fonds_travaux_mouvements').insert({
          fonds_travaux_id: ft.id,
          date_mouvement:   dateMutation,
          type_mouvement:   'transfert_mutation',
          montant:          0, // Le solde reste sur le fonds, pas de mouvement monétaire
          libelle:          `Transfert mutation : lot cédé de ${vendeurId} à ${acquereurId} — fonds ALUR conservés sur le lot (non remboursables)`,
        })
      )
    }
  }
  await Promise.all(transferts)

  return NextResponse.json({
    success: true,
    lot_id:             lotId,
    vendeur_id:         vendeurId,
    acquereur_id:       acquereurId,
    date_mutation:      dateMutation,
    date_fin_vendeur:   dateFinVendeur,
    fonds_travaux_transferes: (fondsTravaux ?? []).length,
    message: 'Mutation enregistrée. Les fonds de travaux restent attachés au lot (ALUR art. 14-2).',
  })
})
