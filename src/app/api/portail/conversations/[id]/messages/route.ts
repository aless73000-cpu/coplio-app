// GET  → messages d'une conversation (portail copropriétaire)
// POST → envoyer un message via admin client

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { notifySyndics } from '@/lib/notify'
import { captureException } from '@/lib/monitoring'

async function getContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: copro } = await admin
    .from('coproprietaires')
    .select('id, cabinet_id')
    .eq('profile_id', user.id)
    .single()

  if (!copro) return null
  return { user, coproprietaireId: copro.id, cabinetId: copro.cabinet_id }
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getContext()
    if (!ctx) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const admin = createAdminClient()

    // Vérifier que cette conversation appartient bien à ce copropriétaire
    const { data: conv } = await admin
      .from('conversations')
      .select('id')
      .eq('id', id)
      .eq('coproprietaire_id', ctx.coproprietaireId)
      .single()

    if (!conv) return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 })

    const { data: messages, error } = await admin
      .from('messages')
      .select('id, contenu, expediteur_id, lu, created_at, expediteur:profiles(prenom, nom, role)')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(messages ?? [])
  } catch (err) {
    captureException(err, { context: 'portail-conversations-messages-get' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const sendSchema = z.object({ contenu: z.string().min(1).max(5000) })

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getContext()
    if (!ctx) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await req.json()
    const parsed = sendSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

    const admin = createAdminClient()

    const { data: conv } = await admin
      .from('conversations')
      .select('id')
      .eq('id', id)
      .eq('coproprietaire_id', ctx.coproprietaireId)
      .single()

    if (!conv) return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 })

    const { data: message, error } = await admin
      .from('messages')
      .insert({
        conversation_id: id,
        expediteur_id: ctx.user.id,
        contenu: parsed.data.contenu,
        lu: false,
      })
      .select('id, contenu, expediteur_id, lu, created_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await admin
      .from('conversations')
      .update({ derniere_activite: new Date().toISOString() })
      .eq('id', id)

    // Notifier le syndic (appel direct, pas de HTTP server-to-server)
    notifySyndics({
      conversationId: id,
      messagePreview: parsed.data.contenu.slice(0, 80),
    })

    return NextResponse.json(message, { status: 201 })
  } catch (err) {
    captureException(err, { context: 'portail-conversations-messages-post' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
