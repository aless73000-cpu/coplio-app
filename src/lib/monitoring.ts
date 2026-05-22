import * as Sentry from '@sentry/nextjs'

/**
 * Captures an exception and sends it to GlitchTip (Sentry-compatible).
 * Falls back to console.error if the DSN is not configured.
 */
export function captureException(
  err: unknown,
  context?: Record<string, unknown>
): void {
  if (process.env.GLITCHTIP_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(err, context ? { extra: context } : undefined)
  } else {
    console.error('[captureException]', err, context ?? '')
  }
}
