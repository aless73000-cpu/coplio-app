import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api-handler'

const createSchema = z.object({
  mandant_id:     z.string().uuid(),
  mandataire_id:  z.string().uuid(),
  date_signature: z.string().optional(),
  document_id:    z.string().uuid().optional(),
  notes:          z.string().optional(),
})

// ── GET /api/assemblees/[id]/pouvoirs ─────────────────────────────
// Liste tous les pouvoirs/mandats déposés pour cette AG.
export const GET = withErrorHandler(async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const admin = createAdminClient()

  // Vérifier l'appartenance cabinet
  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()

  const { data: ag } = await admin
    .from('assemblees_generales')
    .select('id, copropriete:coproprietes(cabinet_id)')
    .eq('id', id)
    .single()

  if (!ag) return NextResponse.json({ error: 'AG introuvable' }, { status: 404 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((ag.copropriete as any)?.cabinet_id !== profile?.cabinet_id) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { data, error } = await admin
    .from('pouvoirs')
    .select(`
      id,
      mandant_id,
      mandataire_id,
      date_signature,
      notes,
      created_at,
      mandant:coproprietaires!pouvoirs_mandant_id_fkey(id, prenom, nom),
      mandataire:coproprietaires!pouvoirs_mandataire_id_fkey(id, prenom, nom)
    `)
    .eq('ag_id', id)
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Agréger le nombre de mandats par mandataire (Art. 22 : plafond 3)
  const mandataireCount: Record<string, number> = {}
  for (const p of data ?? []) {
    mandataireCount[p.mandataire_id] = (mandataireCount[p.mandataire_id] ?? 0) + 1
  }

  return NextResponse.json({ pouvoirs: data ?? [], mandataireCount })
})

// ── POST /api/assemblees/[id]/pouvoirs ────────────────────────────
// Dépose un mandat : le mandant délègue son vote au mandataire.
// Le trigger DB vérifie le plafond Art. 22 al. 2 (3 mandats max).
export const POST = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
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
  const { data: ag } = await admin
    .from('assemblees_generales')
    .select('id, status, copropriete:coproprietes(cabinet_id)')
    .eq('id', id)
    .single()

  if (!ag) return NextResponse.json({ error: 'AG introuvable' }, { status: 404 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((ag.copropriete as any)?.cabinet_id !== profile.cabinet_id) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  // Les pouvoirs ne peuvent pas être déposés après la clôture de l'AG
  if (ag.status === 'terminee' || ag.status === 'annulee') {
    return NextResponse.json({ error: 'L\'AG est terminée, les pouvoirs ne peuvent plus être modifiés' }, { status: 400 })
  }

  // Vérifier que mandant et mandataire appartiennent à une copropriété gérée par ce cabinet
  const { data: mandant } = await admin
    .from('coproprietaires')
    .select('id')
    .eq('id', parsed.data.mandant_id)
    .eq('cabinet_id', profile.cabinet_id)
    .single()

  const { data: mandataire } = await admin
    .from('coproprietaires')
    .select('id')
    .eq('id', parsed.data.mandataire_id)
    .eq('cabinet_id', profile.cabinet_id)
    .single()

  if (!mandant) return NextResponse.json({ error: 'Mandant introuvable' }, { status: 404 })
  if (!mandataire) return NextResponse.json({ error: 'Mandataire introuvable' }, { status: 404 })

  // Le syndic et les membres de son équipe ne peuvent pas être mandataires (Loi 1965 art. 22)
  // Note : vérification à affiner si le mandataire a un profile_id lié à un gestionnaire
  const { data: existingPouvoir } = await admin
    .from('pouvoirs')
    .select('id')
    .eq('ag_id', id)
    .eq('mandant_id', parsed.data.mandant_id)
    .single()

  if (existingPouvoir) {
    return NextResponse.json({ error: 'Ce copropriétaire a déjà donné un pouvoir pour cette AG' }, { status: 409 })
  }

  // L'insertion déclenche le trigger check_pouvoir_limit (Art. 22 al. 2)
  const { data, error } = await admin
    .from('pouvoirs')
    .insert({
      ag_id:          id,
      mandant_id:     parsed.data.mandant_id,
      mandataire_id:  parsed.data.mandataire_id,
      date_signature: parsed.data.date_signature ?? null,
      document_id:    parsed.data.document_id ?? null,
      notes:          parsed.data.notes ?? null,
      created_by:     user.id,
    })
    .select()
    .single()

  if (error) {
    // Le trigger peut lever une exception Art. 22
    if (error.message.includes('Art. 22')) {
      return NextResponse.json({ error: error.message }, { status: 422 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
})
