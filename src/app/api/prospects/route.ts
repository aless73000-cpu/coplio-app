import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api-handler'

const prospectSchema = z.object({
  nom:                z.string().min(1).max(200),
  adresse:            z.string().max(500).optional().nullable(),
  ville:              z.string().max(100).optional().nullable(),
  code_postal:        z.string().max(10).optional().nullable(),
  nb_lots:            z.number().int().min(0).max(9999).default(0),
  contact_nom:        z.string().max(200).optional().nullable(),
  contact_email:      z.string().email().max(320).optional().nullable().or(z.literal('')),
  contact_telephone:  z.string().max(30).optional().nullable(),
  statut:             z.enum(['lead', 'contact', 'visite', 'proposition', 'gagne', 'perdu']).default('lead'),
  probabilite:        z.number().min(0).max(100).default(0),
  montant_potentiel:  z.number().min(0).default(0),
  notes:              z.string().max(5000).optional().nullable(),
  prochain_rdv:       z.string().optional().nullable(),
})

export const GET = withErrorHandler(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single()
  if (!profile?.cabinet_id) return NextResponse.json([])

  const { data, error } = await supabase
    .from('prospects')
    .select('*')
    .eq('cabinet_id', profile.cabinet_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
})

export const POST = withErrorHandler(async (request: Request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single()
  if (!profile?.cabinet_id) return NextResponse.json({ error: 'Cabinet non trouvé' }, { status: 404 })

  const body = await request.json()
  const parsed = prospectSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { nom, adresse, ville, code_postal, nb_lots, contact_nom, contact_email,
          contact_telephone, statut, probabilite, montant_potentiel, notes, prochain_rdv } = parsed.data

  const { data, error } = await supabase
    .from('prospects')
    .insert({
      cabinet_id: profile.cabinet_id,
      nom, adresse, ville, code_postal, nb_lots,
      contact_nom, contact_email: contact_email || null, contact_telephone,
      statut, probabilite, montant_potentiel, notes, prochain_rdv,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
})
