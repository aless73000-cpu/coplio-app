import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, requireCabinetUser } from '@/lib/api-handler'

const schema = z.object({
  nom: z.string().min(1).max(255).optional(),
  categorie: z.enum(['fonctionnement', 'entretien']).optional(),
  metier: z.string().max(100).optional(),
  telephone: z.string().max(30).optional(),
  email: z.string().email().optional().or(z.literal('')),
  adresse: z.string().optional(),
  siret: z.string().max(20).optional(),
  note: z.number().int().min(1).max(5).optional().nullable(),
  commentaire: z.string().optional(),
  actif: z.boolean().optional(),
})

export const PATCH = withErrorHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
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
    .update({ ...parsed.data, updated_at: new Date().toISOString() } as never)
    .eq('id', id)
    .eq('cabinet_id', cabinetId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
})

export const DELETE = withErrorHandler(async (_: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const auth = await requireCabinetUser()
  if (auth instanceof NextResponse) return auth
  const { cabinetId } = auth

  const admin = createAdminClient()
  // Soft delete — le prestataire reste en DB mais n'apparaît plus
  const { error } = await admin
    .from('prestataires')
    .update({ actif: false })
    .eq('id', id)
    .eq('cabinet_id', cabinetId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
})