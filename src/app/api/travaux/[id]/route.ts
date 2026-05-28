import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api-handler'

const patchSchema = z.object({
  titre: z.string().min(1).optional(),
  description: z.string().optional(),
  priorite: z.enum(['basse', 'normale', 'haute', 'urgente']).optional(),
  statut: z.enum(['demande', 'devis', 'vote', 'commande', 'realisation', 'reception', 'archive']).optional(),
  montant_estime: z.number().min(0).optional().nullable(),
  montant_final: z.number().min(0).optional().nullable(),
  prestataire_id: z.string().uuid().optional().nullable(),
})

const etapeSchema = z.object({
  type: z.enum(['devis', 'vote', 'commande', 'photo', 'facture', 'note']),
  description: z.string().optional(),
  fichier_url: z.string().optional().nullable(),
  montant: z.number().min(0).optional().nullable(),
})

async function getCallerInfo() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, cabinetId: null, supabase }

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()

  return { user, cabinetId: profile?.cabinet_id ?? null, supabase }
}

export const GET = withErrorHandler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const { user, cabinetId, supabase } = await getCallerInfo()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  if (!cabinetId) return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })

  const { data, error } = await supabase
    .from('travaux')
    .select('*, prestataire:prestataires(id, nom, telephone), etapes:travaux_etapes(*)')
    .eq('id', id)
    .eq('cabinet_id', cabinetId) // isolation cabinet
    .single()

  if (error || !data) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  return NextResponse.json(data)
})

export const PATCH = withErrorHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const { user, cabinetId, supabase } = await getCallerInfo()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  if (!cabinetId) return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })

  const body = await request.json()

  // Ajouter une étape
  if (body._etape) {
    const parsed = etapeSchema.safeParse(body._etape)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    // Verify ownership before insert
    const { data: travail } = await supabase
      .from('travaux')
      .select('id')
      .eq('id', id)
      .eq('cabinet_id', cabinetId)
      .single()
    if (!travail) return NextResponse.json({ error: 'Non trouvé ou accès refusé' }, { status: 404 })

    await supabase.from('travaux_etapes').insert({ ...parsed.data, travail_id: id, created_by: user.id })
  }

  // Mettre à jour le travail
  const { _etape, ...fields } = body
  const parsed = patchSchema.safeParse(fields)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  if (Object.keys(parsed.data).length > 0) {
    await supabase
      .from('travaux')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('cabinet_id', cabinetId) // isolation cabinet
  }

  const { data } = await supabase
    .from('travaux')
    .select('*, prestataire:prestataires(id, nom, telephone), etapes:travaux_etapes(*)')
    .eq('id', id)
    .eq('cabinet_id', cabinetId) // isolation cabinet
    .single()

  return NextResponse.json(data)
})

export const DELETE = withErrorHandler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const { user, cabinetId, supabase } = await getCallerInfo()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  if (!cabinetId) return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })

  const { error } = await supabase
    .from('travaux')
    .delete()
    .eq('id', id)
    .eq('cabinet_id', cabinetId) // isolation cabinet

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
})
