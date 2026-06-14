// GET  → messages d'une conversation
// POST → envoyer un message dans une conversation

import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, requireCabinetUser } from '@/lib/api-handler'
import { notifyCoproprietaire } from '@/lib/notify'

export const GET = withErrorHandler(async (_: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const auth = await requireCabinetUser()
  if (auth instanceof NextResponse) return auth
  const { cabinetId } = auth

  const admin = createAdminClient()

  // Vérifier accès à la conversation
  const { data: conv } = await admin
    .from('conversations')
    .select('id')
    .eq('id', id)
    .eq('cabinet_id', cabinetId)
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
  const auth = await requireCabinetUser()
  if (auth instanceof NextResponse) return auth
  const { userId, cabinetId } = auth

  const body = await req.json()
  const parsed = sendSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const admin = createAdminClient()

  // Vérifier accès à la conversation
  const { data: conv } = await admin
    .from('conversations')
    .select('id, coproprietaire_id')
    .eq('id', id)
    .eq('cabinet_id', cabinetId)
    .single()

  if (!conv) return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 })

  // Insérer le message via admin client (contourne RLS)
  const { data: message, error } = await admin
    .from('messages')
    .insert({
      conversation_id: id,
      expediteur_id: userId,
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

  // Notifier le copropriétaire (in-app + push + email, non-bloquant)
  if (conv.coproprietaire_id) {
    const { data: syndicProfile } = await admin
      .from('profiles')
      .select('prenom, nom')
      .eq('id', userId)
      .single()
    const expediteurNom = syndicProfile
      ? `${syndicProfile.prenom ?? ''} ${syndicProfile.nom ?? ''}`.trim()
      : undefined
    notifyCoproprietaire({
      coproprietaireId: conv.coproprietaire_id,
      messagePreview: parsed.data.contenu.slice(0, 200),
      expediteurNom: expediteurNom || undefined,
    })
  }

  return NextResponse.json(message, { status: 201 })
})
