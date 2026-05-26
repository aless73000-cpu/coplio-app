import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api-handler'

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

export const GET = withErrorHandler(async (request: Request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single()
  if (!profile?.cabinet_id) return NextResponse.json([])

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  let query = supabase
    .from('evenements_cabinet')
    .select('*, assignee:profiles(id, prenom, nom), copropriete:coproprietes(id, nom)')
    .eq('cabinet_id', profile.cabinet_id)
    .order('date_debut', { ascending: true })

  if (from) query = query.gte('date_debut', from)
  if (to) query = query.lte('date_debut', to)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
})

export const POST = withErrorHandler(async (request: Request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single()
  if (!profile?.cabinet_id) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { data, error } = await supabase
    .from('evenements_cabinet')
    .insert({ ...parsed.data, cabinet_id: profile.cabinet_id, created_by: user.id })
    .select('*, assignee:profiles(id, prenom, nom), copropriete:coproprietes(id, nom)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
})
