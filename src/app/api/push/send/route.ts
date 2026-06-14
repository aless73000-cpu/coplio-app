import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { withErrorHandler } from '@/lib/api-handler'

let vapidReady = false

/**
 * Configure web-push à la demande. Ne lève jamais : une clé absente OU malformée
 * renvoie `false` (le handler répondra 503) au lieu de faire planter le module
 * — et donc le build Next.js et tout cold-start.
 */
function ensureVapid(): boolean {
  if (vapidReady) return true
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT
  if (!pub || !priv || !subject) return false
  try {
    webpush.setVapidDetails(subject, pub, priv)
    vapidReady = true
    return true
  } catch {
    return false
  }
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  icon?: string
}

/**
 * Internal endpoint to send push notifications.
 * Protected by a shared secret (CRON_SECRET or internal calls only).
 * Body: { cabinetId?: string, profileIds?: string[], payload: PushPayload }
 */
export const POST = withErrorHandler(async (request: Request) => {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  // Fail-closed: if secret is not configured, deny all requests
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  if (!ensureVapid()) {
    return NextResponse.json({ error: 'Notifications push non configurées' }, { status: 503 })
  }

  const { cabinetId, profileIds, payload } = await request.json() as {
    cabinetId?: string
    profileIds?: string[]
    payload: PushPayload
  }

  const admin = createAdminClient()
  let query = admin.from('profiles').select('id, push_subscription').not('push_subscription', 'is', null)

  if (profileIds?.length) {
    query = query.in('id', profileIds)
  } else if (cabinetId) {
    query = query.eq('cabinet_id', cabinetId)
  }

  const { data: profiles } = await query

  if (!profiles?.length) return NextResponse.json({ sent: 0 })

  const notifPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? '/dashboard',
    icon: payload.icon ?? '/icons/icon-192x192.png',
  })

  let sent = 0
  let failed = 0

  await Promise.allSettled(
    profiles.map(async (p) => {
      try {
        await webpush.sendNotification(
          p.push_subscription as unknown as webpush.PushSubscription,
          notifPayload
        )
        sent++
      } catch (err: unknown) {
        failed++
        // Subscription expired — clean up
        if (err instanceof webpush.WebPushError && (err.statusCode === 404 || err.statusCode === 410)) {
          await admin.from('profiles').update({ push_subscription: null }).eq('id', p.id)
        }
      }
    })
  )

  return NextResponse.json({ sent, failed })
})
