import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  conversation_id: z.string().uuid(),
  message_preview: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

    const admin = createAdminClient()

    // Récupérer la conversation + copropriétaire
    const { data: conv } = await admin
      .from('conversations')
      .select('coproprietaire_id, cabinet_id')
      .eq('id', parsed.data.conversation_id)
      .single()

    if (!conv?.coproprietaire_id) return NextResponse.json({ ok: true })

    // Récupérer le profil du syndic qui envoie
    const { data: sender } = await admin
      .from('profiles')
      .select('prenom, nom')
      .eq('id', user.id)
      .single()

    const senderNom = sender ? `${sender.prenom} ${sender.nom}` : 'Votre syndic'

    await admin.from('notifications').insert({
      user_id: conv.coproprietaire_id,
      type: 'info',
      titre: `Nouveau message de ${senderNom}`,
      message: parsed.data.message_preview
        ? parsed.data.message_preview.slice(0, 100)
        : null,
      lu: false,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
