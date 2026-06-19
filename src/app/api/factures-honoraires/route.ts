import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { requireCabinetUser } from '@/lib/api-handler'

const PERIODE_TYPES = ['mensuel', 'annuel', 'ponctuel'] as const

// GET /api/factures-honoraires?copropriete=... — liste les factures du cabinet
export async function GET(request: NextRequest) {
  const auth = await requireCabinetUser()
  if (auth instanceof NextResponse) return auth
  const { supabase, cabinetId } = auth
  const db = supabase as unknown as SupabaseClient

  const coproprieteId = new URL(request.url).searchParams.get('copropriete')

  let query = db
    .from('factures_honoraires')
    .select('*, copropriete:coproprietes(nom)')
    .eq('cabinet_id', cabinetId)
    .order('date_emission', { ascending: false })
    .order('created_at', { ascending: false })

  if (coproprieteId) query = query.eq('copropriete_id', coproprieteId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/factures-honoraires — crée une facture d'honoraires (brouillon)
export async function POST(request: NextRequest) {
  const auth = await requireCabinetUser()
  if (auth instanceof NextResponse) return auth
  const { supabase, cabinetId, userId } = auth
  const db = supabase as unknown as SupabaseClient

  const body = await request.json().catch(() => null)
  if (!body?.copropriete_id) {
    return NextResponse.json({ error: 'copropriete_id requis' }, { status: 400 })
  }

  // Isolation : la copropriété doit appartenir au cabinet
  const { data: copro } = await db
    .from('coproprietes')
    .select('id')
    .eq('id', body.copropriete_id)
    .eq('cabinet_id', cabinetId)
    .single()
  if (!copro) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const periodeType = PERIODE_TYPES.includes(body.periode_type) ? body.periode_type : 'mensuel'
  const ht = Math.max(0, Number(body.montant_ht) || 0)
  const taux = body.taux_tva != null ? Number(body.taux_tva) : 20
  const tva = Math.round(ht * taux) / 100
  const ttc = Math.round((ht + tva) * 100) / 100

  // Numéro séquentiel par cabinet et par année
  const year = new Date().getFullYear()
  const { count } = await db
    .from('factures_honoraires')
    .select('id', { count: 'exact', head: true })
    .eq('cabinet_id', cabinetId)
    .gte('date_emission', `${year}-01-01`)
  const numero = `FH-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`

  const { data, error } = await db
    .from('factures_honoraires')
    .insert({
      cabinet_id: cabinetId,
      copropriete_id: body.copropriete_id,
      numero,
      objet: typeof body.objet === 'string' && body.objet.trim() ? body.objet.trim() : 'Honoraires de gestion',
      periode_type: periodeType,
      periode_label: body.periode_label || null,
      date_emission: body.date_emission || new Date().toISOString().slice(0, 10),
      date_echeance: body.date_echeance || null,
      montant_ht: ht,
      taux_tva: taux,
      montant_tva: tva,
      montant_ttc: ttc,
      statut: 'brouillon',
      notes: body.notes || null,
      created_by: userId,
    })
    .select('*, copropriete:coproprietes(nom)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
