import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const lotSchema = z.object({
  numero: z.string().min(1),
  type: z.enum(['appartement', 'maison', 'local_commercial', 'parking', 'cave', 'autre']),
  etage: z.string().optional(),
  surface: z.number().optional(),
  tantiemes: z.number().min(1),
})

const schema = z.object({
  copropriete_id: z.string().uuid(),
  lots: z.array(lotSchema).min(1).max(500),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('cabinet_id')
      .eq('id', user.id)
      .single()
    if (!profile?.cabinet_id) return NextResponse.json({ error: 'Cabinet non trouvé' }, { status: 400 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
    }

    const { copropriete_id, lots } = parsed.data
    const admin = createAdminClient()

    // Verify copropriete belongs to this cabinet
    const { data: copropriete } = await admin
      .from('coproprietes')
      .select('id')
      .eq('id', copropriete_id)
      .eq('cabinet_id', profile.cabinet_id)
      .single()
    if (!copropriete) return NextResponse.json({ error: 'Copropriété introuvable' }, { status: 404 })

    // Check for existing duplicates
    const { data: existing } = await admin
      .from('lots')
      .select('numero')
      .eq('copropriete_id', copropriete_id)
      .in('numero', lots.map((l) => l.numero))

    const existingNums = new Set((existing ?? []).map((l: { numero: string }) => l.numero.toLowerCase()))
    const toInsert = lots
      .filter((l) => !existingNums.has(l.numero.toLowerCase()))
      .map((l) => ({ copropriete_id, ...l }))

    const skippedCount = lots.length - toInsert.length

    if (toInsert.length === 0) {
      return NextResponse.json({
        lots_created: 0,
        errors: [`Tous les lots existent déjà dans cette copropriété.`],
      })
    }

    const { data: inserted, error } = await admin
      .from('lots')
      .insert(toInsert)
      .select('id')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const errors = skippedCount > 0
      ? [`${skippedCount} lot(s) ignoré(s) car déjà existants.`]
      : []

    return NextResponse.json({ lots_created: inserted?.length ?? 0, errors })
  } catch (err) {
    console.error('Génération lots error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
