/**
 * Tests d'intégration — POST /api/sinistres/[id]/status
 *
 * Vérifie la validation du statut + l'isolation tenant (on ne peut changer
 * le statut que d'un sinistre de SON cabinet).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { mockSupabase } from './helpers/supabase-mock'
import { POST } from '@/app/api/sinistres/[id]/status/route'

const mockedCreate = vi.mocked(createClient)
const mockedAdmin = vi.mocked(createAdminClient)

const SIN = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
const params = Promise.resolve({ id: SIN })
const post = (status: unknown) =>
  POST(
    new Request('http://test', {
      method: 'POST',
      body: JSON.stringify({ status }),
      headers: { 'content-type': 'application/json' },
    }),
    { params },
  )

const session = (user: { id: string } | null, cabinetId = 'cab-1') =>
  mockSupabase({ user, tables: { profiles: [{ data: user ? { cabinet_id: cabinetId } : null }] } }) as never

beforeEach(() => vi.clearAllMocks())

describe('POST /api/sinistres/[id]/status', () => {
  it('401 si non authentifié', async () => {
    mockedCreate.mockResolvedValue(session(null))
    mockedAdmin.mockReturnValue(mockSupabase({}) as never)
    expect((await post('travaux')).status).toBe(401)
  })

  it('400 si le statut est invalide', async () => {
    mockedCreate.mockResolvedValue(session({ id: 'u1' }))
    mockedAdmin.mockReturnValue(mockSupabase({}) as never)
    expect((await post('statut_bidon')).status).toBe(400)
  })

  it('403 si le sinistre appartient à un autre cabinet', async () => {
    mockedCreate.mockResolvedValue(session({ id: 'u1' }, 'cab-1'))
    mockedAdmin.mockReturnValue(mockSupabase({ tables: {
      sinistres: [{ data: { cabinet_id: 'AUTRE', titre: 'Fuite', lots_concernes: [] } }],
    } }) as never)
    expect((await post('travaux')).status).toBe(403)
  })

  it('200 si statut valide et sinistre du cabinet', async () => {
    mockedCreate.mockResolvedValue(session({ id: 'u1' }, 'cab-1'))
    mockedAdmin.mockReturnValue(mockSupabase({ tables: {
      sinistres: [
        { data: { cabinet_id: 'cab-1', titre: 'Fuite', lots_concernes: [] } }, // SELECT ownership
        { error: null },                                                         // UPDATE
      ],
    } }) as never)
    const res = await post('travaux')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
  })
})
