import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/api-handler'

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
  const { nom, adresse, ville, code_postal, nb_lots, contact_nom, contact_email, contact_telephone, statut, probabilite, montant_potentiel, notes, prochain_rdv } = body

  if (!nom) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })

  const { data, error } = await supabase
    .from('prospects')
    .insert({ cabinet_id: profile.cabinet_id, nom, adresse, ville, code_postal, nb_lots: nb_lots ?? 0, contact_nom, contact_email, contact_telephone, statut: statut ?? 'lead', probabilite: probabilite ?? 0, montant_potentiel: montant_potentiel ?? 0, notes, prochain_rdv })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
})
