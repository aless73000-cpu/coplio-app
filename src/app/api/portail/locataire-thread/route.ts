// Messagerie privée locataire ↔ propriétaire (le syndic n'y a PAS accès).
// Une conversation unique par locataire, identifiée par conversations.tenant_id.
// Utilisée des deux côtés : le locataire (mes-messages) et le propriétaire (mon-locataire).

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api-handler'
import { captureException } from '@/lib/monitoring'

type ThreadCtx = {
  meId: string
  tenantId: string          // tenant_id de la conversation
  otherPartyId: string      // à notifier quand on envoie
  cabinetId: string | null  // pour satisfaire la FK conversations.cabinet_id
  isLandlord: boolean
}

/** Identifie le demandeur (locataire ou propriétaire) et la conversation cible. */
async function getThreadContext(): Promise<ThreadCtx | NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const admin = createAdminClient()
  const { data: me } = await admin
    .from('profiles')
    .select('id, role, landlord_id, lot_id')
    .eq('id', user.id)
    .single()

  if (me?.role === 'tenant') {
    if (!me.landlord_id) return NextResponse.json({ error: 'Aucun propriétaire associé' }, { status: 400 })
    const { data: lot } = me.lot_id
      ? await admin.from('lots').select('copropriete:coproprietes(cabinet_id)').eq('id', me.lot_id).single()
      : { data: null }
    const cabinetId = (lot?.copropriete as { cabinet_id?: string } | null)?.cabinet_id ?? null
    return { meId: user.id, tenantId: user.id, otherPartyId: me.landlord_id, cabinetId, isLandlord: false }
  }

  if (me?.role === 'owner_resident') {
    const { data: tenant } = await admin
      .from('profiles')
      .select('id, lot_id')
      .eq('landlord_id', user.id)
      .eq('role', 'tenant')
      .maybeSingle()
    if (!tenant) return NextResponse.json({ error: 'Aucun locataire' }, { status: 404 })
    const { data: lot } = tenant.lot_id
      ? await admin.from('lots').select('copropriete:coproprietes(cabinet_id)').eq('id', tenant.lot_id).single()
      : { data: null }
    const cabinetId = (lot?.copropriete as { cabinet_id?: string } | null)?.cabinet_id ?? null
    return { meId: user.id, tenantId: tenant.id, otherPartyId: tenant.id, cabinetId, isLandlord: true }
  }

  return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
}

/** Récupère (ou crée) la conversation locataire↔propriétaire. */
async function ensureConversation(admin: ReturnType<typeof createAdminClient>, ctx: ThreadCtx) {
  const { data: existing } = await admin
    .from('conversations')
    .select('id')
    .eq('tenant_id', ctx.tenantId)
    .maybeSingle()
  if (existing) return existing.id

  if (!ctx.cabinetId) return null // FK cabinet_id obligatoire
  const { data: created, error } = await admin
    .from('conversations')
    .insert({
      cabinet_id: ctx.cabinetId,
      coproprietaire_id: null,
      tenant_id: ctx.tenantId,
      gestionnaire_id: null, // pas de syndic dans ce fil
      sujet: 'Échange locataire ↔ propriétaire',
      derniere_activite: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (error) { captureException(error, { context: 'locataire-thread-create' }); return null }
  return created.id
}

export const GET = withErrorHandler(async () => {
  const ctx = await getThreadContext()
  if (ctx instanceof NextResponse) return ctx

  const admin = createAdminClient()
  const convId = await ensureConversation(admin, ctx)
  if (!convId) return NextResponse.json({ conversationId: null, messages: [] })

  const { data: messages, error } = await admin
    .from('messages')
    .select('id, contenu, expediteur_id, lu, created_at')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ conversationId: convId, meId: ctx.meId, messages: messages ?? [] })
})

const sendSchema = z.object({ contenu: z.string().min(1).max(5000) })

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getThreadContext()
  if (ctx instanceof NextResponse) return ctx

  const parsed = sendSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Message invalide' }, { status: 400 })

  const admin = createAdminClient()
  const convId = await ensureConversation(admin, ctx)
  if (!convId) return NextResponse.json({ error: 'Impossible de créer la conversation' }, { status: 500 })

  const { data: message, error } = await admin
    .from('messages')
    .insert({ conversation_id: convId, expediteur_id: ctx.meId, contenu: parsed.data.contenu, lu: false })
    .select('id, contenu, expediteur_id, lu, created_at')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('conversations').update({ derniere_activite: new Date().toISOString() }).eq('id', convId)

  // Notifier l'autre partie (propriétaire ou locataire) — jamais le syndic
  await admin.from('notifications').insert({
    user_id: ctx.otherPartyId,
    type: 'info',
    titre: ctx.isLandlord ? 'Message de votre propriétaire' : 'Message de votre locataire',
    message: parsed.data.contenu.slice(0, 100),
    lien: ctx.isLandlord ? '/mes-messages' : '/mon-locataire',
    lu: false,
  })

  return NextResponse.json(message, { status: 201 })
})
