import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user && ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '') ? user : null
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    if (!await checkAdmin()) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

    const admin = createAdminClient()
    const [cabinetRes, profilesRes] = await Promise.all([
      admin.from('cabinets').select('*').eq('id', params.id).single(),
      admin.from('profiles').select('id, prenom, nom, email, role, created_at').eq('cabinet_id', params.id),
    ])

    if (cabinetRes.error || !cabinetRes.data) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })
    return NextResponse.json({ cabinet: cabinetRes.data, profiles: profilesRes.data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const updateSchema = z.object({
  plan: z.enum(['trial', 'starter', 'pro', 'expert']).optional(),
  subscription_status: z.enum(['active', 'trialing', 'past_due', 'canceled', 'incomplete']).optional(),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!await checkAdmin()) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

    const admin = createAdminClient()
    const { data, error } = await admin.from('cabinets').update(parsed.data).eq('id', params.id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    if (!await checkAdmin()) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

    const admin = createAdminClient()
    const { error } = await admin.from('cabinets').delete().eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
