import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

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

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { data, error } = await supabase
    .from('entretiens')
    .update(parsed.data)
    .eq('id', params.id)
    .select('*, prestataire:prestataires(id, nom, categorie, telephone)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  await supabase.from('entretiens').delete().eq('id', params.id)
  return NextResponse.json({ ok: true })
}
