import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireCabinetUser } from '@/lib/api-handler'

const schema = z.object({
  copropriete_id: z.string().uuid(),
  titre: z.string().min(3),
  type: z.enum(['ordinaire', 'extraordinaire']),
  date_ag: z.string(),
  lieu: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const ctx = await requireCabinetUser()
    if (ctx instanceof NextResponse) return ctx

    const { cabinetId } = ctx
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

    const admin = createAdminClient()
    const { data, error } = await admin.from('assemblees_generales').insert({
      ...parsed.data,
      cabinet_id: cabinetId,
      status: 'planifiee',
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
