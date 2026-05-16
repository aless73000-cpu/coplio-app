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

export async function GET() {
  const cabinetId = await getCabinetId()
  if (!cabinetId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const admin = createAdminClient()
  // Ne pas filtrer par `actif` — la colonne peut ne pas encore exister si la migration n'a pas encore été appliquée
  const { data, error } = await admin
    .from('prestataires')
    .select('*')
    .eq('cabinet_id', cabinetId)
    .order('nom')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Filtrer les inactifs côté serveur si la colonne existe
  const result = (data ?? []).filter((p: Record<string, unknown>) => p.actif !== false)
  return NextResponse.json(result)
}

const schema = z.object({
  nom: z.string().min(1).max(255),
  categorie: z.string().max(100).optional(),
  telephone: z.string().max(30).optional(),
  email: z.string().email().optional().or(z.literal('')),
  adresse: z.string().optional(),
  siret: z.string().max(20).optional(),
  notes: z.string().optional(),
})

export async function POST(request: Request) {
  const cabinetId = await getCabinetId()
  if (!cabinetId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const admin = createAdminClient()
  const payload = { ...parsed.data, cabinet_id: cabinetId }

  // Essai avec toutes les colonnes
  let { data, error } = await admin
    .from('prestataires')
    .insert(payload)
    .select()
    .single()

  // Fallback: si une colonne n'existe pas encore (avant migration), on réessaie avec les colonnes de base
  if (error && (error.message.includes('column') || error.code === 'PGRST204' || error.code === '42703')) {
    const { nom, telephone, email, adresse, siret } = parsed.data
    const basePayload = { nom, cabinet_id: cabinetId, ...(telephone && { telephone }), ...(email && { email }), ...(adresse && { adresse }), ...(siret && { siret }) }
    ;({ data, error } = await admin.from('prestataires').insert(basePayload).select().single())
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
