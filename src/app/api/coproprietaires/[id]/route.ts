import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

async function getCallerCabinetId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, cabinetId: null, supabase }

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .single()

  return { user, cabinetId: profile?.cabinet_id ?? null, supabase }
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const { user, cabinetId } = await getCallerCabinetId()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!cabinetId) return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('coproprietaires')
      .select('*')
      .eq('id', params.id)
      .eq('cabinet_id', cabinetId) // isolation cabinet
      .single()

    if (error || !data) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const schema = z.object({
  prenom: z.string().min(1),
  nom: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  telephone: z.string().optional(),
  adresse_correspondance: z.string().optional(),
  notes_internes: z.string().optional(),
})

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { user, cabinetId } = await getCallerCabinetId()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!cabinetId) return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

    const { email, notes_internes, ...rest } = parsed.data
    const admin = createAdminClient()

    // Verify ownership before update
    const { data: existing } = await admin
      .from('coproprietaires')
      .select('id, cabinet_id')
      .eq('id', params.id)
      .eq('cabinet_id', cabinetId) // isolation cabinet
      .single()

    if (!existing) return NextResponse.json({ error: 'Non trouvé ou accès refusé' }, { status: 404 })

    const { data, error } = await admin
      .from('coproprietaires')
      .update({ ...rest, ...(email ? { email } : { email: null }) })
      .eq('id', params.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Mise à jour notes_internes séparément (colonne optionnelle — migration requise)
    if (notes_internes !== undefined) {
      await admin
        .from('coproprietaires')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ notes_internes: notes_internes || null } as any)
        .eq('id', params.id)
        .then(() => { /* ignore error if column missing */ })
    }

    return NextResponse.json({ ...data, notes_internes: notes_internes ?? null })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const { user, cabinetId } = await getCallerCabinetId()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!cabinetId) return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })

    const admin = createAdminClient()

    // Verify ownership before delete
    const { data: existing } = await admin
      .from('coproprietaires')
      .select('id, cabinet_id')
      .eq('id', params.id)
      .eq('cabinet_id', cabinetId) // isolation cabinet
      .single()

    if (!existing) return NextResponse.json({ error: 'Non trouvé ou accès refusé' }, { status: 404 })

    // Supprimer les assignations de lots d'abord
    await admin.from('coproprietaire_lots').delete().eq('coproprietaire_id', params.id)
    // Supprimer le copropriétaire
    const { error } = await admin.from('coproprietaires').delete().eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
