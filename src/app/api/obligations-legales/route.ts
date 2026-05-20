import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { captureException } from '@/lib/monitoring'

const schema = z.object({
  copropriete_id: z.string().uuid(),
  type: z.string().min(1),
  description: z.string().optional(),
  date_realisation: z.string().optional().nullable(),
  date_expiration: z.string().optional().nullable(),
  fichier_url: z.string().optional().nullable(),
  notes: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const coproprieteId = searchParams.get('copropriete_id')

    let query = supabase.from('obligations_legales').select('*').order('date_expiration', { ascending: true, nullsFirst: false })
    if (coproprieteId) query = query.eq('copropriete_id', coproprieteId)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (err) {
    captureException(err, { context: 'obligations-legales' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single()
    if (!profile?.cabinet_id) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    const { data, error } = await supabase
      .from('obligations_legales')
      .insert({ ...parsed.data, cabinet_id: profile.cabinet_id })
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    captureException(err, { context: 'obligations-legales' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
