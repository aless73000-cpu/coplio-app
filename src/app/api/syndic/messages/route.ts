import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

async function getCabinetId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single()
  return { user, cabinet_id: profile?.cabinet_id }
}

export async function GET(req: Request) {
  try {
    const ctx = await getCabinetId()
    if (!ctx) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') ?? 'support'

    const admin = createAdminClient()

    if (type === 'support') {
      const { data, error } = await admin
        .from('admin_support_messages')
        .select('*')
        .eq('cabinet_id', ctx.cabinet_id)
        .order('created_at', { ascending: true })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data ?? [])
    }

    return NextResponse.json([])
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const schema = z.object({ contenu: z.string().min(1) })

export async function POST(req: Request) {
  try {
    const ctx = await getCabinetId()
    if (!ctx) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('admin_support_messages')
      .insert({
        cabinet_id: ctx.cabinet_id,
        sender_type: 'client',
        sender_email: ctx.user.email,
        contenu: parsed.data.contenu,
      })
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
