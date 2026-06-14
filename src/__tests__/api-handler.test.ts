import { describe, it, expect, vi } from 'vitest'
import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/api-handler'

// ─── Test 5 : withErrorHandler ───────────────────────────────────────────────
describe('withErrorHandler', () => {
  it('retourne la réponse du handler si pas d\'erreur', async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }))
    const wrapped = withErrorHandler(handler)
    const res = await wrapped()
    expect(res.status).toBe(200)
  })

  it('attrape les erreurs non gérées et retourne 500', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('DB crash'))
    const wrapped = withErrorHandler(handler)
    const res = await wrapped()
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Erreur serveur inattendue')
  })

  it('attrape les erreurs throws synchrones', async () => {
    const handler = vi.fn().mockImplementation(async () => {
      throw new TypeError('null reference')
    })
    const wrapped = withErrorHandler(handler)
    const res = await wrapped()
    expect(res.status).toBe(500)
  })
})

