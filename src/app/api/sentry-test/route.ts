import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'

export async function GET() {
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN
  const err = new Error('Test GlitchTip — si tu vois ça, le monitoring fonctionne ✓')
  Sentry.captureException(err)
  const flushed = await Sentry.flush(5000)
  return NextResponse.json({ sent: true, flushed, dsn_present: !!dsn })
}
