import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireCabinetUser } from '@/lib/api-handler'

const schema = z.object({
  titre: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['visite', 'ag', 'intervention', 'rdv', 'rappel', 'autre']).default('autre'),
  date_debut: z.string(),
  date_fin: z.string().optional().nullable(),
  lieu: z.string().optional(),
  assignee_id: z.string().uuid().optional().nullable(),
  copropriete_id: z.string().uuid().optional().nullable(),
})

export async function GET(request: Request) {
  try {
    const ctx = await requireCabinetUser()
    if (ctx instanceof NextResponse) return ctx

    const { supabase, cabinetId } = ctx
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    let query = supabase
      .from('evenements_cabinet')
      .select('*, assignee:profiles(id, prenom, nom), copropriete:coproprietes(id, nom)')
      .eq('cabinet_id', cabinetId)
      .order('date_debut', { ascending: true })

    if (from) query = query.gte('date_debut', from)
    if (to) query = query.lte('date_debut', to)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('[API Error]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireCabinetUser()
    if (ctx instanceof NextResponse) return ctx

    const { supabase, userId, cabinetId } = ctx
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    const { data, error } = await supabase
      .from('evenements_cabinet')
      .insert({ ...parsed.data, cabinet_id: cabinetId, created_by: userId })
      .select('*, assignee:profiles(id, prenom, nom), copropriete:coproprietes(id, nom)')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('[API Error]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
