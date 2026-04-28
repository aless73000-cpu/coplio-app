import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const appelSchema = z.object({
  copropriete_id: z.string().uuid(),
  lot_id: z.string().uuid(),
  libelle: z.string().min(1),
  montant: z.number().positive(),
  date_appel: z.string(),
  date_echeance: z.string(),
})

const schema = z.object({
  appels: z.array(appelSchema).min(1),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
    }

    const admin = createAdminClient()

    const appelsData = parsed.data.appels.map((appel) => ({
      ...appel,
      montant_paye: 0,
      // paye is a GENERATED ALWAYS AS column (montant_paye >= montant) — do not set
      nb_relances: 0,
    }))

    const { data, error } = await admin
      .from('appels_charges')
      .insert(appelsData)
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data, count: data?.length ?? 0 })
  } catch (err) {
    console.error('appels-charges POST error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
