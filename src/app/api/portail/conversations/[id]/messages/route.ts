// GET  → messages d'une conversation (portail copropriétaire)
// POST → envoyer un message via admin client

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { notifySyndics } from '@/lib/notify'
import { withErrorHandler } from '@/lib/api-handler'

type Ctx =
  | { user: { id: string }; isTenant: false; coproprietaireId: string }
  | { user: { id: string }; isTenant: true; tenantId: string }

async function getContext(): Promise<Ctx | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: copro } = await admin
    .from('coproprietaires')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle()
  if (copro) return { user, isTenant: false, coproprietaireId: copro.id }

  const { data: prof } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (prof?.role === 'tenant') return { user, isTenant: true, tenantId: user.id }

  return null
}

/** Vérifie que la conversation appartient bien à l'utilisateur (copro ou locataire). */
async function ownsConversation(admin: ReturnType<typeof createAdminClient>, convId: string, ctx: Ctx) {
  let q = admin.from('conversations').select('id').eq('id', convId)
  q = ctx.isTenant ? q.eq('tenant_id', ctx.tenantId) : q.eq('coproprietaire_id', ctx.coproprietaireId)
  const { data } = await q.maybeSingle()
  return !!data
}

export const GET = withErrorHandler(async (_: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const ctx = await getContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const admin = createAdminClient()

  // Vérifier que cette conversation appartient bien à l'utilisateur
  if (!(await ownsConversation(admin, id, ctx))) {
    return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 })
  }

  const { data: messages, error } = await admin
    .from('messages')
    .select('id, contenu, expediteur_id, lu, created_at, expediteur:profiles(prenom, nom, role)')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(messages ?? [])
})

const sendSchema = z.object({ contenu: z.string().min(1).max(5000) })

export const POST = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const ctx = await getContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json()
  const parsed = sendSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const admin = createAdminClient()

  if (!(await ownsConversation(admin, id, ctx))) {
    return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 })
  }

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
})
