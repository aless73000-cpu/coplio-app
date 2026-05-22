import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/api-handler'

export const PATCH = withErrorHandler(async (_req: Request, { params }: { params: { id: string } }) => {
  try {
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

    // Vérifier que l'appel appartient au cabinet via la copropriété
    const { data: appel } = await admin
      .from('appels_charges')
      .select('montant, copropriete:coproprietes(cabinet_id)')
      .eq('id', params.id)
      .single()

    if (!appel) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((appel.copropriete as { cabinet_id: string } | null)?.cabinet_id !== profile.cabinet_id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { error } = await admin.from('appels_charges')
      .update({ paye: true, montant_paye: appel.montant, date_paiement: new Date().toISOString() })
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})