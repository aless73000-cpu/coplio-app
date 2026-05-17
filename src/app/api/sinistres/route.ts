import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireCabinetUser } from '@/lib/api-handler'

const schema = z.object({
  titre: z.string().min(3),
  description: z.string().optional(),
  copropriete_id: z.string().uuid(),
  status: z.enum(['signale', 'assurance_declaree', 'urgence', 'expertise', 'travaux', 'cloture']).default('signale'),
})

export async function POST(request: Request) {
  try {
    const ctx = await requireCabinetUser()
    if (ctx instanceof NextResponse) return ctx

    const { userId, cabinetId } = ctx
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

    const ref = `SIN-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`

    const admin = createAdminClient()
    const { data, error } = await admin.from('sinistres').insert({
      ...parsed.data,
      cabinet_id: cabinetId,
      reference: ref,
      gestionnaire_id: userId,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Notifier tous les membres du cabinet
    const { data: members } = await admin
      .from('profiles')
      .select('id')
      .eq('cabinet_id', cabinetId)
    if (members) {
      await admin.from('notifications').insert(
        members.map((m: { id: string }) => ({
          user_id: m.id,
          cabinet_id: cabinetId,
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
}
