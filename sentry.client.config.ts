import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring — 10% des transactions en prod, 100% en dev
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session replay — 10% des sessions, 100% si erreur
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Désactivé en dev sans DSN
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  debug: false,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: false,
    }),
  ],
})
