import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { captureException } from '@/lib/monitoring'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const coproprieteId = searchParams.get('copropriete_id')
    if (!coproprieteId) return NextResponse.json({ error: 'copropriete_id requis' }, { status: 400 })

    const { data, error } = await supabase
      .from('conseil_syndical')
      .select('*')
      .eq('copropriete_id', coproprieteId)
      .order('role')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (err) {
    captureException(err, { context: 'conseil-syndical-get' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const { copropriete_id, prenom, nom, email, telephone, role, lot_numero, date_debut, date_fin } = body

    if (!copropriete_id || !prenom || !nom) return NextResponse.json({ error: 'copropriete_id, prenom et nom requis' }, { status: 400 })

    const { data, error } = await supabase
      .from('conseil_syndical')
      .insert({ copropriete_id, prenom, nom, email, telephone, role: role ?? 'membre', lot_numero, date_debut, date_fin })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    captureException(err, { context: 'conseil-syndical-post' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
