// GET  → liste des conversations du cabinet
// POST → créer ou récupérer une conversation avec un copropriétaire

import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireCabinetUser } from '@/lib/api-handler'

export async function GET() {
  const ctx = await requireCabinetUser()
  if (ctx instanceof NextResponse) return ctx

  const { cabinetId } = ctx
  const admin = createAdminClient()
  const { data: convs, error } = await admin
    .from('conversations')
    .select('id, sujet, derniere_activite, coproprietaire_id, copropriete_id')
    .eq('cabinet_id', cabinetId)
    .order('derniere_activite', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enrichir avec les noms des copropriétaires
  const seen = new Set<string>()
  const coproIds = (convs ?? []).map(c => c.coproprietaire_id).filter((id): id is string => !!id && !seen.has(id) && !!seen.add(id))
  const { data: copros } = coproIds.length > 0
    ? await admin.from('coproprietaires').select('id, prenom, nom').in('id', coproIds)
    : { data: [] }
  const coproMap = Object.fromEntries((copros ?? []).map(c => [c.id, c]))

  const result = (convs ?? []).map(c => ({
    id: c.id,
    sujet: c.sujet,
    derniere_activite: c.derniere_activite,
    coproprietaire_id: c.coproprietaire_id,
    coproprietaire: c.coproprietaire_id ? coproMap[c.coproprietaire_id] ?? null : null,
  }))

  return NextResponse.json(result)
}

const createSchema = z.object({
  coproprietaire_id: z.string().uuid(),
  sujet: z.string().optional(),
})

export async function POST(req: Request) {
  const ctx = await requireCabinetUser()
  if (ctx instanceof NextResponse) return ctx

  const { cabinetId } = ctx

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const admin = createAdminClient()

  // Vérifier si une conversation existe déjà avec ce copropriétaire
  const { data: existing } = await admin
    .from('conversations')
    .select('id, sujet, derniere_activite, coproprietaire_id')
    .eq('cabinet_id', cabinetId)
    .eq('coproprietaire_id', parsed.data.coproprietaire_id)
    .order('derniere_activite', { ascending: false })
    .limit(1)
    .single()

  if (existing) {
    const { data: copro } = await admin.from('coproprietaires').select('id, prenom, nom').eq('id', existing.coproprietaire_id!).single()
    return NextResponse.json({ ...existing, coproprietaire: copro ?? null })
  }

  // Créer la conversation
  const { data: created, error } = await admin
    .from('conversations')
    .insert({
      cabinet_id: cabinetId,
      coproprietaire_id: parsed.data.coproprietaire_id,
      sujet: parsed.data.sujet ?? null,
      derniere_activite: new Date().toISOString(),
    })
    .select('id, sujet, derniere_activite, coproprietaire_id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: copro } = await admin.from('coproprietaires').select('id, prenom, nom').eq('id', parsed.data.coproprietaire_id).single()
  return NextResponse.json({ ...created, coproprietaire: copro ?? null }, { status: 201 })
}
