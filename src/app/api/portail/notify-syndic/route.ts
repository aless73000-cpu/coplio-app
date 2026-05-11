import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  conversation_id: z.string().uuid(),
  message_preview: z.string().optional(),
  expediteur_nom: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

    const admin = createAdminClient()

    // Récupérer le cabinet de la conversation
    const { data: conv } = await admin
      .from('conversations')
      .select('cabinet_id, sujet')
      .eq('id', parsed.data.conversation_id)
      .single()

    if (!conv?.cabinet_id) return NextResponse.json({ ok: true })

    // Notifier tous les syndics du cabinet
    const { data: syndics } = await admin
      .from('profiles')
      .select('id')
      .eq('cabinet_id', conv.cabinet_id)
      .neq('role', 'owner_resident')

    if (!syndics?.length) return NextResponse.json({ ok: true })

    await admin.from('notifications').insert(
      syndics.map((s: { id: string }) => ({
        user_id: s.id,
        cabinet_id: conv.cabinet_id,
        type: 'info',
        titre: `Nouveau message${parsed.data.expediteur_nom ? ` de ${parsed.data.expediteur_nom}` : ''}`,
        message: parsed.data.message_preview ?? null,
        lien: '/messages',
        lu: false,
      }))
    )

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
