// ─── Variables obligatoires selon l'environnement ────────────
//
// Note MAINT-04 — Crons Vercel :
//   relances-impayes : maxDuration=120s → requiert le plan Vercel Pro (max 300s).
//   trial-ending     : maxDuration=60s  → compatible Pro. Sur Hobby (max 10s) les deux timeout.
//   Vérifier le plan Vercel avant la mise en production.

// Production : toutes ces variables sont requises.
// Développement : on log un warning sans bloquer le démarrage.
const REQUIRED_PROD: string[] = [
  'CRON_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'GLITCHTIP_DSN',
  'RESEND_API_KEY',
  'GEMINI_API_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_FROM_NUMBER',
]

// En dev, ces variables sont utiles mais optionnelles (fallbacks en place).
// On avertit si elles manquent pour ne pas avoir de surprises en prod.
const RECOMMENDED_DEV: string[] = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'RESEND_API_KEY',
]

export async function register() {
  const isProd = process.env.NODE_ENV === 'production'
  const isDev = process.env.NODE_ENV === 'development'

  // ── Production : vérification stricte ─────────────────────
  if (isProd) {
    const missing = REQUIRED_PROD.filter(k => !process.env[k])

    if (missing.length > 0) {
      const msg = `[Coplio] ⚠️ Variables d'environnement manquantes en production : ${missing.join(', ')}`
      console.error(msg)

      if (process.env.GLITCHTIP_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
        const { captureMessage } = await import('@sentry/nextjs')
        captureMessage(msg, 'warning')
      }
    }
  }

  // ── Développement : avertissement souple ─────────────────
  if (isDev) {
    const missingInDev = RECOMMENDED_DEV.filter(k => !process.env[k])

    if (missingInDev.length > 0) {
      console.warn(
        `[Coplio] ⚠️  Dev — variables recommandées manquantes : ${missingInDev.join(', ')}\n` +
        `         Certaines fonctionnalités (Stripe, emails) ne fonctionneront pas.\n` +
        `         Copiez .env.example → .env.local et renseignez ces valeurs.`
      )
    }
  }
}
