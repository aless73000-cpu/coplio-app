import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api-handler'

export const GET = withErrorHandler(async (_request: Request, { params }: { params: { id: string } }) => {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('coproprietaire_lots')
      .select('lot_id')
      .eq('coproprietaire_id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json((data ?? []).map((r: { lot_id: string }) => r.lot_id))
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})

const schema = z.object({ lot_ids: z.array(z.string().uuid()) })

export const PUT = withErrorHandler(async (request: Request, { params }: { params: { id: string } }) => {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

    const admin = createAdminClient()
    await admin.from('coproprietaire_lots').delete().eq('coproprietaire_id', params.id)

    if (parsed.data.lot_ids.length > 0) {
      const rows = parsed.data.lot_ids.map((lot_id) => ({ coproprietaire_id: params.id, lot_id }))
      const { error } = await admin.from('coproprietaire_lots').insert(rows)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})
