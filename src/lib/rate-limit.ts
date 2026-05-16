/**
 * Rate limiter — dual mode
 *
 * Production (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN définis) :
 *   → Upstash Redis avec sliding window. Fonctionne sur toutes les instances
 *     Vercel simultanément. Limite réelle et persistante.
 *
 * Développement / fallback (env vars absentes) :
 *   → Map in-memory. Reset à chaque cold start. Suffisant pour le dev local.
 *     ⚠️ NE PAS utiliser seul en production.
 */

import { NextResponse } from 'next/server'

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Upstash (production) ─────────────────────────────────────────────────────

let _upstashAvailable: boolean | null = null

function isUpstashConfigured(): boolean {
  if (_upstashAvailable === null) {
    _upstashAvailable = !!(
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
    )
  }
  return _upstashAvailable
}

async function rateLimitUpstash(
  identifier: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { Ratelimit } = await import('@upstash/ratelimit')
  const { Redis } = await import('@upstash/redis')

  const redis = Redis.fromEnv()
  const windowSec = Math.ceil(options.windowMs / 1000)

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(options.max, `${windowSec} s`),
    // Préfixe pour isoler les clés Coplio dans le namespace Redis
    prefix: 'coplio:rl',
  })

  const { success, remaining, reset } = await limiter.limit(identifier)

  return {
    success,
    remaining,
    resetAt: reset,
  }
}

// ─── Fallback in-memory (dev / CI) ───────────────────────────────────────────

interface RateLimitEntry {
  count: number
  resetAt: number
}

const memStore = new Map<string, RateLimitEntry>()

// Nettoyage toutes les 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    memStore.forEach((entry, key) => {
      if (entry.resetAt < now) memStore.delete(key)
    })
  }, 5 * 60 * 1000)
}

function rateLimitMemory(identifier: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  const existing = memStore.get(identifier)

  if (!existing || existing.resetAt < now) {
    const entry: RateLimitEntry = { count: 1, resetAt: now + options.windowMs }
    memStore.set(identifier, entry)
    return { success: true, remaining: options.max - 1, resetAt: entry.resetAt }
  }

  if (existing.count >= options.max) {
    return { success: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count++
  return { success: true, remaining: options.max - existing.count, resetAt: existing.resetAt }
}

// ─── API publique ─────────────────────────────────────────────────────────────

/**
 * Vérifie la limite de taux pour un identifiant donné.
 *
 * @example
 * const limit = await rateLimit(`register:${ip}`, { max: 5, windowMs: 60 * 60 * 1000 })
 * if (!limit.success) return rateLimitResponse(limit.resetAt)
 */
export async function rateLimit(
  identifier: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  if (isUpstashConfigured()) {
    return rateLimitUpstash(identifier, options)
  }
  return rateLimitMemory(identifier, options)
}

/** Extrait l'IP depuis les headers Next.js / Vercel */
export function getIP(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

/** Réponse 429 standard avec headers Retry-After */
export function rateLimitResponse(resetAt: number): NextResponse {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000)
  return NextResponse.json(
    { error: 'Trop de requêtes. Réessayez dans quelques instants.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Reset': String(resetAt),
      },
    }
  )
}
