import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/api-handler'
import { captureException } from '@/lib/monitoring'

export const GET = withErrorHandler(async (request: Request) => {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('cabinet_id')
      .eq('id', user.id)
      .single()
    if (!profile?.cabinet_id) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const limit  = Math.min(parseInt(searchParams.get('limit')  ?? '50'), 200)
    const offset = parseInt(searchParams.get('offset') ?? '0')
    const entite = searchParams.get('entite')
    const action = searchParams.get('action')

    let query = supabase
      .from('audit_logs')
      .select(`
        id, action, entite, entite_id, entite_nom, metadata, created_at,
        user:profiles!user_id(prenom, nom)
      `, { count: 'exact' })
      .eq('cabinet_id', profile.cabinet_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (entite) query = query.eq('entite', entite)
    if (action) query = query.eq('action', action)

    const { data, count, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ logs: data ?? [], total: count ?? 0 })
  } catch (err) {
    captureException(err, { context: 'audit-logs-get' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})
