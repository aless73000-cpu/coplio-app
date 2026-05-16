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
  nom: z.string().min(1).max(255).optional(),
  metier: z.string().max(100).optional(),
  telephone: z.string().max(30).optional(),
  email: z.string().email().optional().or(z.literal('')),
  adresse: z.string().optional(),
  siret: z.string().max(20).optional(),
  note: z.number().int().min(1).max(5).optional(),
  commentaire: z.string().optional(),
  actif: z.boolean().optional(),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cabinetId = await getCabinetId()
  if (!cabinetId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const admin = createAdminClient()
  const updatePayload = { ...parsed.data }

  // Essai complet avec updated_at (colonnes complètes après migration)
  let { data, error } = await admin
    .from('prestataires')
    .update({ ...updatePayload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('cabinet_id', cabinetId)
    .select()
    .single()

  // Fallback: si colonne manquante (avant migration), on n'envoie que les colonnes de base
  if (error && error.code === '42703') {
    const { nom, telephone, email, adresse, siret } = parsed.data
    const basePayload: Record<string, unknown> = {}
    if (nom) basePayload.nom = nom
    if (telephone !== undefined) basePayload.telephone = telephone
    if (email !== undefined) basePayload.email = email
    if (adresse !== undefined) basePayload.adresse = adresse
    if (siret !== undefined) basePayload.siret = siret
    ;({ data, error } = await admin
      .from('prestataires')
      .update(basePayload)
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

  // Essai soft-delete via actif (existe après migration)
  const { error: softError } = await admin
    .from('prestataires')
    .update({ actif: false })
    .eq('id', id)
    .eq('cabinet_id', cabinetId)

  if (!softError) return NextResponse.json({ success: true })

  // Fallback: hard delete si colonne actif manquante
  if (softError.message.includes('actif') || softError.code === '42703') {
    const { error } = await admin
      .from('prestataires')
      .delete()
      .eq('id', id)
      .eq('cabinet_id', cabinetId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: softError.message }, { status: 500 })
}
