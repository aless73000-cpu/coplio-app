import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api-handler'

const CLE_REPARTITION = [
  'tantiemes_generaux',
  'tantiemes_speciaux',
  'tantièmes_ascenseur',
  'tantièmes_parkings',
  'tantièmes_caves',
  'charges_eau',
  'charges_chauffage',
  'autre_cle',
] as const

const ligneSchema = z.object({
  poste: z.string().min(1),
  categorie: z.enum(['charges_generales', 'entretien', 'travaux', 'assurances', 'honoraires', 'reserves', 'autre']),
  // Décret 1967 art. 10 : clé de répartition obligatoire pour ventilation légale des charges
  cle_repartition: z.enum(CLE_REPARTITION).default('tantiemes_generaux'),
  montant_previsionnel: z.number().min(0),
  montant_reel: z.number().min(0).optional(),
  commentaire: z.string().optional(),
  ordre: z.number().int().default(0),
})

const updateSchema = z.object({
  statut: z.enum(['brouillon', 'valide', 'approuve']).optional(),
  lignes: z.array(ligneSchema).optional(),
})

export const GET = withErrorHandler(async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data, error } = await supabase
    .from('budgets')
    .select('*, lignes:budget_lignes(*)')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Budget introuvable' }, { status: 404 })
  return NextResponse.json(data)
})

export const PATCH = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { lignes, ...budgetFields } = parsed.data

  if (Object.keys(budgetFields).length > 0) {
    await supabase
      .from('budgets')
      .update({ ...budgetFields, updated_at: new Date().toISOString() })
      .eq('id', id)
  }

  if (lignes) {
    await supabase.from('budget_lignes').delete().eq('budget_id', id)
    if (lignes.length > 0) {
      await supabase.from('budget_lignes').insert(
        lignes.map((l, i) => ({ ...l, budget_id: id, ordre: i }))
      )
    }
  }

  const { data } = await supabase
    .from('budgets')
    .select('*, lignes:budget_lignes(*)')
    .eq('id', id)
    .single()

  return NextResponse.json(data)
})

export const DELETE = withErrorHandler(async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  await supabase.from('budgets').delete().eq('id', id)
  return NextResponse.json({ ok: true })
})
