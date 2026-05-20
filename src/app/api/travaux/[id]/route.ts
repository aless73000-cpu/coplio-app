import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { captureException } from '@/lib/monitoring'

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

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data, error } = await supabase
      .from('travaux')
      .select('*, prestataire:prestataires(id, nom, telephone), etapes:travaux_etapes(*)')
      .eq('id', params.id)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
    return NextResponse.json(data)
  } catch (err) {
    captureException(err, { context: 'travaux-id-get' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()

    // Ajouter une étape
    if (body._etape) {
      const parsed = etapeSchema.safeParse(body._etape)
      if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
      await supabase.from('travaux_etapes').insert({ ...parsed.data, travail_id: params.id, created_by: user.id })
    }

    // Mettre à jour le travail
    const { _etape, ...fields } = body
    const parsed = patchSchema.safeParse(fields)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    if (Object.keys(parsed.data).length > 0) {
      await supabase.from('travaux').update({ ...parsed.data, updated_at: new Date().toISOString() }).eq('id', params.id)
    }

    const { data } = await supabase
      .from('travaux')
      .select('*, prestataire:prestataires(id, nom, telephone), etapes:travaux_etapes(*)')
      .eq('id', params.id)
      .single()

    return NextResponse.json(data)
  } catch (err) {
    captureException(err, { context: 'travaux-id-patch' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    await supabase.from('travaux').delete().eq('id', params.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    captureException(err, { context: 'travaux-id-delete' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
