import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const ligneSchema = z.object({
  poste: z.string().min(1),
  categorie: z.enum(['charges_generales', 'entretien', 'travaux', 'assurances', 'honoraires', 'reserves', 'autre']),
  montant_previsionnel: z.number().min(0),
  montant_reel: z.number().min(0).optional(),
  commentaire: z.string().optional(),
  ordre: z.number().int().default(0),
})

const updateSchema = z.object({
  statut: z.enum(['brouillon', 'valide', 'approuve']).optional(),
  lignes: z.array(ligneSchema).optional(),
})

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data, error } = await supabase
    .from('budgets')
    .select('*, lignes:budget_lignes(*)')
    .eq('id', params.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Budget introuvable' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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
      .eq('id', params.id)
  }

  if (lignes) {
    await supabase.from('budget_lignes').delete().eq('budget_id', params.id)
    if (lignes.length > 0) {
      await supabase.from('budget_lignes').insert(
        lignes.map((l, i) => ({ ...l, budget_id: params.id, ordre: i }))
      )
    }
  }

  const { data } = await supabase
    .from('budgets')
    .select('*, lignes:budget_lignes(*)')
    .eq('id', params.id)
    .single()

  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  await supabase.from('budgets').delete().eq('id', params.id)
  return NextResponse.json({ ok: true })
}
