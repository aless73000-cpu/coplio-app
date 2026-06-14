import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/api-handler'
import { rateLimit, getIP, rateLimitResponse } from '@/lib/rate-limit'

export const POST = withErrorHandler(async (request: Request) => {
  const ip = getIP(request)
  const limit = await rateLimit(`push-sub:${ip}`, { max: 10, windowMs: 60_000 })
  if (!limit.success) return rateLimitResponse(limit.resetAt)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const subscription = await request.json()
  if (!subscription?.endpoint) {
    return NextResponse.json({ error: 'Subscription invalide' }, { status: 400 })
  }

  await supabase
    .from('profiles')
    .update({ push_subscription: subscription })
    .eq('id', user.id)

  return NextResponse.json({ ok: true })
})

export const DELETE = withErrorHandler(async (_request: Request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  await supabase
    .from('profiles')
    .update({ push_subscription: null })
    .eq('id', user.id)

  return NextResponse.json({ ok: true })
})
