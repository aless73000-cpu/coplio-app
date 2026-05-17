import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireCabinetUser } from '@/lib/api-handler'

export async function GET() {
  const ctx = await requireCabinetUser()
  if (ctx instanceof NextResponse) return ctx

  const { supabase, cabinetId } = ctx
  const { data, error } = await supabase
    .from('coproprietes')
    .select('id, nom, adresse, ville, nb_lots')
    .eq('cabinet_id', cabinetId)
    .order('nom')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

const schema = z.object({
  nom: z.string().min(2),
  adresse: z.string().min(5),
  code_postal: z.string().min(5),
  ville: z.string().min(2),
  nb_lots: z.number().min(1),
  tantiemes_totaux: z.number().default(10000),
  annee_construction: z.number().optional(),
  surface_totale: z.number().optional(),
  assureur: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const ctx = await requireCabinetUser()
    if (ctx instanceof NextResponse) return ctx

    const { userId, cabinetId } = ctx
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tantiemes_totaux: _t, ...rest } = parsed.data
    const { data, error } = await admin.from('coproprietes').insert({
      ...rest,
      cabinet_id: cabinetId,
      gestionnaire_id: userId,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
