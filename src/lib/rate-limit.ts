/**
 * Rate limiter in-memory simple.
 * Fonctionne par IP. Reset à chaque cold start serverless.
 * Suffisant pour bloquer les abus basiques sans infrastructure externe.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Nettoyage toutes les 5 minutes pour éviter les fuites mémoire
setInterval(() => {
  const now = Date.now()
  store.forEach((entry, key) => {
    if (entry.resetAt < now) store.delete(key)
  })
}, 5 * 60 * 1000)

interface RateLimitOptions {
  /** Nombre max de requêtes dans la fenêtre */
  max: number
  /** Durée de la fenêtre en millisecondes */
  windowMs: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

export function rateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now()
  const key = identifier
  const existing = store.get(key)

  // Fenêtre expirée ou première requête
  if (!existing || existing.resetAt < now) {
    const entry: RateLimitEntry = {
      count: 1,
      resetAt: now + options.windowMs,
    }
    store.set(key, entry)
    return { success: true, remaining: options.max - 1, resetAt: entry.resetAt }
  }

  // Fenêtre active
  if (existing.count >= options.max) {
    return { success: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count++
  return {
    success: true,
    remaining: options.max - existing.count,
    resetAt: existing.resetAt,
  }
}

/** Extrait l'IP depuis les headers Next.js */
export function getIP(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

/** Réponse 429 standard */
export function rateLimitResponse(resetAt: number): Response {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000)
  return new Response(
    JSON.stringify({ error: 'Trop de requêtes. Réessayez dans quelques instants.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        'X-RateLimit-Reset': String(resetAt),
      },
    }
  )
}
