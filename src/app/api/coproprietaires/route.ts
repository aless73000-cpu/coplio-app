import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, requireCabinetUser } from '@/lib/api-handler'

export const GET = withErrorHandler(async (request: Request) => {
  const auth = await requireCabinetUser()
  if (auth instanceof NextResponse) return auth
  const { cabinetId } = auth

  const { searchParams } = new URL(request.url)
  const page = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10) || 0)
  const perPage = Math.min(200, Math.max(1, parseInt(searchParams.get('per_page') ?? '200', 10) || 200))
  const from = page * perPage
  const to = from + perPage - 1

  const admin = createAdminClient()
  const { data, error, count } = await admin
    .from('coproprietaires')
    .select('id, prenom, nom, email', { count: 'exact' })
    .eq('cabinet_id', cabinetId)
    .order('nom')
    .range(from, to)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [], total: count ?? 0, page, perPage })
})

const schema = z.object({
  prenom: z.string().min(1),
  nom: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  telephone: z.string().optional(),
  adresse_correspondance: z.string().optional(),
})

export const POST = withErrorHandler(async (request: Request) => {
  const auth = await requireCabinetUser()
  if (auth instanceof NextResponse) return auth
  const { cabinetId } = auth

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const { email, ...rest } = parsed.data
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('coproprietaires')
    .insert({
      ...rest,
      ...(email ? { email } : {}),
      cabinet_id: cabinetId,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
})
