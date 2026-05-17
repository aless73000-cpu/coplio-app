import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireCabinetUser } from '@/lib/api-handler'

export async function GET() {
  try {
    const ctx = await requireCabinetUser()
    if (ctx instanceof NextResponse) return ctx

    const { cabinetId } = ctx
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('profiles')
      .select('id, prenom, nom, email, role, created_at, avatar_url')
      .eq('cabinet_id', cabinetId)
      .in('role', ['owner', 'manager'])
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
