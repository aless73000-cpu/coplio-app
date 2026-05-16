import { createAdminClient } from '@/lib/supabase/server'

/**
 * Notifie tous les syndics d'un cabinet qu'un nouveau message a été reçu.
 * Peut être appelé server-side sans cookies d'auth (utilise admin client).
 */
export async function notifySyndics({
  conversationId,
  messagePreview,
  expediteurNom,
}: {
  conversationId: string
  messagePreview?: string
  expediteurNom?: string
}) {
  try {
    const admin = createAdminClient()

    const { data: conv } = await admin
      .from('conversations')
      .select('cabinet_id')
      .eq('id', conversationId)
      .single()

    if (!conv?.cabinet_id) return

    const { data: syndics } = await admin
      .from('profiles')
      .select('id')
      .eq('cabinet_id', conv.cabinet_id)
      .neq('role', 'owner_resident')

    if (!syndics?.length) return

    await admin.from('notifications').insert(
      syndics.map((s: { id: string }) => ({
        user_id: s.id,
        cabinet_id: conv.cabinet_id,
        type: 'info',
        titre: `Nouveau message${expediteurNom ? ` de ${expediteurNom}` : ''}`,
        message: messagePreview ?? null,
        lien: '/messages',
        lu: false,
      }))
    )
  } catch {
    // Fire-and-forget — ne jamais bloquer l'envoi du message
  }
}
