import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Email } from '@/lib/email'
import { rateLimit, getIP, rateLimitResponse } from '@/lib/rate-limit'
import { captureException } from '@/lib/monitoring'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  prenom: z.string().min(2),
  nom: z.string().min(2),
  nomCabinet: z.string().min(2),
})

export async function POST(request: Request) {
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

    // 1. Créer l'utilisateur
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { prenom, nom, nom_cabinet: nomCabinet, role: 'owner' },
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        return NextResponse.json({ error: 'Cet email est déjà utilisé.' }, { status: 409 })
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user.id

    // 2. Créer le profil
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: userId, email, role: 'owner', prenom, nom })

    if (profileError) {
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: 'Erreur lors de la création du profil.' }, { status: 500 })
    }

    // 3. Email de bienvenue (non bloquant)
    Email.welcomeSyndic({ prenom, nomCabinet }, email).catch((e) => captureException(e, { context: 'register-welcome-email' }))

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
