import { createAdminClient } from '@/lib/supabase/server'
import { captureException } from '@/lib/monitoring'
import { sendEmail } from '@/lib/email/service'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coplio.fr'
const CRON_SECRET = process.env.CRON_SECRET ?? ''

function sendPush(profileIds: string[], title: string, body: string, url: string) {
  fetch(`${APP_URL}/api/push/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CRON_SECRET}` },
    body: JSON.stringify({ profileIds, payload: { title, body, url } }),
  }).catch(() => {})
}

function messageEmailHtml(title: string, preview: string, ctaUrl: string, ctaText: string): string {
  const safePreview = preview.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:600px;margin:40px auto;padding:0 16px">
  <div style="background:white;border-radius:16px;padding:32px;border:1px solid #e2e8f0">
    <h2 style="margin:0 0 16px;color:#374151;font-size:18px;font-weight:700">${title}</h2>
    <div style="background:#f8fafc;border-radius:12px;padding:16px;margin-bottom:24px;border-left:3px solid #374151">
      <p style="color:#374151;font-size:14px;margin:0;line-height:1.6;white-space:pre-wrap">${safePreview}</p>
    </div>
    <a href="${ctaUrl}" style="display:inline-block;background:#374151;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600">${ctaText} →</a>
    <p style="color:#94a3b8;font-size:12px;margin-top:24px;margin-bottom:0">Coplio · La gestion de copropriété simplifiée</p>
  </div>
</div>
</body></html>`
}

/**
 * Notifie tous les syndics d'un cabinet (in-app + push + email).
 */
export async function notifySyndics({
  conversationId,
  messagePreview,
  expediteurNom,
  expediteurEmail,
}: {
  conversationId: string
  messagePreview?: string
  expediteurNom?: string
  expediteurEmail?: string
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
      .select('id, email, prenom')
      .eq('cabinet_id', conv.cabinet_id)
      .neq('role', 'owner_resident')

    if (!syndics?.length) return

    const title = `Nouveau message${expediteurNom ? ` de ${expediteurNom}` : ''}`
    const preview = messagePreview ?? ''

    // In-app notifications
    await admin.from('notifications').insert(
      syndics.map((s) => ({
        user_id: s.id,
        cabinet_id: conv.cabinet_id,
        type: 'info',
        titre: title,
        message: preview || null,
        lien: '/messages',
        lu: false,
      }))
    )

    // Push (non-bloquant)
    sendPush(
      syndics.map((s) => s.id),
      title,
      preview || 'Un copropriétaire vous a envoyé un message',
      `${APP_URL}/messages`,
    )

    // Email (non-bloquant, 1 par syndic)
    if (preview) {
      const html = messageEmailHtml(
        title,
        preview,
        `${APP_URL}/messages`,
        'Voir la messagerie',
      )
      for (const s of syndics) {
        if (s.email) {
          sendEmail({
            to: s.email,
            subject: title,
            html,
            text: `${title}\n\n${preview}\n\nVoir sur Coplio : ${APP_URL}/messages`,
            idempotencyKey: `msg-syndic-${conversationId}-${s.id}-${Date.now()}`,
          }).catch(() => {})
        }
      }
    }
  } catch (err) {
    captureException(err, { context: 'notifySyndics', conversationId })
  }
}

/**
 * Notifie le copropriétaire qu'un syndic lui a envoyé un message (in-app + push + email).
 */
export async function notifyCoproprietaire({
  coproprietaireId,
  messagePreview,
  expediteurNom,
}: {
  coproprietaireId: string
  messagePreview?: string
  expediteurNom?: string
}) {
  try {
    const admin = createAdminClient()

    const { data: copro } = await admin
      .from('coproprietaires')
      .select('profile_id, email, prenom, nom')
      .eq('id', coproprietaireId)
      .single()

    if (!copro?.profile_id) return

    const title = `Nouveau message${expediteurNom ? ` de ${expediteurNom}` : ' de votre syndic'}`
    const preview = messagePreview ?? ''

    // In-app notification
    await admin.from('notifications').insert({
      user_id: copro.profile_id,
      type: 'info',
      titre: title,
      message: preview || null,
      lien: '/mes-messages',
      lu: false,
    })

    // Push (non-bloquant)
    sendPush(
      [copro.profile_id],
      title,
      preview || 'Votre syndic vous a envoyé un message',
      `${APP_URL}/mes-messages`,
    )

    // Email (non-bloquant)
    const email = copro.email || null
    if (email && preview) {
      const html = messageEmailHtml(
        title,
        preview,
        `${APP_URL}/mes-messages`,
        'Voir le message',
      )
      sendEmail({
        to: email,
        subject: title,
        html,
        text: `${title}\n\n${preview}\n\nVoir sur Coplio : ${APP_URL}/mes-messages`,
        idempotencyKey: `msg-copro-${coproprietaireId}-${Date.now()}`,
      }).catch(() => {})
    }
  } catch (err) {
    captureException(err, { context: 'notifyCoproprietaire', coproprietaireId })
  }
}
