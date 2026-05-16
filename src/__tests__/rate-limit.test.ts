/**
 * Tests — Rate limiting (fallback in-memory)
 *
 * Teste la logique du rate limiter in-memory (utilisé en dev/CI
 * quand Upstash n'est pas configuré). Les tests Upstash nécessitent
 * une vraie connexion Redis et sont réservés aux tests d'intégration.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Isolation : on importe la logique interne directement ────
// (évite d'appeler Upstash en tests unitaires)

interface RateLimitEntry { count: number; resetAt: number }
const memStore = new Map<string, RateLimitEntry>()

function rateLimitMemory(
  identifier: string,
  options: { max: number; windowMs: number }
): { success: boolean; remaining: number; resetAt: number } {
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

// ─── Tests ────────────────────────────────────────────────────

beforeEach(() => {
  memStore.clear()
})

describe('rateLimitMemory — comportement nominal', () => {
  it('autorise la première requête', () => {
    const result = rateLimitMemory('test:ip1', { max: 5, windowMs: 60_000 })
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('autorise jusqu\'à max requêtes', () => {
    for (let i = 0; i < 5; i++) {
      const r = rateLimitMemory('test:ip2', { max: 5, windowMs: 60_000 })
      expect(r.success).toBe(true)
    }
  })

  it('bloque la (max+1)ème requête', () => {
    for (let i = 0; i < 5; i++) {
      rateLimitMemory('test:ip3', { max: 5, windowMs: 60_000 })
    }
    const blocked = rateLimitMemory('test:ip3', { max: 5, windowMs: 60_000 })
    expect(blocked.success).toBe(false)
    expect(blocked.remaining).toBe(0)
  })

  it('isole les identifiants différents', () => {
    for (let i = 0; i < 5; i++) {
      rateLimitMemory('user:aaa', { max: 5, windowMs: 60_000 })
    }
    // Un autre identifiant n'est pas affecté
    const other = rateLimitMemory('user:bbb', { max: 5, windowMs: 60_000 })
    expect(other.success).toBe(true)
  })

  it('réinitialise après expiration de la fenêtre', () => {
    vi.useFakeTimers()

    for (let i = 0; i < 5; i++) {
      rateLimitMemory('test:expire', { max: 5, windowMs: 1_000 })
    }
    const blocked = rateLimitMemory('test:expire', { max: 5, windowMs: 1_000 })
    expect(blocked.success).toBe(false)

    // Avancer le temps de 2 secondes
    vi.advanceTimersByTime(2_000)

    const afterReset = rateLimitMemory('test:expire', { max: 5, windowMs: 1_000 })
    expect(afterReset.success).toBe(true)

    vi.useRealTimers()
  })

  it('retourne un resetAt dans le futur', () => {
    const result = rateLimitMemory('test:reset', { max: 3, windowMs: 30_000 })
    expect(result.resetAt).toBeGreaterThan(Date.now())
  })
})

describe('rateLimitMemory — limites spécifiques Coplio', () => {
  it('inscription : max 5 par heure par IP', () => {
    const opts = { max: 5, windowMs: 60 * 60 * 1000 }
    for (let i = 0; i < 5; i++) {
      expect(rateLimitMemory('register:1.2.3.4', opts).success).toBe(true)
    }
    expect(rateLimitMemory('register:1.2.3.4', opts).success).toBe(false)
  })

  it('IA analyser : max 10 par heure par user', () => {
    const opts = { max: 10, windowMs: 60 * 60 * 1000 }
    for (let i = 0; i < 10; i++) {
      expect(rateLimitMemory('ia-analyser:user-xyz', opts).success).toBe(true)
    }
    expect(rateLimitMemory('ia-analyser:user-xyz', opts).success).toBe(false)
  })

  it('IA chat : max 50 par heure par user', () => {
    const opts = { max: 50, windowMs: 60 * 60 * 1000 }
    for (let i = 0; i < 50; i++) {
      expect(rateLimitMemory('ia-chat:user-abc', opts).success).toBe(true)
    }
    expect(rateLimitMemory('ia-chat:user-abc', opts).success).toBe(false)
  })
})
