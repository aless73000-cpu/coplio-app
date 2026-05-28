import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api-handler'
import { captureException } from '@/lib/monitoring'
const postSchema = z.object({
  copropriete_id: z.string().uuid(),
  annee: z.number().int().min(2000).max(2100),
  cotisation_annuelle: z.number().min(0).optional(),
  objectif_5ans: z.number().min(0).optional(),
  compte_bancaire: z.string().optional(),
  notes: z.string().optional(),
})

async function verifyCopropriete(supabase: Awaited<ReturnType<typeof createClient>>, coproprieteId: string, cabinetId: string) {
  const { data } = await supabase
    .from('coproprietes')
    .select('id')
    .eq('id', coproprieteId)
    .eq('cabinet_id', cabinetId)
    .single()
  return !!data
}

export const GET = withErrorHandler(async (request: Request) => {
  try {
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

    // Verify copropriete belongs to caller's cabinet
    const ok = await verifyCopropriete(supabase, coproprieteId, profile.cabinet_id)
    if (!ok) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

    const { data, error } = await supabase
      .from('fonds_travaux')
      .select('*, mouvements:fonds_travaux_mouvements(*)')
      .eq('copropriete_id', coproprieteId)
      .order('annee', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const mapped = (data ?? []).map((ft: Record<string, unknown>) => ({
      ...ft,
      mouvements: ((ft.mouvements ?? []) as Record<string, unknown>[]).map(m => ({ ...m, type: m.type_mouvement })),
    }))
    return NextResponse.json(mapped)
  } catch (err) {
    captureException(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})

export const POST = withErrorHandler(async (request: Request) => {
  try {
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

    // Verify copropriete belongs to caller's cabinet
    const ok = await verifyCopropriete(supabase, parsed.data.copropriete_id, profile.cabinet_id)
    if (!ok) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

    const { copropriete_id, annee, cotisation_annuelle, objectif_5ans, compte_bancaire, notes } = parsed.data
    const { data, error } = await supabase
      .from('fonds_travaux')
      .insert({ copropriete_id, annee, cotisation_annuelle: cotisation_annuelle ?? 0, solde_actuel: 0, objectif_5ans: objectif_5ans ?? 0, compte_bancaire, notes })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    captureException(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})
