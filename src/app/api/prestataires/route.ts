import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, requireCabinetUser } from '@/lib/api-handler'

export const GET = withErrorHandler(async () => {
  const auth = await requireCabinetUser()
  if (auth instanceof NextResponse) return auth
  const { cabinetId } = auth

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('prestataires')
    .select('*')
    .eq('cabinet_id', cabinetId)
    .eq('actif', true)
    .order('nom')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
})

const schema = z.object({
  nom: z.string().min(1).max(255),
  categorie: z.enum(['fonctionnement', 'entretien']).optional(),
  metier: z.string().max(100).optional(),
  telephone: z.string().max(30).optional(),
  email: z.string().email().optional().or(z.literal('')),
  adresse: z.string().optional(),
  siret: z.string().max(20).optional(),
  note: z.number().int().min(1).max(5).optional(),
  commentaire: z.string().optional(),
})

export const POST = withErrorHandler(async (request: Request) => {
  const auth = await requireCabinetUser()
  if (auth instanceof NextResponse) return auth
  const { cabinetId } = auth

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('prestataires')
    // categorie existe en DB (migration 20260512) mais absent des types générés
    .insert({ ...parsed.data, cabinet_id: cabinetId } as never)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
})
