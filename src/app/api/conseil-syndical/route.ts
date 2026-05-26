import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api-handler'

const postSchema = z.object({
  copropriete_id: z.string().uuid(),
  prenom: z.string().min(1),
  nom: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  telephone: z.string().optional(),
  role: z.enum(['president', 'vice_president', 'tresorier', 'secretaire', 'membre']).optional(),
  lot_numero: z.string().optional(),
  date_debut: z.string().optional(),
  date_fin: z.string().nullable().optional(),
})

export const GET = withErrorHandler(async (request: Request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()
  if (!profile?.cabinet_id) return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const coproprieteId = searchParams.get('copropriete_id')
  if (!coproprieteId) return NextResponse.json({ error: 'copropriete_id requis' }, { status: 400 })

  // Vérifier que la copropriété appartient au cabinet de l'utilisateur
  const { data: copro } = await supabase
    .from('coproprietes')
    .select('id')
    .eq('id', coproprieteId)
    .eq('cabinet_id', profile.cabinet_id)
    .single()

  if (!copro) return NextResponse.json({ error: 'Copropriété introuvable ou accès refusé' }, { status: 403 })

  // Lecture via admin pour contourner les RLS en lecture
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('conseil_syndical')
    .select('*')
    .eq('copropriete_id', coproprieteId)
    .order('role')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
})

export const POST = withErrorHandler(async (request: Request) => {
  // Authentification via client normal
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()
  if (!profile?.cabinet_id) return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })

  const body = await request.json()
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })

  // Vérifier que la copropriété appartient bien à ce cabinet
  const { data: copro } = await supabase
    .from('coproprietes')
    .select('id')
    .eq('id', parsed.data.copropriete_id)
    .eq('cabinet_id', profile.cabinet_id)
    .single()

  if (!copro) return NextResponse.json({ error: 'Copropriété introuvable ou accès refusé' }, { status: 403 })

  // Écriture via admin pour contourner les RLS
  const admin = createAdminClient()
  const { copropriete_id, prenom, nom, email, telephone, role, lot_numero, date_debut, date_fin } = parsed.data
  const { data, error } = await admin
    .from('conseil_syndical')
    .insert({ copropriete_id, prenom, nom, email, telephone, role: role ?? 'membre', lot_numero, date_debut, date_fin })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
})
