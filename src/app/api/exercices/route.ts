/**
 * GET  /api/exercices?copropriete_id=...  — Liste les exercices d'une copropriété
 * POST /api/exercices                     — Crée un nouvel exercice
 */

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api-handler'

const createSchema = z.object({
  copropriete_id: z.string().uuid(),
  annee:          z.number().int().min(2000).max(2100),
  date_debut:     z.string().optional(), // YYYY-MM-DD, défaut 1er janv.
  date_fin:       z.string().optional(), // YYYY-MM-DD, défaut 31 déc.
})

export const GET = withErrorHandler(async (request: Request) => {
  const { searchParams } = new URL(request.url)
  const coproprieteId = searchParams.get('copropriete_id')
  if (!coproprieteId) return NextResponse.json({ error: 'copropriete_id requis' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('exercices')
    .select('*')
    .eq('copropriete_id', coproprieteId)
    .order('annee', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
})

export const POST = withErrorHandler(async (request: Request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()
  if (!profile?.cabinet_id) return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const admin = createAdminClient()

  // Vérifier appartenance cabinet
  const { data: copropriete } = await admin
    .from('coproprietes')
    .select('id, cabinet_id')
    .eq('id', parsed.data.copropriete_id)
    .single()

  if (!copropriete || copropriete.cabinet_id !== profile.cabinet_id) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const annee = parsed.data.annee
  const { data, error } = await admin
    .from('exercices')
    .insert({
      copropriete_id: parsed.data.copropriete_id,
      annee,
      date_debut:     parsed.data.date_debut     ?? `${annee}-01-01`,
      date_fin:       parsed.data.date_fin       ?? `${annee}-12-31`,
      statut:         'en_cours',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
})
