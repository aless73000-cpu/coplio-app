import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN ?? 'https://485d4c2b88b64f28998de65fc967e294@app.glitchtip.com/23645',

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Ignorer les erreurs non-actionables côté serveur
  ignoreErrors: [
    'NEXT_NOT_FOUND',
    'NEXT_REDIRECT',
  ],

  enabled: process.env.NODE_ENV === 'production',
})
