import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const VALID_STATUSES = ['planifiee', 'convocations_envoyees', 'en_cours', 'terminee', 'annulee'] as const

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('cabinet_id')
      .eq('id', user.id)
      .single()
    if (!profile?.cabinet_id) return NextResponse.json({ error: 'Cabinet non trouvé' }, { status: 403 })

    const body = await request.json()
    const status = body.status as string
    if (!VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Vérifier que l'AG appartient au cabinet
    const { data: ag } = await admin
      .from('assemblees_generales')
      .select('id, cabinet_id')
      .eq('id', params.id)
      .single()

    if (!ag || ag.cabinet_id !== profile.cabinet_id) {
      return NextResponse.json({ error: 'AG introuvable' }, { status: 404 })
    }

    const { error } = await admin
      .from('assemblees_generales')
      .update({ status: status as 'planifiee' | 'convocations_envoyees' | 'en_cours' | 'terminee' | 'annulee' })
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
