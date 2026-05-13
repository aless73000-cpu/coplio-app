import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()

  const { event_name, data } = body as {
    event_name: string
    data: { signature_request: { id: string; status: string } }
  }

  const yousignId = data?.signature_request?.id
  if (!yousignId) return NextResponse.json({ ok: true })

  const statusMap: Record<string, string> = {
    'signature_request.done': 'signe',
    'signature_request.expired': 'expire',
    'signature_request.declined': 'refuse',
    'signature_request.cancelled': 'annule',
  }

  const newStatus = statusMap[event_name]
  if (!newStatus) return NextResponse.json({ ok: true })

  const admin = createAdminClient()
  await admin
    .from('signatures')
    .update({ statut: newStatus })
    .eq('yousign_request_id', yousignId)

  return NextResponse.json({ ok: true })
}
