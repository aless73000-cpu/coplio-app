import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

async function getCabinetId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single()
  return profile?.cabinet_id ?? null
}

const schema = z.object({
  titre: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  categorie: z.enum(['entretien','reparation','controle','renovation','urgence','autre']).optional(),
  statut: z.enum(['planifie','en_cours','realise','annule']).optional(),
  date_intervention: z.string().optional(),
  date_realisation: z.string().optional(),
  cout_prevu: z.number().optional(),
  cout_reel: z.number().optional(),
  prestataire_id: z.string().uuid().optional().nullable(),
  periodicite: z.enum(['unique','mensuel','trimestriel','semestriel','annuel','pluriannuel']).optional(),
  prochaine_echeance: z.string().optional(),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cabinetId = await getCabinetId()
  if (!cabinetId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const admin = createAdminClient()
  let { data, error } = await admin
    .from('carnet_entretien')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('cabinet_id', cabinetId)
    .select()
    .single()

  // Fallback sans updated_at si colonne manquante
  if (error && (error.message.includes('updated_at') || error.code === '42703')) {
    ;({ data, error } = await admin
      .from('carnet_entretien')
      .update(parsed.data)
      .eq('id', id)
      .eq('cabinet_id', cabinetId)
      .select()
      .single())
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cabinetId = await getCabinetId()
  if (!cabinetId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('carnet_entretien')
    .delete()
    .eq('id', id)
    .eq('cabinet_id', cabinetId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
