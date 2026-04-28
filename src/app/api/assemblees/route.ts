import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  copropriete_id: z.string().uuid(),
  titre: z.string().min(3),
  type: z.enum(['ordinaire', 'extraordinaire']),
  date_ag: z.string(),
  lieu: z.string().optional(),
  ordre_du_jour: z.string().optional(), // stored in notes, not in DB column
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

    const admin = createAdminClient()
    // ordre_du_jour not in DB schema yet — exclude from insert
    const { ordre_du_jour: _odj, ...insertData } = parsed.data
    const { data, error } = await admin.from('assemblees_generales').insert({
      ...insertData,
      cabinet_id: profile.cabinet_id,
      status: 'planifiee',
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
