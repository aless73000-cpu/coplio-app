// ═══════════════════════════════════════════════════════════════
// COPLIO — EmailService
// Service centralisé : retry exponentiel, logging structuré,
// déduplication idempotente, redirection dev, validation.
// ═══════════════════════════════════════════════════════════════

import { Resend } from 'resend'
import { EMAIL_CONFIG } from './config'
import type { EmailPayload, SendResult, EmailLog } from './types'
import { captureException } from '@/lib/monitoring'

// ─── Client Resend (lazy) ─────────────────────────────────────

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY
    if (!key || key === 'placeholder') {
      console.warn('[Email] RESEND_API_KEY non définie — emails désactivés')
    }
    _resend = new Resend(key ?? 'placeholder')
  }
  return _resend
}

// ─── Idempotence (in-process, durée de la requête serverless) ─

const _sentKeys = new Set<string>()

// ─── Rate limit in-process ────────────────────────────────────
// Note: ne persiste pas entre invocations Vercel.
// Pour multi-instance, utiliser Upstash Redis.

const _rateLimitMap = new Map<string, number[]>()

function isRateLimited(email: string): boolean {
  const now = Date.now()
  const window = EMAIL_CONFIG.rateLimit.windowMs
  const max = EMAIL_CONFIG.rateLimit.maxPerWindow

  const timestamps = (_rateLimitMap.get(email) ?? []).filter(
    (t) => now - t < window
  )

  if (timestamps.length >= max) return true

  timestamps.push(now)
  _rateLimitMap.set(email, timestamps)
  return false
}

// ─── Validation email ─────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim())
}

function validateRecipients(to: string | string[]): string[] {
  const recipients = Array.isArray(to) ? to : [to]
  const valid = recipients.filter(validateEmail)

  if (valid.length === 0) {
    throw new Error(`Aucun destinataire valide parmi : ${recipients.join(', ')}`)
  }
  if (valid.length < recipients.length) {
    console.warn(
      `[Email] Destinataires invalides ignorés : ${recipients
        .filter((r) => !validateEmail(r))
        .join(', ')}`
    )
  }
  return valid
}

// ─── Logging structuré ────────────────────────────────────────

function logEmail(log: EmailLog) {
  const structured = JSON.stringify({
    level: log.success ? 'info' : 'error',
    service: 'email',
    ...log,
  })
  if (log.success) {
    console.log(structured)
  } else {
    // Erreur structurée dans les logs Vercel + remontée GlitchTip
    console.error(structured)
    captureException(new Error(`Email failed: ${log.error ?? 'unknown'}`), {
      to: Array.isArray(log.to) ? log.to.join(', ') : log.to,
      subject: log.subject,
      attempts: log.attempts,
    })
  }
}

// ─── Erreurs retryable ────────────────────────────────────────

function isRetryable(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    // Erreurs réseau, rate limit, timeout → retry
    if (
      msg.includes('rate limit') ||
      msg.includes('too many') ||
      msg.includes('timeout') ||
      msg.includes('network') ||
      msg.includes('econnreset') ||
      msg.includes('503') ||
      msg.includes('502') ||
      msg.includes('429')
    ) {
      return true
    }
  }
  return false
}

// ─── Sleep helper ─────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ─── EmailService ─────────────────────────────────────────────

