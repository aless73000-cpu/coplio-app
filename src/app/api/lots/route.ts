import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { checkQuota, quotaExceededResponse } from '@/lib/plan-guard'
import { withErrorHandler } from '@/lib/api-handler'

export const GET = withErrorHandler(async (request: Request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single()
  if (!profile?.cabinet_id) return NextResponse.json({ error: 'Cabinet non trouvé' }, { status: 400 })

  const admin = createAdminClient()
  const { data: coproprietes } = await admin.from('coproprietes').select('id').eq('cabinet_id', profile.cabinet_id)
  const coproprieteIds = (coproprietes ?? []).map((c: { id: string }) => c.id)
  if (coproprieteIds.length === 0) return NextResponse.json([])

  const url = new URL(request.url)
  const coproprieteId = url.searchParams.get('copropriete_id')

  let query = admin
    .from('lots')
    .select('id, numero, etage, type, tantiemes, copropriete:coproprietes(id, nom)')
    .order('numero')
    .limit(2000)

  if (coproprieteId) {
    if (!coproprieteIds.includes(coproprieteId)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }
    query = query.eq('copropriete_id', coproprieteId)
  } else {
    query = query.in('copropriete_id', coproprieteIds)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
})

const schema = z.object({
  copropriete_id: z.string().uuid(),
  numero: z.string().min(1),
  type: z.enum(['appartement', 'maison', 'local_commercial', 'parking', 'cave', 'autre']),
  etage: z.string().optional(),
  surface: z.number().optional(),
  tantiemes: z.number().min(1),
})

export const POST = withErrorHandler(async (request: Request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  // Vérification quota via plan-guard
  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single()
  if (!profile?.cabinet_id) return NextResponse.json({ error: 'Cabinet introuvable' }, { status: 400 })

  const quota = await checkQuota(profile.cabinet_id, 'lots', 1)
  if (!quota.allowed) return quotaExceededResponse(quota)

  const admin = createAdminClient()
  const { data, error } = await admin.from('lots').insert(parsed.data).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
})
