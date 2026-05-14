import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  option_id: z.string().uuid(),
})

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Bug #5 fix : coproprietaire_id référence coproprietaires.id, pas profiles.id (auth UUID)
  // On résout le vrai ID via la table coproprietaires liée au profil
  const admin = createAdminClient()
  const { data: copro } = await admin
    .from('coproprietaires')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!copro) return NextResponse.json({ error: 'Profil copropriétaire introuvable' }, { status: 403 })
  const coproprietaireId = copro.id

  // Vérifier que le vote est ouvert
  const { data: vote } = await supabase
    .from('votes')
    .select('id, statut, date_fin')
    .eq('id', params.id)
    .single()

  if (!vote) return NextResponse.json({ error: 'Vote introuvable' }, { status: 404 })
  if (vote.statut !== 'ouvert') return NextResponse.json({ error: 'Ce vote est clôturé' }, { status: 400 })
  if (new Date(vote.date_fin) < new Date()) return NextResponse.json({ error: 'Ce vote est expiré' }, { status: 400 })

  // Vérifier qu'il n'a pas déjà voté — avec le bon UUID
  const { data: existing } = await admin
    .from('vote_reponses')
    .select('id')
    .eq('vote_id', params.id)
    .eq('coproprietaire_id', coproprietaireId)
    .single()

  if (existing) return NextResponse.json({ error: 'Vous avez déjà voté' }, { status: 409 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Option invalide' }, { status: 400 })

  const { error } = await admin.from('vote_reponses').insert({
    vote_id: params.id,
    option_id: parsed.data.option_id,
    coproprietaire_id: coproprietaireId, // ← vrai ID coproprietaires, pas auth.uid()
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
