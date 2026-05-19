import { NextResponse } from 'next/server'

export async function GET() {
  // Test fetch direct vers GlitchTip (contourne le SDK)
  const DSN = 'https://485d4c2b88b64f28998de65fc967e294@app.glitchtip.com/23645'
  const [key, rest] = DSN.replace('https://', '').split('@')
  const [host, projectId] = rest.split('/')
  const url = `https://${host}/api/${projectId}/store/`

  const payload = {
    message: 'Test direct GlitchTip depuis Coplio ✓',
    level: 'error',
    platform: 'node',
    timestamp: new Date().toISOString(),
  }

  let status = 0
  let body = ''
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7,sentry_key=${key}`,
      },
      body: JSON.stringify(payload),
    })
    status = res.status
    body = await res.text()
  } catch (e) {
    body = String(e)
  }

  return NextResponse.json({ status, body, url })
}
