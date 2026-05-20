import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireCabinetUser } from '@/lib/api-handler'
import { captureException } from '@/lib/monitoring'

export async function GET() {
  try {
    const ctx = await requireCabinetUser()
    if (ctx instanceof NextResponse) return ctx

    const { cabinetId } = ctx
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('prestataires')
      .select('*')
      .eq('cabinet_id', cabinetId)
      .eq('actif', true)
      .order('nom')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (err) {
    captureException(err, { context: 'prestataires-get' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const schema = z.object({
  nom: z.string().min(1).max(255),
  metier: z.string().max(100).optional(),
  telephone: z.string().max(30).optional(),
  email: z.string().email().optional().or(z.literal('')),
  adresse: z.string().optional(),
  siret: z.string().max(20).optional(),
  note: z.number().int().min(1).max(5).optional(),
  commentaire: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const ctx = await requireCabinetUser()
    if (ctx instanceof NextResponse) return ctx

    const { cabinetId } = ctx
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('prestataires')
      .insert({ ...parsed.data, cabinet_id: cabinetId })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    captureException(err, { context: 'prestataires-post' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
