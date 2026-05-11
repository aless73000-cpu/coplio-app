import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
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
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  await supabase
    .from('profiles')
    .update({ push_subscription: null })
    .eq('id', user.id)

  return NextResponse.json({ ok: true })
}
