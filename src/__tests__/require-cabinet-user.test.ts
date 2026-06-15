/**
 * Tests — requireCabinetUser() (isolation multi-tenant)
 *
 * Helper introduit lors de l'audit sécurité : résout auth + cabinet_id.
 * Non-régression : garantit 401 si non authentifié, 400 si aucun cabinet,
 * et le bon { userId, cabinetId } sinon.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import { requireCabinetUser } from '@/lib/api-handler'
import { createClient } from '@/lib/supabase/server'

const mockedCreateClient = vi.mocked(createClient)

/** Construit un faux client Supabase avec la chaîne profiles.select().eq().single(). */
function buildClient(opts: { user: { id: string } | null; profile: { cabinet_id: string } | null }) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: opts.user } }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: opts.profile }),
        })),
      })),
    })),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('requireCabinetUser', () => {
  it('renvoie 401 si aucun utilisateur authentifié', async () => {
    mockedCreateClient.mockResolvedValue(buildClient({ user: null, profile: null }) as never)
    const res = await requireCabinetUser()
    expect(res).toBeInstanceOf(NextResponse)
    expect((res as NextResponse).status).toBe(401)
  })

  it('renvoie 400 si l\'utilisateur n\'est rattaché à aucun cabinet', async () => {
    mockedCreateClient.mockResolvedValue(buildClient({ user: { id: 'u1' }, profile: null }) as never)
    const res = await requireCabinetUser()
    expect(res).toBeInstanceOf(NextResponse)
    expect((res as NextResponse).status).toBe(400)
  })

  it('renvoie 400 si le profil existe mais sans cabinet_id', async () => {
    mockedCreateClient.mockResolvedValue(buildClient({ user: { id: 'u1' }, profile: { cabinet_id: '' } }) as never)
    const res = await requireCabinetUser()
    expect((res as NextResponse).status).toBe(400)
  })

  it('renvoie { userId, cabinetId, supabase } si tout est valide', async () => {
    mockedCreateClient.mockResolvedValue(
      buildClient({ user: { id: 'user-1' }, profile: { cabinet_id: 'cab-1' } }) as never,
    )
    const res = await requireCabinetUser()
    expect(res).not.toBeInstanceOf(NextResponse)
    if (res instanceof NextResponse) throw new Error('attendu : objet auth')
    expect(res.userId).toBe('user-1')
    expect(res.cabinetId).toBe('cab-1')
    expect(res.supabase).toBeDefined()
  })
})
