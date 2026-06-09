import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api-handler'

async function getCabinetId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single()
  return profile?.cabinet_id ?? null
}

export const GET = withErrorHandler(async () => {
  const cabinetId = await getCabinetId()
  if (!cabinetId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

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
  const cabinetId = await getCabinetId()
  if (!cabinetId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

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
