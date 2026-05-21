import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { rateLimit, getIP, rateLimitResponse } from '@/lib/rate-limit'

// ─── Test 9 : rate-limit ──────────────────────────────────────────────────────
describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('autorise la première requête', async () => {
    const id = `test-${Date.now()}-a`
    const result = await rateLimit(id, { max: 5, windowMs: 60_000 })
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('bloque après avoir dépassé max requêtes', async () => {
    const id = `test-${Date.now()}-b`
    const opts = { max: 3, windowMs: 60_000 }
    await rateLimit(id, opts)
    await rateLimit(id, opts)
    await rateLimit(id, opts)
    const blocked = await rateLimit(id, opts)
    expect(blocked.success).toBe(false)
    expect(blocked.remaining).toBe(0)
  })

  it('réinitialise après la fenêtre', async () => {
    const id = `test-${Date.now()}-c`
    const opts = { max: 1, windowMs: 5_000 }
    const first = await rateLimit(id, opts)
    expect(first.success).toBe(true)
    const blocked = await rateLimit(id, opts)
    expect(blocked.success).toBe(false)

    // Avancer le temps au-delà de la fenêtre
    vi.advanceTimersByTime(6_000)
    const reset = await rateLimit(id, opts)
    expect(reset.success).toBe(true)
  })
})

// ─── Test 10 : getIP + rateLimitResponse ────────────────────────────────────
describe('getIP', () => {
  it('extrait l\'IP depuis x-forwarded-for', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    })
    expect(getIP(req)).toBe('1.2.3.4')
  })

  it('retourne "unknown" si pas d\'header', () => {
    const req = new Request('http://localhost')
    expect(getIP(req)).toBe('unknown')
  })
})

describe('rateLimitResponse', () => {
  it('retourne un status 429', () => {
    const res = rateLimitResponse(Date.now() + 30_000)
    expect(res.status).toBe(429)
  })

  it('contient le header Retry-After', () => {
    const res = rateLimitResponse(Date.now() + 30_000)
    expect(res.headers.get('Retry-After')).toBeTruthy()
  })
})
