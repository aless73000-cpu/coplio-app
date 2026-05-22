import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { withErrorHandler } from '@/lib/api-handler'
import { captureException } from '@/lib/monitoring'

function verifyDocusealSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.DOCUSEAL_WEBHOOK_SECRET
  if (!secret) return process.env.NODE_ENV === 'development'
  if (!signatureHeader) return false

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected))
  } catch {
    return false
  }
}

export const POST = withErrorHandler(async (request: Request) => {
  const rawBody = await request.text()
  const signatureHeader = request.headers.get('X-Docuseal-Signature')

  if (!verifyDocusealSignature(rawBody, signatureHeader)) {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })
  }

  let body: {
    event_type: string
    data: {
      submission_id?: number
      submission?: { id: number; status: string }
    }
  }
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const { event_type, data } = body

  const statusMap: Record<string, string> = {
    'submission.completed': 'signe',
    'submission.expired': 'expire',
    'submission.declined': 'refuse',
    'submission.archived': 'annule',
  }

  const newStatus = statusMap[event_type]
  if (!newStatus) return NextResponse.json({ ok: true })

  const submissionId = data?.submission?.id ?? data?.submission_id
  if (!submissionId) return NextResponse.json({ ok: true })

  const admin = createAdminClient()
  const { error } = await admin
    .from('signatures')
    .update({ statut: newStatus })
    .eq('yousign_request_id', String(submissionId))

  if (error) {
    captureException(error, { context: 'docuseal-webhook' })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
})
