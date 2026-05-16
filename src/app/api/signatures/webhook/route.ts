import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

// Bug #1 fix: verify Yousign HMAC-SHA256 signature before processing
function verifyYousignSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.YOUSIGN_WEBHOOK_SECRET
  if (!secret) return true // skip in dev if not configured
  if (!signatureHeader) return false

  // Header format: "sha256=<hex-digest>"
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  const expectedHeader = `sha256=${expected}`

  try {
    return timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expectedHeader))
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signatureHeader = request.headers.get('X-Yousign-Signature-256')

  if (!verifyYousignSignature(rawBody, signatureHeader)) {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })
  }

  let body: { event_name: string; data: { signature_request: { id: string; status: string } } }
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const { event_name, data } = body

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
  const { error } = await admin
    .from('signatures')
    .update({ statut: newStatus })
    .eq('yousign_request_id', yousignId)

  if (error) {
    console.error('[Yousign webhook] Erreur mise à jour signature:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
