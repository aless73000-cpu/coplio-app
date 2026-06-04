import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Email } from '@/lib/email'
import { rateLimit, getIP, rateLimitResponse } from '@/lib/rate-limit'
import { withErrorHandler } from '@/lib/api-handler'
import { captureException } from '@/lib/monitoring'
import { sendSMS, smsConvocationAG } from '@/lib/twilio'

export const POST = withErrorHandler(async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  // 10 convocations max par IP par heure (chaque envoi = plusieurs emails)
  const ip = getIP(_request)

  // Message d'introduction personnalisé (optionnel) saisi par le syndic
  let messagePersonnalise = ''
  try {
    const body = await _request.json()
    if (typeof body?.messagePersonnalise === 'string') {
      messagePersonnalise = body.messagePersonnalise.trim().slice(0, 2000)
    }
  } catch {
    // pas de body / body non-JSON → convocation type
  }

  const limit = await rateLimit(`convoquer:${ip}`, { max: 10, windowMs: 60 * 60 * 1000 })
  if (!limit.success) return rateLimitResponse(limit.resetAt)

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('cabinet_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.cabinet_id || profile.role === 'owner_resident') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const admin = createAdminClient()

    // Récupérer l'AG + résolutions
    const { data: ag } = await admin
      .from('assemblees_generales')
      .select('*, copropriete:coproprietes(id, nom), resolutions:ag_resolutions(titre, ordre)')
      .eq('id', (await params).id)
      .eq('cabinet_id', profile.cabinet_id)
      .single()

    if (!ag) return NextResponse.json({ error: 'AG introuvable' }, { status: 404 })
    if (ag.status === 'terminee' || ag.status === 'annulee') {
      return NextResponse.json({ error: 'AG terminée ou annulée' }, { status: 400 })
    }

    const { data: cabinet } = await admin
      .from('cabinets')
      .select('nom')
      .eq('id', profile.cabinet_id)
      .single()

    const copropriete = ag.copropriete as { id: string; nom: string } | null
    const coproprieteId = copropriete?.id
    const nomCopropriete = copropriete?.nom ?? 'votre résidence'
    if (!coproprieteId) return NextResponse.json({ error: 'Copropriété introuvable' }, { status: 400 })

    // Récupérer tous les copropriétaires de la résidence
    const { data: lots } = await admin
      .from('lots')
      .select('id, numero')
      .eq('copropriete_id', coproprieteId)

    const lotIds = (lots ?? []).map((l: { id: string }) => l.id)

    const { data: profiles } = await admin
      .from('profiles')
      .select('prenom, nom, email, telephone, lot_id')
      .in('lot_id', lotIds)
      .eq('role', 'owner_resident')

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coplio.fr'
    const dateAg = new Date(ag.date_ag)
    const listeResolutions = ((ag.resolutions ?? []) as { titre: string; ordre: number }[])
      .sort((a, b) => a.ordre - b.ordre)
      .map(r => r.titre)

    // Envoyer les convocations via le service batch (avec retry + logs)
    const recipients = (profiles ?? [])
      .filter((p): p is typeof p & { email: string } => Boolean(p.email))
      .map((p) => ({
        to: p.email,
        props: {
          prenom: p.prenom ?? '',
          nom: p.nom ?? '',
          cabinetNom: cabinet?.nom ?? 'Votre syndic',
          nomCopropriete,
          dateAg: dateAg.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
          heure: dateAg.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          lieu: ag.lieu ?? 'À définir',
          listeResolutions,
          lienVote: `${appUrl}/mes-assemblees`,
          ...(messagePersonnalise ? { messagePersonnalise } : {}),
        },
      }))

    const { sent } = await Email.convocationAGBatch(recipients)

    // SMS de convocation (non bloquant)
    const dateAgFormatted = dateAg.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    for (const p of (profiles ?? [])) {
      const pTyped = p as typeof p & { telephone?: string | null }
      if (pTyped.telephone) {
        sendSMS(
          pTyped.telephone,
          smsConvocationAG({
            prenom: p.prenom ?? '',
            dateAg: dateAgFormatted,
            nomCopropriete,
          })
        ).catch((err) => captureException(err, { context: 'assemblees-convoquer-sms' }))
      }
    }

    // Mettre à jour le statut de l'AG
    await admin
      .from('assemblees_generales')
      .update({
        status: 'convocations_envoyees',
        convocations_envoyees_at: new Date().toISOString(),
      })
      .eq('id', (await params).id)

    return NextResponse.json({ success: true, sent })
  } catch (err) {
    captureException(err, { context: 'assemblees-convoquer' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})
