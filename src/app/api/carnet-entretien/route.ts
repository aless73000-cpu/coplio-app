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

export async function GET(request: Request) {
  const cabinetId = await getCabinetId()
  if (!cabinetId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const coproprieteId = searchParams.get('copropriete_id')

  const admin = createAdminClient()
  let query = admin
    .from('carnet_entretien')
    .select('*, prestataire:prestataires(id, nom, metier), copropriete:coproprietes(id, nom)')
    .eq('cabinet_id', cabinetId)
    .order('date_intervention', { ascending: false })

  if (coproprieteId) query = query.eq('copropriete_id', coproprieteId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

const schema = z.object({
  copropriete_id: z.string().uuid(),
  prestataire_id: z.string().uuid().optional(),
  titre: z.string().min(1).max(255),
  description: z.string().optional(),
  categorie: z.enum(['entretien','reparation','controle','renovation','urgence','autre']).default('entretien'),
  statut: z.enum(['planifie','en_cours','realise','annule']).default('planifie'),
  date_intervention: z.string().optional(),
  cout_prevu: z.number().optional(),
  periodicite: z.enum(['unique','mensuel','trimestriel','semestriel','annuel','pluriannuel']).optional(),
  prochaine_echeance: z.string().optional(),
})

export async function POST(request: Request) {
  const cabinetId = await getCabinetId()
  if (!cabinetId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('carnet_entretien')
    .insert({ ...parsed.data, cabinet_id: cabinetId })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
