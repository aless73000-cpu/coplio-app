import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  titre: z.string().min(3),
  description: z.string().optional(),
  copropriete_id: z.string().uuid(),
  status: z.enum(['signale', 'assurance_declaree', 'urgence', 'expertise', 'travaux', 'cloture']).default('signale'),
})

export async function POST(request: Request) {
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
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
