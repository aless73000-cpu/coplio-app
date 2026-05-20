import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { captureException } from '@/lib/monitoring'

const createSchema = z.object({
  copropriete_id: z.string().uuid(),
  annee: z.number().int().min(2020).max(2100),
})

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const url = new URL(request.url)
    const coproprieteId = url.searchParams.get('copropriete_id')

    let query = supabase.from('budgets').select('*').order('annee', { ascending: false })
    if (coproprieteId) query = query.eq('copropriete_id', coproprieteId)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    captureException(err, { context: 'budgets-get' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    const { data, error } = await supabase
      .from('budgets')
      .insert({ ...parsed.data, created_by: user.id })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Un budget existe déjà pour cette année' }, { status: 409 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    captureException(err, { context: 'budgets-post' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
