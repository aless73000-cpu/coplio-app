import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { notifySyndics } from '@/lib/notify'

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

    await notifySyndics({
      conversationId: parsed.data.conversation_id,
      messagePreview: parsed.data.message_preview,
      expediteurNom: parsed.data.expediteur_nom,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
