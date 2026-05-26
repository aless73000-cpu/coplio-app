import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api-handler'
import { logAction } from '@/lib/audit'
import { checkQuota, quotaExceededResponse } from '@/lib/plan-guard'

export const GET = withErrorHandler(async (request: Request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single()
  if (!profile?.cabinet_id) return NextResponse.json([])

  const { searchParams } = new URL(request.url)
  const page = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10) || 0)
  const perPage = Math.min(200, Math.max(1, parseInt(searchParams.get('per_page') ?? '200', 10) || 200))
  const from = page * perPage
  const to = from + perPage - 1

  const { data, error, count } = await supabase
    .from('coproprietes')
    .select('id, nom, adresse, ville, nb_lots', { count: 'exact' })
    .eq('cabinet_id', profile.cabinet_id)
    .order('nom')
    .range(from, to)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [], total: count ?? 0, page, perPage })
})

const schema = z.object({
  nom: z.string().min(2),
  adresse: z.string().min(5),
  code_postal: z.string().min(5),
  ville: z.string().min(2),
  nb_lots: z.number().min(1),
  tantiemes_totaux: z.number().default(10000),
  annee_construction: z.number().optional(),
  surface_totale: z.number().optional(),
  assureur: z.string().optional(),
})

export const POST = withErrorHandler(async (request: Request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single()
  if (!profile?.cabinet_id) return NextResponse.json({ error: 'Cabinet non trouvé' }, { status: 400 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const admin = createAdminClient()

  const quota = await checkQuota(profile.cabinet_id, 'coproprietes')
  if (!quota.allowed) return quotaExceededResponse(quota)

  const { data, error } = await admin.from('coproprietes').insert({
    ...parsed.data,
    cabinet_id: profile.cabinet_id,
    gestionnaire_id: user.id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAction(admin, {
    cabinet_id: profile.cabinet_id,
    user_id: user.id,
    action: 'create',
    entite: 'copropriete',
    entite_id: data.id,
    entite_nom: parsed.data.nom,
  })

  return NextResponse.json(data)
})
