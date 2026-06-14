import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, requireCabinetUser } from '@/lib/api-handler'

const schema = z.object({
  nom: z.string().min(2).optional(),
  adresse: z.string().min(5).optional(),
  code_postal: z.string().min(5).optional(),
  ville: z.string().min(2).optional(),
  nb_lots: z.number().min(1).optional(),
  annee_construction: z.number().nullable().optional(),
  surface_totale: z.number().nullable().optional(),
  assureur: z.string().nullable().optional(),
  statut: z.enum(['a_jour', 'attention', 'urgent']).optional(),
})

export const PATCH = withErrorHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  try {
  const auth = await requireCabinetUser()
  if (auth instanceof NextResponse) return auth
  const { supabase, cabinetId } = auth

    // Vérifier que la copropriété appartient au cabinet
    const { data: existing } = await supabase
      .from('coproprietes')
      .select('id')
      .eq('id', (await params).id)
      .eq('cabinet_id', cabinetId)
      .single()
    if (!existing) return NextResponse.json({ error: 'Copropriété non trouvée' }, { status: 404 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('coproprietes')
      .update(parsed.data)
      .eq('id', (await params).id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})
