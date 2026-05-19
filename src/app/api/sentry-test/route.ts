import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'

export async function GET() {
  const nodeEnv = process.env.NODE_ENV
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN

  // Force l'envoi même si enabled=false
  Sentry.init({
    dsn: 'https://485d4c2b88b64f28998de65fc967e294@app.glitchtip.com/23645',
    enabled: true,
  })

  Sentry.captureMessage('Test GlitchTip depuis Coplio ✓')
  const flushed = await Sentry.flush(8000)

  return NextResponse.json({ flushed, nodeEnv, dsn_present: !!dsn })
}
