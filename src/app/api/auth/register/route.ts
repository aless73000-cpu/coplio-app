import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Email } from '@/lib/email'
import { rateLimit, getIP, rateLimitResponse } from '@/lib/rate-limit'
import { withErrorHandler } from '@/lib/api-handler'
import { captureException } from '@/lib/monitoring'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  prenom: z.string().min(2),
  nom: z.string().min(2),
  nomCabinet: z.string().min(2),
})

export const POST = withErrorHandler(async (request: Request) => {
  // 5 inscriptions max par IP par heure
  const ip = getIP(request)
  const limit = await rateLimit(`register:${ip}`, { max: 5, windowMs: 60 * 60 * 1000 })
  if (!limit.success) return rateLimitResponse(limit.resetAt)

  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    const { email, password, prenom, nom, nomCabinet } = parsed.data
    const supabase = createAdminClient()

    // 1. Générer le lien de confirmation et créer l'utilisateur en une seule opération.
    //    generateLink crée le compte SANS le confirmer (email_confirm implicitement false)
    //    et retourne un action_link à envoyer au propriétaire.
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: {
        data: { prenom, nom, nom_cabinet: nomCabinet, role: 'owner' },
      },
    })

    if (linkError) {
      if (
        linkError.message.includes('already registered') ||
        linkError.message.includes('already been registered') ||
        linkError.message.includes('already exists')
      ) {
        return NextResponse.json({ error: 'Cet email est déjà utilisé.' }, { status: 409 })
      }
      return NextResponse.json({ error: linkError.message }, { status: 400 })
    }

    const userId = linkData.user.id
    const confirmUrl = linkData.properties.action_link

    // 2. Créer le profil
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: userId, email, role: 'owner', prenom, nom })

    if (profileError) {
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: 'Erreur lors de la création du profil.' }, { status: 500 })
    }

    // 3. Email de bienvenue avec lien de confirmation (non bloquant)
    //    Le CTA de l'email pointe vers confirmUrl pour valider l'adresse email.
    Email.welcomeSyndic({ prenom, nomCabinet, confirmUrl }, email).catch(err => captureException(err, { context: 'register welcome email' }))

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
})