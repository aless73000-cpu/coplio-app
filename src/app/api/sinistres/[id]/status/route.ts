import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const VALID_STATUSES = ['signale', 'assurance_declaree', 'urgence', 'expertise', 'travaux', 'cloture']

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    // Support both form data and JSON
    let status: string | null = null
    const contentType = request.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      const body = await request.json()
      status = body.status
    } else {
      const formData = await request.formData()
      status = formData.get('status') as string | null
    }

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('sinistres')
      .update({ status: status as 'signale' | 'assurance_declaree' | 'urgence' | 'expertise' | 'travaux' | 'cloture' })
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Notifier les copropriétaires des lots concernés
    try {
      const { data: sinistre } = await admin
        .from('sinistres')
        .select('titre, lots_concernes')
        .eq('id', params.id)
        .single()

      if (sinistre?.lots_concernes?.length) {
        const { data: residents } = await admin
          .from('profiles')
          .select('id')
          .in('lot_id', sinistre.lots_concernes)
          .eq('role', 'owner_resident')

        const STATUS_LABELS: Record<string, string> = {
          signale: 'Signalé',
          assurance_declaree: 'Assurance déclarée',
          urgence: 'Urgence',
          expertise: 'En expertise',
          travaux: 'Travaux en cours',
          cloture: 'Clôturé',
        }
        const notifType = status === 'urgence' ? 'urgent' : status === 'cloture' ? 'info' : 'alerte'

        if (residents?.length) {
          await admin.from('notifications').insert(
            residents.map((r: { id: string }) => ({
              user_id: r.id,
              type: notifType,
              titre: `Sinistre mis à jour : ${STATUS_LABELS[status] ?? status}`,
              message: sinistre.titre,
              lu: false,
            }))
          )
        }
      }
    } catch { /* non bloquant */ }

    // Redirect back to sinistre page if form submission
    if (!contentType.includes('application/json')) {
      return NextResponse.redirect(new URL(`/sinistres/${params.id}`, request.url))
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
