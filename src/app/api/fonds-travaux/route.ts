import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const coproprieteId = searchParams.get('copropriete_id')
  if (!coproprieteId) return NextResponse.json({ error: 'copropriete_id requis' }, { status: 400 })

  const { data, error } = await supabase
    .from('fonds_travaux')
    .select('*, mouvements:fonds_travaux_mouvements(*)')
    .eq('copropriete_id', coproprieteId)
    .order('annee', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()
  const { copropriete_id, annee, cotisation_annuelle, objectif_5ans, compte_bancaire, notes } = body

  if (!copropriete_id || !annee) return NextResponse.json({ error: 'copropriete_id et annee requis' }, { status: 400 })

  const { data, error } = await supabase
    .from('fonds_travaux')
    .insert({ copropriete_id, annee, cotisation_annuelle: cotisation_annuelle ?? 0, solde_actuel: 0, objectif_5ans: objectif_5ans ?? 0, compte_bancaire, notes })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
