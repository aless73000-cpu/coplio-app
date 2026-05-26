import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api-handler'

const schema = z.object({
  titre: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(['maintenance', 'inspection', 'travaux', 'urgence', 'autre']).optional(),
  date_intervention: z.string().optional(),
  cout: z.number().min(0).optional().nullable(),
  statut: z.enum(['planifie', 'realise', 'annule']).optional(),
  prestataire_id: z.string().uuid().optional().nullable(),
  document_url: z.string().optional().nullable(),
})

async function getCallerCabinetId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, cabinetId: null, supabase }

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .single()

  return { user, cabinetId: profile?.cabinet_id ?? null, supabase }
}

export const PATCH = withErrorHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const { user, cabinetId, supabase } = await getCallerCabinetId()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  if (!cabinetId) return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { data, error } = await supabase
    .from('entretiens')
    .update(parsed.data)
    .eq('id', id)
    .eq('cabinet_id', cabinetId) // isolation cabinet
    .select('*, prestataire:prestataires(id, nom, categorie, telephone)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Non trouvé ou accès refusé' }, { status: 404 })
  return NextResponse.json(data)
})

export const DELETE = withErrorHandler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const { user, cabinetId, supabase } = await getCallerCabinetId()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  if (!cabinetId) return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })

  const { error } = await supabase
    .from('entretiens')
    .delete()
    .eq('id', id)
    .eq('cabinet_id', cabinetId) // isolation cabinet

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
})
