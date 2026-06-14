import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, requireCabinetUser } from '@/lib/api-handler'

const schema = z.object({
  copropriete_id: z.string().uuid(),
  type: z.enum(['cle', 'badge', 'code', 'telecommande', 'autre']).default('cle'),
  description: z.string().min(1),
  localisation: z.string().optional(),
  detenteur_id: z.string().uuid().optional().nullable(),
  detenteur_nom: z.string().optional(),
  date_remise: z.string().optional().nullable(),
  notes: z.string().optional(),
})

export const GET = withErrorHandler(async (request: Request) => {
  const auth = await requireCabinetUser()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const { searchParams } = new URL(request.url)
  const coproprieteId = searchParams.get('copropriete_id')

  let query = supabase
    .from('cles_acces')
    .select('*, detenteur:profiles(id, prenom, nom)')
    .order('created_at', { ascending: false })

  if (coproprieteId) query = query.eq('copropriete_id', coproprieteId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
})

export const POST = withErrorHandler(async (request: Request) => {
  const auth = await requireCabinetUser()
  if (auth instanceof NextResponse) return auth
  const { supabase, cabinetId } = auth

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { data, error } = await supabase
    .from('cles_acces')
    .insert({ ...parsed.data, cabinet_id: cabinetId })
    .select('*, detenteur:profiles(id, prenom, nom)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
})
