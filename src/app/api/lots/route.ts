import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { checkQuota, quotaExceededResponse } from '@/lib/plan-guard'
import { requireCabinetUser } from '@/lib/api-handler'

export async function GET() {
  try {
    const ctx = await requireCabinetUser()
    if (ctx instanceof NextResponse) return ctx

    const { cabinetId } = ctx
    const admin = createAdminClient()
    const { data: coproprietes } = await admin.from('coproprietes').select('id').eq('cabinet_id', cabinetId)
    const coproprieteIds = (coproprietes ?? []).map((c: { id: string }) => c.id)
    if (coproprieteIds.length === 0) return NextResponse.json([])

    const { data, error } = await admin
      .from('lots')
      .select('id, numero, type, copropriete:coproprietes(id, nom)')
      .in('copropriete_id', coproprieteIds)
      .order('numero')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const schema = z.object({
  copropriete_id: z.string().uuid(),
  numero: z.string().min(1),
  type: z.enum(['appartement', 'maison', 'local_commercial', 'parking', 'cave', 'autre']),
  etage: z.string().optional(),
  surface: z.number().optional(),
  tantiemes: z.number().min(1),
})

export async function POST(request: Request) {
  try {
    const ctx = await requireCabinetUser()
    if (ctx instanceof NextResponse) return ctx

    const { cabinetId } = ctx
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

    const quota = await checkQuota(cabinetId, 'lots', 1)
    if (!quota.allowed) return quotaExceededResponse(quota)

    const admin = createAdminClient()
    const { data, error } = await admin.from('lots').insert(parsed.data).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
