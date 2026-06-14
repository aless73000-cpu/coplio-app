import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, requireCabinetUser } from '@/lib/api-handler'

const schema = z.object({
  copropriete_id: z.string().uuid(),
  titre: z.string().min(1),
  description: z.string().optional(),
  priorite: z.enum(['basse', 'normale', 'haute', 'urgente']).default('normale'),
  statut: z.enum(['demande', 'devis', 'vote', 'commande', 'realisation', 'reception', 'archive']).default('demande'),
  montant_estime: z.number().min(0).optional().nullable(),
  prestataire_id: z.string().uuid().optional().nullable(),
})

export const GET = withErrorHandler(async (request: Request) => {
  const auth = await requireCabinetUser()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const { searchParams } = new URL(request.url)
  const coproprieteId = searchParams.get('copropriete_id')

  let query = supabase
    .from('travaux')
    .select('*, prestataire:prestataires(id, nom), etapes:travaux_etapes(*)')
    .order('created_at', { ascending: false })

  if (coproprieteId) query = query.eq('copropriete_id', coproprieteId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
})

export const POST = withErrorHandler(async (request: Request) => {
  const auth = await requireCabinetUser()
  if (auth instanceof NextResponse) return auth
  const { supabase, userId, cabinetId } = auth

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { data, error } = await supabase
    .from('travaux')
    .insert({ ...parsed.data, cabinet_id: cabinetId, created_by: userId })
    .select('*, prestataire:prestataires(id, nom), etapes:travaux_etapes(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
})
