import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Relevé annuel de charges par copropriétaire (annexe AG)
 * GET /api/comptabilite/releve-annuel?copropriete=...&exercice=...&lot_id=... (optionnel)
 * Retourne un CSV avec toutes les charges ventilées par lot
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const coproprieteId = searchParams.get('copropriete')
  const exerciceId    = searchParams.get('exercice')
  const lotId         = searchParams.get('lot_id') // optionnel : filtrer sur un seul lot

  if (!coproprieteId || !exerciceId) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Isolation cabinet
  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single()
  if (!profile?.cabinet_id) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  const { data: copropCheck } = await supabase.from('coproprietes').select('id').eq('id', coproprieteId).eq('cabinet_id', profile.cabinet_id).single()
  if (!copropCheck) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  // Exercice
  const { data: exercice } = await supabase
    .from('exercices')
    .select('annee, date_debut, date_fin')
    .eq('id', exerciceId)
    .single()

  if (!exercice) return NextResponse.json({ error: 'Exercice introuvable' }, { status: 404 })

  // Appels de charges de la période
  let query = supabase
    .from('appels_charges')
    .select(`
      id, lot_id, libelle, montant, montant_paye, date_appel, date_echeance, date_paiement, paye,
      lot:lots(numero, tantiemes)
    `)
    .eq('copropriete_id', coproprieteId)
    .gte('date_appel', exercice.date_debut)
    .lte('date_appel', exercice.date_fin)
    .order('date_appel', { ascending: true })

  if (lotId) query = query.eq('lot_id', lotId)

  const { data: appels } = await query

  if (!appels || appels.length === 0) {
    return NextResponse.json({ error: 'Aucun appel de charges sur cet exercice' }, { status: 404 })
  }

  // Récupérer les copropriétaires par lot_id (profiles liés via lot_id)
  const lotIds = Array.from(new Set(appels.map(a => a.lot_id).filter(Boolean)))
  const { data: profilesParLot } = lotIds.length
    ? await supabase
        .from('profiles')
        .select('lot_id, prenom, nom, email')
        .in('lot_id', lotIds)
        .eq('role', 'owner_resident')
    : { data: [] }

  const profileMap: Record<string, { prenom: string | null; nom: string | null; email: string | null }> = {}
  for (const p of profilesParLot ?? []) {
    if (p.lot_id) profileMap[p.lot_id] = { prenom: p.prenom, nom: p.nom, email: p.email }
  }

  const escape = (s: string | null | number | undefined): string => {
    if (s === null || s === undefined) return ''
    const str = String(s)
    if (str.includes(';') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const fmt = (n: number | null): string => {
    if (!n) return '0,00'
    return n.toFixed(2).replace('.', ',')
  }

  const fmtDate = (d: string | null): string => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('fr-FR')
  }

  const header = [
    'Lot',
    'Tantièmes',
    'Copropriétaire',
    'Date appel',
    'Libellé',
    'Montant appelé',
    'Montant payé',
    'Solde',
    'Date paiement',
    'Statut',
  ].join(';')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (appels as any[]).map(a => {
    const montant = a.montant ?? 0
    const paye = a.montant_paye ?? 0
    const proprio = a.lot_id ? profileMap[a.lot_id] : null
    return [
      escape(a.lot?.numero),
      escape(a.lot?.tantiemes),
      escape(proprio ? `${proprio.prenom ?? ''} ${proprio.nom ?? ''}`.trim() : ''),
      escape(fmtDate(a.date_appel)),
      escape(a.libelle),
      fmt(montant),
      fmt(paye),
      fmt(montant - paye),
      escape(fmtDate(a.date_paiement)),
      escape(a.paye ? 'Payé' : 'Impayé'),
    ].join(';')
  })

  // Ligne totaux
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalAppele = (appels as any[]).reduce((s, a) => s + (a.montant ?? 0), 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalPaye   = (appels as any[]).reduce((s, a) => s + (a.montant_paye ?? 0), 0)
  const totalRow = [
    'TOTAL', '', '', '', '',
    fmt(totalAppele),
    fmt(totalPaye),
    fmt(totalAppele - totalPaye),
    '', '',
  ].join(';')

  const bom = '﻿'
  const content = bom + [header, ...rows, '', totalRow].join('\r\n')

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="Releve_charges_${exercice.annee}.csv"`,
    },
  })
}
