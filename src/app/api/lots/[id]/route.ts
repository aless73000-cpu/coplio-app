import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api-handler'

const schema = z.object({
  numero: z.string().min(1),
  type: z.enum(['appartement', 'maison', 'local_commercial', 'parking', 'cave', 'autre']),
  etage: z.string().optional(),
  surface: z.number().optional(),
  tantiemes: z.number().min(1),
})

async function getCallerCabinetId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, cabinetId: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .single()

  return { user, cabinetId: profile?.cabinet_id ?? null }
}

export const PATCH = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const { user, cabinetId } = await getCallerCabinetId()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!cabinetId) return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const admin = createAdminClient()

  // Verify cabinet ownership via copropriete
  const { data: lot } = await admin
    .from('lots')
    .select('id, copropriete:coproprietes(cabinet_id)')
    .eq('id', id)
    .single()

  if (!lot) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lotCabinetId = (lot.copropriete as { cabinet_id: string } | null)?.cabinet_id
  if (lotCabinetId !== cabinetId) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { data, error } = await admin
    .from('lots')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
})

export const DELETE = withErrorHandler(async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const { user, cabinetId } = await getCallerCabinetId()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!cabinetId) return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })

  const admin = createAdminClient()

  // Verify cabinet ownership via copropriete
  const { data: lot } = await admin
    .from('lots')
    .select('id, copropriete:coproprietes(cabinet_id)')
    .eq('id', id)
    .single()

  if (!lot) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lotCabinetId = (lot.copropriete as { cabinet_id: string } | null)?.cabinet_id
  if (lotCabinetId !== cabinetId) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { error } = await admin.from('lots').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
})
