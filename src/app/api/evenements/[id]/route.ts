import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { captureException } from '@/lib/monitoring'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const { data, error } = await supabase
      .from('evenements_cabinet')
      .update(body)
      .eq('id', params.id)
      .select('*, assignee:profiles(id, prenom, nom), copropriete:coproprietes(id, nom)')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    captureException(err, { context: 'evenements-id' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    await supabase.from('evenements_cabinet').delete().eq('id', params.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    captureException(err, { context: 'evenements-id' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
