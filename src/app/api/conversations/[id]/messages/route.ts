// GET  → messages d'une conversation
// POST → envoyer un message dans une conversation

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api-handler'

async function getContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single()
  return profile?.cabinet_id ? { user, cabinet_id: profile.cabinet_id } : null
}

export const GET = withErrorHandler(async (_: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const ctx = await getContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const admin = createAdminClient()

  // Vérifier accès à la conversation
  const { data: conv } = await admin
    .from('conversations')
    .select('id')
    .eq('id', id)
    .eq('cabinet_id', ctx.cabinet_id)
    .single()

  if (!conv) return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 })

  const { data: messages, error } = await admin
    .from('messages')
    .select('id, contenu, expediteur_id, lu, created_at, expediteur:profiles(prenom, nom, role)')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(messages ?? [])
})

const sendSchema = z.object({
  contenu: z.string().min(1).max(5000),
})

export const POST = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const ctx = await getContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json()
  const parsed = sendSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const admin = createAdminClient()

  // Vérifier accès à la conversation
  const { data: conv } = await admin
    .from('conversations')
    .select('id, coproprietaire_id')
    .eq('id', id)
    .eq('cabinet_id', ctx.cabinet_id)
    .single()

  if (!conv) return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 })

  // Insérer le message via admin client (contourne RLS)
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

  // Mettre à jour derniere_activite
  await admin
    .from('conversations')
    .update({ derniere_activite: new Date().toISOString() })
    .eq('id', id)

  // Push notification aux autres membres du cabinet (non bloquant)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coplio.fr'
  fetch(`${appUrl}/api/push/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.CRON_SECRET ?? ''}`,
    },
    body: JSON.stringify({
      cabinetId: ctx.cabinet_id,
      payload: {
        title: 'Nouveau message',
        body: parsed.data.contenu.slice(0, 80),
        url: `/messages`,
      },
    }),
  }).catch(() => {})

  return NextResponse.json(message, { status: 201 })
})
