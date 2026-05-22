export async function register() {
  if (process.env.NODE_ENV !== 'production') return

  const missing: string[] = []

  if (!process.env.CRON_SECRET) missing.push('CRON_SECRET')
  if (!process.env.STRIPE_SECRET_KEY) missing.push('STRIPE_SECRET_KEY')
  if (!process.env.STRIPE_WEBHOOK_SECRET) missing.push('STRIPE_WEBHOOK_SECRET')
  if (!process.env.UPSTASH_REDIS_REST_URL) missing.push('UPSTASH_REDIS_REST_URL')
  if (!process.env.UPSTASH_REDIS_REST_TOKEN) missing.push('UPSTASH_REDIS_REST_TOKEN')
  if (!process.env.GLITCHTIP_DSN) missing.push('GLITCHTIP_DSN')
  if (!process.env.RESEND_API_KEY) missing.push('RESEND_API_KEY')
  if (!process.env.GEMINI_API_KEY) missing.push('GEMINI_API_KEY')
  if (!process.env.TWILIO_ACCOUNT_SID) missing.push('TWILIO_ACCOUNT_SID')
  if (!process.env.TWILIO_AUTH_TOKEN) missing.push('TWILIO_AUTH_TOKEN')
  if (!process.env.TWILIO_FROM_NUMBER) missing.push('TWILIO_FROM_NUMBER')

  if (missing.length > 0) {
    const msg = `[Coplio] ⚠️ Variables d'environnement manquantes en production : ${missing.join(', ')}`
    console.error(msg)

    if (process.env.GLITCHTIP_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
      const { captureMessage } = await import('@sentry/nextjs')
      captureMessage(msg, 'warning')
    }
  }
}
