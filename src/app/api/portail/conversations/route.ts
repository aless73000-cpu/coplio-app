// GET  → conversations du copropriétaire connecté
// POST → créer ou récupérer la conversation avec le syndic

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function getContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: copro } = await admin
    .from('coproprietaires')
    .select('id, cabinet_id')
    .eq('profile_id', user.id)
    .single()

  if (!copro) return null
  return { user, coproprietaireId: copro.id, cabinetId: copro.cabinet_id }
}

export async function GET() {
  const ctx = await getContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const admin = createAdminClient()
  const { data: convs, error } = await admin
    .from('conversations')
    .select('id, sujet, derniere_activite')
    .eq('coproprietaire_id', ctx.coproprietaireId)
    .order('derniere_activite', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(convs ?? [])
}

export async function POST() {
  const ctx = await getContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const admin = createAdminClient()

  // Chercher une conversation existante
  const { data: existing } = await admin
    .from('conversations')
    .select('id, sujet, derniere_activite')
    .eq('coproprietaire_id', ctx.coproprietaireId)
    .order('derniere_activite', { ascending: false })
    .limit(1)
    .single()

  if (existing) return NextResponse.json(existing)

  // Créer une nouvelle conversation
  const { data: created, error } = await admin
    .from('conversations')
    .insert({
      cabinet_id: ctx.cabinetId,
      coproprietaire_id: ctx.coproprietaireId,
      sujet: 'Message au syndic',
      derniere_activite: new Date().toISOString(),
    })
    .select('id, sujet, derniere_activite')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(created, { status: 201 })
}
