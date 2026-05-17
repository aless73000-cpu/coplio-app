export async function register() {
  if (process.env.NODE_ENV !== 'production') return

  const missing: string[] = []

  if (!process.env.CRON_SECRET) missing.push('CRON_SECRET')
  if (!process.env.STRIPE_SECRET_KEY) missing.push('STRIPE_SECRET_KEY')
  if (!process.env.STRIPE_WEBHOOK_SECRET) missing.push('STRIPE_WEBHOOK_SECRET')
  if (!process.env.UPSTASH_REDIS_REST_URL) missing.push('UPSTASH_REDIS_REST_URL')
  if (!process.env.UPSTASH_REDIS_REST_TOKEN) missing.push('UPSTASH_REDIS_REST_TOKEN')

  if (missing.length > 0) {
    const msg = `[Coplio] ⚠️ Variables d'environnement manquantes en production : ${missing.join(', ')}`
    console.error(msg)

    // Remonter dans Sentry si configuré
    if (process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN) {
      const { captureMessage } = await import('@sentry/nextjs')
      captureMessage(msg, 'warning')
    }
  }
}
