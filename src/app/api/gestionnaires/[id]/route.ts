import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/api-handler'

export const DELETE = withErrorHandler(async (
  _request: Request,
  { params }: { params: { id: string } }
) => {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: requester } = await supabase
      .from('profiles')
      .select('cabinet_id, role')
      .eq('id', user.id)
      .single()

    if (requester?.role !== 'owner') {
      return NextResponse.json({ error: 'Réservé au propriétaire du compte' }, { status: 403 })
    }

    // Ne peut pas se supprimer soi-même
    if (params.id === user.id) {
      return NextResponse.json({ error: 'Vous ne pouvez pas vous retirer vous-même' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Vérifier que le gestionnaire appartient bien à ce cabinet
    const { data: target } = await admin
      .from('profiles')
      .select('cabinet_id, role')
      .eq('id', params.id)
      .single()

    if (!target || target.cabinet_id !== requester?.cabinet_id) {
      return NextResponse.json({ error: 'Gestionnaire introuvable' }, { status: 404 })
    }

    if (target.role === 'owner') {
      return NextResponse.json({ error: "Impossible de retirer le propriétaire du cabinet" }, { status: 400 })
    }

    // Détacher du cabinet (ne pas supprimer le compte)
    const { error } = await admin
      .from('profiles')
      .update({ cabinet_id: null, role: 'manager' })
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})
