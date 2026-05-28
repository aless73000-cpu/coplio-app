import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api-handler'
import { captureException } from '@/lib/monitoring'
const patchSchema = z.object({
  cotisation_annuelle: z.number().min(0).optional(),
  solde_actuel: z.number().optional(),
  objectif_5ans: z.number().min(0).optional(),
  compte_bancaire: z.string().optional(),
  notes: z.string().optional(),
})

const mouvementSchema = z.object({
  type: z.enum(['depot', 'retrait', 'virement']),
  montant: z.number().positive(),
  libelle: z.string().optional(),
  date_mouvement: z.string().optional(),
})

async function getCallerCabinetId() {
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

async function verifyFondsOwnership(supabase: Awaited<ReturnType<typeof createClient>>, fondsId: string, cabinetId: string) {
  const { data } = await supabase
    .from('fonds_travaux')
    .select('id, copropriete:coproprietes(cabinet_id)')
    .eq('id', fondsId)
    .single()

  if (!data) return false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.copropriete as unknown as { cabinet_id: string } | null)?.cabinet_id === cabinetId
}

export const PATCH = withErrorHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  try {
    const { user, cabinetId, supabase } = await getCallerCabinetId()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    if (!cabinetId) return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })

    const owns = await verifyFondsOwnership(supabase, id, cabinetId)
    if (!owns) return NextResponse.json({ error: 'Non trouvé ou accès refusé' }, { status: 404 })

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })

    const { data, error } = await supabase
      .from('fonds_travaux')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    captureException(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})

export const POST = withErrorHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  try {
    // Add mouvement
    const { user, cabinetId, supabase } = await getCallerCabinetId()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    if (!cabinetId) return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })

    const owns = await verifyFondsOwnership(supabase, id, cabinetId)
    if (!owns) return NextResponse.json({ error: 'Non trouvé ou accès refusé' }, { status: 404 })

    const body = await request.json()
    const parsed = mouvementSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })

    const { type, montant, libelle, date_mouvement } = parsed.data

    const { data: mouvement, error: mErr } = await supabase
      .from('fonds_travaux_mouvements')
      .insert({ fonds_travaux_id: id, type_mouvement: type, montant, libelle, date_mouvement: date_mouvement ?? new Date().toISOString().split('T')[0] })
      .select()
      .single()

    if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })

    // Update solde
    const { data: ft } = await supabase.from('fonds_travaux').select('solde_actuel').eq('id', id).single()
    const delta = type === 'retrait' ? -Math.abs(montant) : Math.abs(montant)
    await supabase.from('fonds_travaux').update({ solde_actuel: (ft?.solde_actuel ?? 0) + delta }).eq('id', id)

    return NextResponse.json(mouvement)
  } catch (err) {
    captureException(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})

export const DELETE = withErrorHandler(async (_: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  try {
    const { user, cabinetId, supabase } = await getCallerCabinetId()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    if (!cabinetId) return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })

    const owns = await verifyFondsOwnership(supabase, id, cabinetId)
    if (!owns) return NextResponse.json({ error: 'Non trouvé ou accès refusé' }, { status: 404 })

    const { error } = await supabase.from('fonds_travaux').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    captureException(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})
