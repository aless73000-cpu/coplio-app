import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

async function getCabinetId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single()
  return profile?.cabinet_id ?? null
}

export async function GET(request: Request) {
  const cabinetId = await getCabinetId()
  if (!cabinetId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const coproprieteId = searchParams.get('copropriete_id')
  if (!coproprieteId) return NextResponse.json({ error: 'copropriete_id requis' }, { status: 400 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('relance_parametres')
    .select('*')
    .eq('copropriete_id', coproprieteId)
    .single()

  // Retourner les valeurs par défaut si pas encore configuré
  return NextResponse.json(data ?? {
    copropriete_id: coproprieteId,
    actif: true,
    delai_premier_rappel: 30,
    delai_deuxieme_rappel: 60,
    delai_mise_en_demeure: 90,
    premier_rappel_email: true,
    premier_rappel_sms: false,
    deuxieme_rappel_email: true,
    deuxieme_rappel_sms: false,
  })
}

const schema = z.object({
  copropriete_id: z.string().uuid(),
  actif: z.boolean().optional(),
  delai_premier_rappel: z.number().int().min(1).max(365).optional(),
  delai_deuxieme_rappel: z.number().int().min(1).max(365).optional(),
  delai_mise_en_demeure: z.number().int().min(1).max(365).optional(),
  premier_rappel_email: z.boolean().optional(),
  premier_rappel_sms: z.boolean().optional(),
  deuxieme_rappel_email: z.boolean().optional(),
  deuxieme_rappel_sms: z.boolean().optional(),
  texte_premier_rappel: z.string().optional(),
  texte_deuxieme_rappel: z.string().optional(),
})

export async function POST(request: Request) {
  const cabinetId = await getCabinetId()
  if (!cabinetId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const admin = createAdminClient()
  // Vérifier que la copropriété appartient au cabinet
  const { data: copro } = await admin
    .from('coproprietes')
    .select('id')
    .eq('id', parsed.data.copropriete_id)
    .eq('cabinet_id', cabinetId)
    .single()

  if (!copro) return NextResponse.json({ error: 'Copropriété non trouvée' }, { status: 404 })

  const { data, error } = await admin
    .from('relance_parametres')
    .upsert(parsed.data, { onConflict: 'copropriete_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
