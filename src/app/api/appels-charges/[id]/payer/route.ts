import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/api-handler'
import { logAction } from '@/lib/audit'

export const PATCH = withErrorHandler(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
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

  const admin = createAdminClient()

  // Vérifier que l'appel appartient au cabinet via la copropriété (join + sécurité)
  const { data: appel } = await admin
    .from('appels_charges')
    .select('id, montant, libelle, copropriete:coproprietes(cabinet_id)')
    .eq('id', id)
    .single()

  if (!appel) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((appel.copropriete as { cabinet_id: string } | null)?.cabinet_id !== profile.cabinet_id) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { error } = await admin
    .from('appels_charges')
    .update({ paye: true, montant_paye: appel.montant, date_paiement: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAction(admin, {
    cabinet_id: profile.cabinet_id,
    user_id: user.id,
    action: 'pay',
    entite: 'appel_charges',
    entite_id: appel.id,
    entite_nom: appel.libelle,
  })

  return NextResponse.json({ success: true })
})
