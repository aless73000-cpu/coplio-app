import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api-handler'

const schema = z.object({
  titre: z.string().min(3),
  description: z.string().optional(),
  copropriete_id: z.string().uuid(),
  status: z.enum(['signale', 'assurance_declaree', 'urgence', 'expertise', 'travaux', 'cloture']).default('signale'),
})

export const POST = withErrorHandler(async (request: Request) => {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single()
    if (!profile?.cabinet_id) return NextResponse.json({ error: 'Cabinet non trouvé' }, { status: 400 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

    // Générer une référence unique
    const ref = `SIN-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`

    const admin = createAdminClient()
    const { data, error } = await admin.from('sinistres').insert({
      ...parsed.data,
      cabinet_id: profile.cabinet_id,
      reference: ref,
      gestionnaire_id: user.id,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Notifier tous les membres du cabinet
    const { data: members } = await admin
      .from('profiles')
      .select('id')
      .eq('cabinet_id', profile.cabinet_id)
    if (members) {
      await admin.from('notifications').insert(
        members.map((m: { id: string }) => ({
          user_id: m.id,
          cabinet_id: profile.cabinet_id,
          type: 'urgent',
          titre: `Nouveau sinistre : ${parsed.data.titre}`,
          message: parsed.data.description ?? null,
          lien: `/sinistres/${data.id}`,
          sinistre_id: data.id,
          lu: false,
        }))
      )
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})
