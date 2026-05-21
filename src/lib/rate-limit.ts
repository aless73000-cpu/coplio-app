/**
 * Rate limiter hybride.
 *
 * - Si UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN sont définis :
 *   utilise @upstash/ratelimit (sliding window, persisté entre cold starts).
 * - Sinon : fallback in-memory (dev local ou environnements sans Redis).
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ─── Upstash Redis (lazy init) ────────────────────────────────

let _redis: Redis | null = null
function getRedis(): Redis | null {
  if (_redis) return _redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  _redis = new Redis({ url, token })
  return _redis
}

// Cache des limiters Upstash par clé de config (max:window)
const _limiters = new Map<string, Ratelimit>()

function getUpstashLimiter(max: number, windowMs: number): Ratelimit | null {
  const redis = getRedis()
  if (!redis) return null
  const cacheKey = `${max}:${windowMs}`
  if (_limiters.has(cacheKey)) return _limiters.get(cacheKey)!
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, `${windowMs}ms`),
    analytics: false,
  })
  _limiters.set(cacheKey, limiter)
  return limiter
}

// ─── Fallback in-memory ───────────────────────────────────────

interface RateLimitEntry { count: number; resetAt: number }
const store = new Map<string, RateLimitEntry>()

function inMemoryRateLimit(
  identifier: string,
  max: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const existing = store.get(identifier)

  if (!existing || existing.resetAt < now) {
    const entry: RateLimitEntry = { count: 1, resetAt: now + windowMs }
    store.set(identifier, entry)
    return { success: true, remaining: max - 1, resetAt: entry.resetAt }
  }

  if (existing.count >= max) {
    return { success: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count++
  return { success: true, remaining: max - existing.count, resetAt: existing.resetAt }
}

// ─── Interface publique ───────────────────────────────────────

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

export async function rateLimit(
  identifier: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const limiter = getUpstashLimiter(options.max, options.windowMs)

  if (limiter) {
    const result = await limiter.limit(identifier)
    return {
      success: result.success,
      remaining: result.remaining,
      resetAt: result.reset,
    }
  }

  // Fallback synchrone wrappé en Promise
  return inMemoryRateLimit(identifier, options.max, options.windowMs)
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
