import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api-handler'
import { captureException } from '@/lib/monitoring'
const patchSchema = z.object({
  description: z.string().min(1).optional(),
  type: z.string().optional(),
  localisation: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  date_remise: z.string().nullable().optional(),
  detenteur_id: z.string().uuid().nullable().optional(),
  detenteur_nom: z.string().nullable().optional(),
  retourne: z.boolean().optional(),
})

async function getProfile(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .single()
  return profile
}

export const PATCH = withErrorHandler(async (request: Request, { params }: { params: { id: string } }) => {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const profile = await getProfile(supabase)
    if (!profile?.cabinet_id) return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })

    const { data, error } = await supabase
      .from('cles_acces')
      .update(parsed.data)
      .eq('id', params.id)
      .eq('cabinet_id', profile.cabinet_id) // isolation cabinet
      .select('*, detenteur:profiles(id, prenom, nom)')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Non trouvé ou accès refusé' }, { status: 404 })
    return NextResponse.json(data)
  } catch (err) {
    captureException(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})

export const DELETE = withErrorHandler(async (_request: Request, { params }: { params: { id: string } }) => {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const profile = await getProfile(supabase)
    if (!profile?.cabinet_id) return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })

    const { error } = await supabase
      .from('cles_acces')
      .delete()
      .eq('id', params.id)
      .eq('cabinet_id', profile.cabinet_id) // isolation cabinet

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    captureException(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})
