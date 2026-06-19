import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { requireCabinetUser } from '@/lib/api-handler'

const STATUTS = ['brouillon', 'emise', 'payee', 'annulee'] as const

// PATCH /api/factures-honoraires/[id] — met à jour le statut / les notes
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await requireCabinetUser()
  if (auth instanceof NextResponse) return auth
  const { supabase, cabinetId } = auth
  const db = supabase as unknown as SupabaseClient

  const body = await request.json().catch(() => null)
  const patch: Record<string, unknown> = {}
  if (body?.statut && STATUTS.includes(body.statut)) patch.statut = body.statut
  if (typeof body?.notes === 'string') patch.notes = body.notes

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Rien à mettre à jour' }, { status: 400 })
  }

  const { data, error } = await db
    .from('factures_honoraires')
    .update(patch)
    .eq('id', id)
    .eq('cabinet_id', cabinetId)
    .select('*, copropriete:coproprietes(nom)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  return NextResponse.json(data)
}

// DELETE /api/factures-honoraires/[id] — supprime une facture en brouillon
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await requireCabinetUser()
  if (auth instanceof NextResponse) return auth
  const { supabase, cabinetId } = auth
  const db = supabase as unknown as SupabaseClient

  const { error } = await db
    .from('factures_honoraires')
    .delete()
    .eq('id', id)
    .eq('cabinet_id', cabinetId)
    .eq('statut', 'brouillon')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
