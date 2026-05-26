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

/**
 * Captures a message (non-exception) with a given severity level.
 * Centralises all GlitchTip/Sentry calls through this module.
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: Record<string, unknown>
): void {
  if (process.env.GLITCHTIP_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureMessage(message, { level, extra: context })
  } else {
    console.warn('[captureMessage]', level, message, context ?? '')
  }
}
