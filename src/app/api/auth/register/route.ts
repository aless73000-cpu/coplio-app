import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sendEmail, emailBienvenueSyndic } from '@/lib/resend'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  prenom: z.string().min(2),
  nom: z.string().min(2),
  nomCabinet: z.string().min(2),
})

export async function POST(request: Request) {
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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coplio.fr'
    sendEmail({
      to: email,
      subject: `Bienvenue sur Coplio, ${prenom} !`,
      html: emailBienvenueSyndic({ prenom, nomCabinet, appUrl }),
    }).catch(console.error)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
