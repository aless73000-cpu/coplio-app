import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api-handler'

const schema = z.object({
  nom: z.string().min(1),
  type_document: z.enum(['pv_ag', 'mandat', 'devis', 'contrat', 'autre']).default('autre'),
  copropriete_id: z.string().uuid().optional().nullable(),
  signataires: z.array(z.object({
    prenom: z.string(),
    nom: z.string(),
    email: z.string().email(),
  })).min(1),
  fichier_url: z.string().optional().nullable(),
})

export const GET = withErrorHandler(async (request: Request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single()
  if (!profile?.cabinet_id) return NextResponse.json([])

  const { searchParams } = new URL(request.url)
  const coproprieteId = searchParams.get('copropriete_id')

  let query = supabase
    .from('signatures')
    .select('*, copropriete:coproprietes(id, nom)')
    .eq('cabinet_id', profile.cabinet_id)
    .order('created_at', { ascending: false })

  if (coproprieteId) query = query.eq('copropriete_id', coproprieteId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
})

export const POST = withErrorHandler(async (request: Request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single()
  if (!profile?.cabinet_id) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  // YouSign non encore configuré — toutes les demandes sont sauvegardées en brouillon
  // L'intégration YouSign sera branchée ici quand YOUSIGN_API_KEY sera disponible
  const statut = 'brouillon'
  const lienSignature: string | null = null

  const { data, error } = await supabase
    .from('signatures')
    .insert({
      cabinet_id: profile.cabinet_id,
      copropriete_id: parsed.data.copropriete_id ?? null,
      nom: parsed.data.nom,
      type_document: parsed.data.type_document,
      yousign_request_id: null,
      statut,
      signataires: parsed.data.signataires,
      fichier_url: parsed.data.fichier_url ?? null,
      lien_signature: lienSignature,
      created_by: user.id,
    })
    .select('*, copropriete:coproprietes(id, nom)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
})
