import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'

export async function GET() {
  const err = new Error('Test GlitchTip — si tu vois ça, le monitoring fonctionne ✓')
  Sentry.captureException(err)
  await Sentry.flush(2000)
  return NextResponse.json({ sent: true })
}
