import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('cabinets')
      .select('id, nom, email_contact, plan, subscription_status, trial_ends_at, current_period_end, created_at, addon_portail_actif, max_lots')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
