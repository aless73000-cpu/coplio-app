import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, requireCabinetUser } from '@/lib/api-handler'

const schema = z.object({
  copropriete_id: z.string().uuid(),
  prestataire_id: z.string().uuid().optional().nullable(),
  titre: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['maintenance', 'inspection', 'travaux', 'urgence', 'autre']).default('maintenance'),
  date_intervention: z.string(),
  cout: z.number().min(0).optional().nullable(),
  statut: z.enum(['planifie', 'realise', 'annule']).default('planifie'),
  document_url: z.string().optional().nullable(),
})

export const GET = withErrorHandler(async (request: Request) => {
  const auth = await requireCabinetUser()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const { searchParams } = new URL(request.url)
  const coproprieteId = searchParams.get('copropriete_id')

  let query = supabase
    .from('entretiens')
    .select('*, prestataire:prestataires(id, nom, categorie, telephone)')
    .order('date_intervention', { ascending: false })

  if (coproprieteId) query = query.eq('copropriete_id', coproprieteId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
})

export const POST = withErrorHandler(async (request: Request) => {
  const auth = await requireCabinetUser()
  if (auth instanceof NextResponse) return auth
  const { supabase, cabinetId } = auth

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { data, error } = await supabase
    .from('entretiens')
    .insert({ ...parsed.data, cabinet_id: cabinetId })
    .select('*, prestataire:prestataires(id, nom, categorie, telephone)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
})
