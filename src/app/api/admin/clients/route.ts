import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/api-handler'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())

const PAGE_SIZE = 25

export const GET = withErrorHandler(async (request: Request) => {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10) || 0)
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const admin = createAdminClient()
    const { data, error, count } = await admin
      .from('cabinets')
      .select('id, nom, email_contact, plan, subscription_status, trial_ends_at, current_period_end, created_at, addon_portail_actif, max_lots', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data ?? [], total: count ?? 0, page, pageSize: PAGE_SIZE })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})
