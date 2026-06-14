import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, requireCabinetUser } from '@/lib/api-handler'

export const GET = withErrorHandler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  try {
  const auth = await requireCabinetUser()
  if (auth instanceof NextResponse) return auth
  const { cabinetId } = auth

    const admin = createAdminClient()
    // Vérifier que le coproprietaire appartient au cabinet
    const { data: copro } = await admin.from('coproprietaires').select('id').eq('id', id).eq('cabinet_id', cabinetId).single()
    if (!copro) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

    const { data, error } = await admin
      .from('coproprietaire_lots')
      .select('lot_id')
      .eq('coproprietaire_id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json((data ?? []).map((r: { lot_id: string }) => r.lot_id))
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})

const schema = z.object({ lot_ids: z.array(z.string().uuid()) })

export const PUT = withErrorHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  try {
  const auth = await requireCabinetUser()
  if (auth instanceof NextResponse) return auth
  const { cabinetId } = auth

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

    const admin = createAdminClient()
    // Vérifier appartenance cabinet + récupérer profile_id pour la synchro
    const { data: copro } = await admin.from('coproprietaires').select('id, profile_id').eq('id', id).eq('cabinet_id', cabinetId).single()
    if (!copro) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

    await admin.from('coproprietaire_lots').delete().eq('coproprietaire_id', id)

    if (parsed.data.lot_ids.length > 0) {
      const rows = parsed.data.lot_ids.map((lot_id) => ({ coproprietaire_id: id, lot_id }))
      const { error } = await admin.from('coproprietaire_lots').insert(rows)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Synchroniser profiles.lot_id avec le premier lot assigné
    // (le portail copropriétaire lit profiles.lot_id directement)
    if (copro?.profile_id) {
      await admin
        .from('profiles')
        .update({ lot_id: parsed.data.lot_ids[0] ?? null })
        .eq('id', copro.profile_id)
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})
