import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { captureException } from '@/lib/monitoring'

const patchSchema = z.object({
  statut: z.enum(['brouillon', 'ouvert', 'clos']).optional(),
  titre: z.string().min(2).optional(),
  description: z.string().optional(),
  date_fin: z.string().optional(),
})

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data, error } = await supabase
      .from('votes')
      .select('*, options:vote_options(*), reponses:vote_reponses(id, option_id, coproprietaire_id)')
      .eq('id', params.id)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Vote introuvable' }, { status: 404 })
    return NextResponse.json(data)
  } catch (err) {
    captureException(err, { context: 'votes-id-get' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    const { data, error } = await supabase
      .from('votes')
      .update(parsed.data)
      .eq('id', params.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    captureException(err, { context: 'votes-id-patch' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    await supabase.from('votes').delete().eq('id', params.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    captureException(err, { context: 'votes-id-delete' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
