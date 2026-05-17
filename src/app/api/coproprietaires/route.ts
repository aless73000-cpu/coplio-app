import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireCabinetUser } from '@/lib/api-handler'

export async function GET() {
  const ctx = await requireCabinetUser()
  if (ctx instanceof NextResponse) return ctx

  const { cabinetId } = ctx
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('coproprietaires')
    .select('id, prenom, nom, email')
    .eq('cabinet_id', cabinetId)
    .order('nom')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

const schema = z.object({
  prenom: z.string().min(1),
  nom: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  telephone: z.string().optional(),
  adresse_correspondance: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const ctx = await requireCabinetUser()
    if (ctx instanceof NextResponse) return ctx

    const { cabinetId } = ctx
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

    const { email, ...rest } = parsed.data
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('coproprietaires')
      .insert({
        ...rest,
        ...(email ? { email } : {}),
        cabinet_id: cabinetId,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
