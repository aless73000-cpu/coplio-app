import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { notifySyndics } from '@/lib/notify'
import { withErrorHandler } from '@/lib/api-handler'

const schema = z.object({
  conversation_id: z.string().uuid(),
  message_preview: z.string().optional(),
  expediteur_nom: z.string().optional(),
})

export const POST = withErrorHandler(async (req: Request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  // SEC-02 : vérifier que l'utilisateur est bien participant de cette conversation
  // (le copropriétaire ne peut notifier que pour SES propres conversations)
  const { data: conv } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', parsed.data.conversation_id)
    .eq('coproprietaire_id', user.id)
    .single()

  if (!conv) return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 })

  await notifySyndics({
    conversationId: parsed.data.conversation_id,
    messagePreview: parsed.data.message_preview,
    expediteurNom: parsed.data.expediteur_nom,
  })

  return NextResponse.json({ ok: true })
})
