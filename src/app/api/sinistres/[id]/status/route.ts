import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/api-handler'
import { captureException } from '@/lib/monitoring'
import { sendSMS, smsSinistreNotification } from '@/lib/twilio'

const VALID_STATUSES = ['signale', 'assurance_declaree', 'urgence', 'expertise', 'travaux', 'cloture']

export const POST = withErrorHandler(async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('cabinet_id')
      .single()
    if (!profile?.cabinet_id) return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })

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

    // Verify cabinet ownership before update
    const { data: sinistre } = await admin
      .from('sinistres')
      .select('cabinet_id, titre, lots_concernes')
      .eq('id', params.id)
      .single()

    if (!sinistre) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })
    if (sinistre.cabinet_id !== profile.cabinet_id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { error } = await admin
      .from('sinistres')
      .update({ status: status as 'signale' | 'assurance_declaree' | 'urgence' | 'expertise' | 'travaux' | 'cloture' })
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Notifier les copropriétaires des lots concernés
    try {
      if (sinistre.lots_concernes?.length) {
        const { data: residents } = await admin
          .from('profiles')
          .select('id, prenom, telephone')
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
              titre: `Sinistre mis à jour : ${STATUS_LABELS[status!] ?? status}`,
              message: sinistre.titre,
              lu: false,
            }))
          )

          // SMS aux résidents concernés (non bloquant)
          for (const r of residents as { id: string; prenom: string | null; telephone: string | null }[]) {
            if (r.telephone) {
              sendSMS(
                r.telephone,
                smsSinistreNotification({
                  prenom: r.prenom ?? '',
                  titre: sinistre.titre,
                  status: STATUS_LABELS[status!] ?? status!,
                  nomCopropriete: '',
                })
              ).catch((err) => captureException(err, { context: 'sinistres-status-sms' }))
            }
          }
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
})