export async function sendEmail(payload: EmailPayload): Promise<SendResult> {
  const startTime = Date.now()

  // 1. Idempotence
  if (payload.idempotencyKey && _sentKeys.has(payload.idempotencyKey)) {
    return { success: true, attempts: 0, durationMs: 0 }
  }

  // 2. Validation destinataires
  let recipients: string[]
  try {
    recipients = validateRecipients(payload.to)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logEmail({
      timestamp: new Date().toISOString(),
      to: payload.to,
      subject: payload.subject,
      success: false,
      attempts: 0,
      durationMs: 0,
      error: msg,
    })
    return { success: false, attempts: 0, durationMs: 0, error: { message: msg, retryable: false } }
  }

  // 3. Rate limiting (premier destinataire)
  const primaryRecipient = recipients[0]
  if (isRateLimited(primaryRecipient)) {
    const msg = `Rate limit atteint pour ${primaryRecipient}`
    console.warn(`[Email] ${msg}`)
    return { success: false, attempts: 0, durationMs: 0, error: { message: msg, retryable: true } }
  }

  // 4. Override dev (redirect tous les emails vers une adresse de test)
  const effectiveRecipients =
    EMAIL_CONFIG.isDev && EMAIL_CONFIG.devOverrideEmail
      ? [EMAIL_CONFIG.devOverrideEmail]
      : recipients

  // 5. Headers standard
  const unsubscribeUrl = `${EMAIL_CONFIG.brand.unsubscribeUrl}?email=${encodeURIComponent(primaryRecipient)}`
  const defaultHeaders: Record<string, string> = {
    'List-Unsubscribe': `<${unsubscribeUrl}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    'X-Mailer': 'Coplio/1.0',
    'X-Entity-Ref-ID': payload.idempotencyKey ?? `coplio-${Date.now()}`,
    ...payload.headers,
  }

  // 6. Retry avec backoff exponentiel
  const { maxAttempts, delays } = EMAIL_CONFIG.retry
  let lastError: unknown
  let emailId: string | undefined

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const resend = getResend()
      const result = await resend.emails.send({
        from: payload.from ?? EMAIL_CONFIG.from.default,
        to: effectiveRecipients,
        subject: EMAIL_CONFIG.isDev
          ? `[DEV] ${payload.subject}`
          : payload.subject,
        html: payload.html,
        text: payload.text,
        reply_to: payload.replyTo,
        tags: payload.tags,
        headers: defaultHeaders,
      })

      if (result.error) {
        throw new Error(result.error.message ?? 'Resend API error')
      }

      emailId = result.data?.id

      // Succès
      if (payload.idempotencyKey) _sentKeys.add(payload.idempotencyKey)

      const durationMs = Date.now() - startTime
      logEmail({
        timestamp: new Date().toISOString(),
        emailId,
        to: effectiveRecipients,
        subject: payload.subject,
        success: true,
        attempts: attempt,
        durationMs,
        tags: payload.tags,
        idempotencyKey: payload.idempotencyKey,
      })

      return { success: true, emailId, attempts: attempt, durationMs }
    } catch (err) {
      lastError = err
      const retryable = isRetryable(err)

      if (attempt < maxAttempts && retryable) {
        const delay = delays[attempt - 1] ?? 2000
        await sleep(delay)
      } else {
        // Erreur définitive ou non-retryable
        break
      }
    }
  }

  // Échec définitif
  const errorMsg = lastError instanceof Error ? lastError.message : String(lastError)
  const durationMs = Date.now() - startTime

  logEmail({
    timestamp: new Date().toISOString(),
    to: effectiveRecipients,
    subject: payload.subject,
    success: false,
    attempts: maxAttempts,
    durationMs,
    error: errorMsg,
    idempotencyKey: payload.idempotencyKey,
  })

  return {
    success: false,
    attempts: maxAttempts,
    durationMs,
    error: { message: errorMsg, retryable: isRetryable(lastError) },
  }
}

/**
 * Envoie plusieurs emails en série avec délai entre chaque.
 * Resend supporte le batch mais son API batch ne garantit pas
 * l'ordre ni les retry individuels. On préfère le séquentiel
 * contrôlé pour les convocations AG par exemple.
 *
 * @param payloads Liste des emails à envoyer
 * @param delayBetweenMs Délai entre chaque envoi (défaut 100ms — évite le rate limit)
 */
export async function sendEmailBatch(
  payloads: EmailPayload[],
  delayBetweenMs = 100
): Promise<{ sent: number; failed: number; results: SendResult[] }> {
  const results: SendResult[] = []
  let sent = 0
  let failed = 0

  for (const payload of payloads) {
    const result = await sendEmail(payload)
    results.push(result)
    if (result.success) sent++
    else failed++

    // Petit délai pour respecter le rate limit Resend
    if (delayBetweenMs > 0) await sleep(delayBetweenMs)
  }

  return { sent, failed, results }
}
