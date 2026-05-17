import { describe, it, expect, vi, beforeEach } from 'vitest'
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

// ─── Test 6 : requireCabinetUser — utilisateur non authentifié ───────────────
describe('requireCabinetUser', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('retourne 401 si pas d\'utilisateur authentifié', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as never)

    const { requireCabinetUser } = await import('@/lib/api-handler')
    const result = await requireCabinetUser()
    expect(result instanceof NextResponse).toBe(true)
    expect((result as NextResponse).status).toBe(401)
  })

  it('retourne 400 si l\'utilisateur n\'a pas de cabinet_id', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { cabinet_id: null } }),
        }),
      }),
    })
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      from: mockFrom,
    } as never)

    const { requireCabinetUser } = await import('@/lib/api-handler')
    const result = await requireCabinetUser()
    expect(result instanceof NextResponse).toBe(true)
    expect((result as NextResponse).status).toBe(400)
  })

  it('retourne le contexte complet si authentifié avec cabinet', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { cabinet_id: 'cab-1' } }),
        }),
      }),
    })
    const mockClient = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      from: mockFrom,
    }
    vi.mocked(createClient).mockResolvedValue(mockClient as never)

    const { requireCabinetUser } = await import('@/lib/api-handler')
    const result = await requireCabinetUser()
    expect(result instanceof NextResponse).toBe(false)
    const ctx = result as Awaited<ReturnType<typeof requireCabinetUser>>
    if (!(ctx instanceof NextResponse)) {
      expect(ctx.userId).toBe('user-1')
      expect(ctx.cabinetId).toBe('cab-1')
    }
  })
})
