import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api-handler'

const createSchema = z.object({
  copropriete_id: z.string().uuid(),
  titre: z.string().min(2),
  description: z.string().optional(),
  date_debut: z.string(),
  date_fin: z.string(),
  statut: z.enum(['brouillon', 'ouvert', 'clos']).default('ouvert'),
  options: z.array(z.string().min(1)).min(2, 'Au moins 2 options'),
})

export const GET = withErrorHandler(async (request: Request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const coproprieteId = searchParams.get('copropriete_id')

  let query = supabase
    .from('votes')
    .select('*, copropriete:coproprietes(id, nom), options:vote_options(*), reponses:vote_reponses(id, option_id, coproprietaire_id)')
    .order('created_at', { ascending: false })

  if (coproprieteId) query = query.eq('copropriete_id', coproprieteId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
})

export const POST = withErrorHandler(async (request: Request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.cabinet_id || !['owner', 'manager'].includes(profile.role ?? '')) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { options, ...voteData } = parsed.data

  const { data: vote, error } = await supabase
    .from('votes')
    .insert({ ...voteData, cabinet_id: profile.cabinet_id, created_by: user.id })
    .select()
    .single()

  if (error || !vote) return NextResponse.json({ error: error?.message ?? 'Erreur' }, { status: 500 })

  await supabase.from('vote_options').insert(
    options.map((label, i) => ({ vote_id: vote.id, label, ordre: i }))
  )

  const { data: full } = await supabase
    .from('votes')
    .select('*, options:vote_options(*), reponses:vote_reponses(id, option_id, coproprietaire_id)')
    .eq('id', vote.id)
    .single()

  return NextResponse.json(full, { status: 201 })
})
