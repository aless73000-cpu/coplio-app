import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? 'https://485d4c2b88b64f28998de65fc967e294@app.glitchtip.com/23645',

  // Capture 10% des transactions en prod, 100% en dev
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Capture 100% des replays en cas d'erreur, 5% sinon
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.05,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Ignorer les erreurs non-actionables
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    'Non-Error promise rejection captured',
    /^Network Error$/,
    /^Loading chunk \d+ failed/,
  ],

  enabled: process.env.NODE_ENV === 'production',
})
