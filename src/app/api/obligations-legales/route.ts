import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, requireCabinetUser } from '@/lib/api-handler'
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

export const GET = withErrorHandler(async (request: Request) => {
  try {
    const auth = await requireCabinetUser()
    if (auth instanceof NextResponse) return auth
    const { supabase } = auth

    const { searchParams } = new URL(request.url)
    const coproprieteId = searchParams.get('copropriete_id')

    let query = supabase.from('obligations_legales').select('*').order('date_expiration', { ascending: true, nullsFirst: false })
    if (coproprieteId) query = query.eq('copropriete_id', coproprieteId)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (err) {
    captureException(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})

export const POST = withErrorHandler(async (request: Request) => {
  try {
    const auth = await requireCabinetUser()
    if (auth instanceof NextResponse) return auth
    const { supabase, cabinetId } = auth

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    const { data, error } = await supabase
      .from('obligations_legales')
      .insert({ ...parsed.data, cabinet_id: cabinetId })
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    captureException(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})
