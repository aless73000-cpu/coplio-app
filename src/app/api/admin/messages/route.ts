import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api-handler'
import { requireAdmin } from '@/lib/admin-guard'
import { captureException } from '@/lib/monitoring'

// GET - récupérer les messages (support ou interne)
export const GET = withErrorHandler(async (req: Request) => {
  try {
    const check = await requireAdmin(req)
    if (check instanceof NextResponse) return check

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') ?? 'support' // 'support' ou 'interne'
    const cabinet_id = searchParams.get('cabinet_id')

    const admin = createAdminClient()

    if (type === 'interne') {
      const { data, error } = await admin
        .from('admin_internal_messages')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data ?? [])
    }

    // Support messages
    let query = admin
      .from('admin_support_messages')
      .select('*, cabinet:cabinets(id, nom)')
      .order('created_at', { ascending: true })

    if (cabinet_id) query = query.eq('cabinet_id', cabinet_id)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (err) {
    captureException(err, { context: 'admin-messages-get' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})

const schema = z.object({
  type: z.enum(['support', 'interne']),
  contenu: z.string().min(1),
  cabinet_id: z.string().uuid().optional(),
})

// POST - envoyer un message
export const POST = withErrorHandler(async (req: Request) => {
  try {
    const check = await requireAdmin(req)
    if (check instanceof NextResponse) return check

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

    const admin = createAdminClient()

    if (parsed.data.type === 'interne') {
      const { data, error } = await admin
        .from('admin_internal_messages')
        .insert({ sender_email: check.email ?? '', contenu: parsed.data.contenu })
        .select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }

    const { data, error } = await admin
      .from('admin_support_messages')
      .insert({
        cabinet_id: parsed.data.cabinet_id,
        sender_type: 'admin',
        sender_email: check.email ?? '',
        contenu: parsed.data.contenu,
      })
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Notifier tous les membres du cabinet concerné
    if (parsed.data.cabinet_id) {
      const { data: members } = await admin
        .from('profiles')
        .select('id')
        .eq('cabinet_id', parsed.data.cabinet_id)
      if (members?.length) {
        await admin.from('notifications').insert(
          members.map((m: { id: string }) => ({
            user_id: m.id,
            cabinet_id: parsed.data.cabinet_id,
            type: 'info',
            titre: 'Nouveau message de Coplio Admin',
            message: parsed.data.contenu.slice(0, 80),
            lien: '/messages',
            lu: false,
          }))
        )
      }
    }

    return NextResponse.json(data)
  } catch (err) {
    captureException(err, { context: 'admin-messages-post' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})
