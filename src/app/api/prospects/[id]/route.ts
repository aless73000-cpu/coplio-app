import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const patchSchema = z.object({
  nom: z.string().min(1).optional(),
  statut: z.enum(['prospect', 'qualifie', 'proposition', 'negocie', 'gagne', 'perdu']).optional(),
  contact_nom: z.string().nullable().optional(),
  contact_email: z.string().email().nullable().optional().or(z.literal('').transform(() => null)),
  contact_telephone: z.string().nullable().optional(),
  adresse: z.string().nullable().optional(),
  ville: z.string().nullable().optional(),
  code_postal: z.string().nullable().optional(),
  nb_lots: z.number().int().positive().nullable().optional(),
  montant_potentiel: z.number().nonnegative().nullable().optional(),
  probabilite: z.number().min(0).max(100).nullable().optional(),
  notes: z.string().nullable().optional(),
  prochain_rdv: z.string().nullable().optional(),
})

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('cabinet_id')
      .single()
    if (!profile?.cabinet_id) return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })

    const { data, error } = await supabase
      .from('prospects')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('cabinet_id', profile.cabinet_id) // isolation cabinet
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Non trouvé ou accès refusé' }, { status: 404 })
    return NextResponse.json(data)
  } catch (err) {
    console.error('[API Error] prospects PATCH', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('cabinet_id')
      .single()
    if (!profile?.cabinet_id) return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })

    const { error } = await supabase
      .from('prospects')
      .delete()
      .eq('id', params.id)
      .eq('cabinet_id', profile.cabinet_id) // isolation cabinet

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[API Error] prospects DELETE', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
