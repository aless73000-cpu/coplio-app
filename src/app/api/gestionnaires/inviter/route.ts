import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { checkQuota, quotaExceededResponse } from '@/lib/plan-guard'
import { Email } from '@/lib/email'
import { withErrorHandler } from '@/lib/api-handler'
import { captureException } from '@/lib/monitoring'

const schema = z.object({
  email: z.string().email(),
  prenom: z.string().min(1).optional(),
  nom: z.string().min(1).optional(),
})

export const POST = withErrorHandler(async (request: Request) => {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('cabinet_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.cabinet_id) return NextResponse.json({ error: 'Cabinet introuvable' }, { status: 400 })
    if (profile.role !== 'owner') return NextResponse.json({ error: 'Réservé au propriétaire du compte' }, { status: 403 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Email invalide' }, { status: 400 })

    // Vérification quota gestionnaires
    const quota = await checkQuota(profile.cabinet_id, 'gestionnaires', 1)
    if (!quota.allowed) return quotaExceededResponse(quota)

    const admin = createAdminClient()

    // Récupérer les infos du cabinet pour l'email
    const { data: cabinet } = await admin
      .from('cabinets')
      .select('nom')
      .eq('id', profile.cabinet_id)
      .single()

    // Vérifier que l'email n'est pas déjà un membre du cabinet
    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('cabinet_id', profile.cabinet_id)
      .eq('email', parsed.data.email)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Cet utilisateur est déjà membre de votre cabinet' }, { status: 409 })
    }

    // Générer le lien d'invitation Supabase avec les métadonnées
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'invite',
      email: parsed.data.email,
      options: {
        data: {
          role: 'manager',
          cabinet_id: profile.cabinet_id,
          invited_by: user.id,
          prenom: parsed.data.prenom ?? '',
          nom: parsed.data.nom ?? '',
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/dashboard`,
      },
    })

    if (linkError || !linkData?.properties?.action_link) {
      captureException(new Error('generateLink gestionnaire'), { context: 'gestionnaires-inviter', error: linkError })
      return NextResponse.json({ error: "Impossible de générer le lien d'invitation" }, { status: 500 })
    }

    // Envoyer l'email d'invitation
    await Email.invitationGestionnaire(
      {
        prenom: parsed.data.prenom ?? parsed.data.email.split('@')[0],
        cabinetNom: cabinet?.nom ?? 'Coplio',
        invitationLink: linkData.properties.action_link,
      },
      parsed.data.email
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    captureException(err, { context: 'gestionnaires-inviter' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})
