import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api-handler'
import { requireAdmin } from '@/lib/admin-guard'
import { captureException } from '@/lib/monitoring'

export const GET = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  try {
    const check = await requireAdmin(req)
    if (check instanceof NextResponse) return check

    const admin = createAdminClient()
    const [cabinetRes, profilesRes] = await Promise.all([
      admin.from('cabinets').select('*').eq('id', params.id).single(),
      admin.from('profiles').select('id, prenom, nom, email, role, created_at').eq('cabinet_id', params.id),
    ])

    if (cabinetRes.error || !cabinetRes.data) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })
    return NextResponse.json({ cabinet: cabinetRes.data, profiles: profilesRes.data ?? [] })
  } catch (err) {
    captureException(err, { context: 'admin-client-get' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})

const updateSchema = z.object({
  plan: z.enum(['trial', 'starter', 'pro', 'expert']).optional(),
  subscription_status: z.enum(['active', 'trialing', 'past_due', 'canceled', 'incomplete']).optional(),
})

export const PATCH = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  try {
    const check = await requireAdmin(req)
    if (check instanceof NextResponse) return check

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

    const admin = createAdminClient()
    const { data, error } = await admin.from('cabinets').update(parsed.data).eq('id', params.id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    captureException(err, { context: 'admin-client-patch' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})

export const DELETE = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  try {
    const check = await requireAdmin(req)
    if (check instanceof NextResponse) return check

    const admin = createAdminClient()
    const { error } = await admin.from('cabinets').delete().eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    captureException(err, { context: 'admin-client-delete' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})
