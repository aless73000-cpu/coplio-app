/**
 * Tests d'intégration — POST /api/lots
 *
 * Couvre le fix cross-tenant : la table `lots` n'a pas de cabinet_id, le seul
 * lien tenant passe par la copropriété. Un lot ne peut être créé que dans une
 * copropriété appartenant au cabinet de l'utilisateur.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { mockSupabase } from './helpers/supabase-mock'
import { POST } from '@/app/api/lots/route'

const mockedCreate = vi.mocked(createClient)
const mockedAdmin = vi.mocked(createAdminClient)

const COPRO = '44444444-4444-4444-4444-444444444444'
const req = (body: unknown) =>
  new Request('http://test/api/lots', { method: 'POST', body: JSON.stringify(body) })

const validLot = { copropriete_id: COPRO, numero: 'A01', type: 'appartement', tantiemes: 100 }

const session = (user: { id: string } | null, cabinetId = 'cab-1') =>
  mockSupabase({ user, tables: { profiles: [{ data: user ? { cabinet_id: cabinetId } : null }] } }) as never

/** Cabinet valide avec quota disponible pour checkQuota(). */
const cabinetOk = { plan: 'pro', max_lots: 100, max_gestionnaires: 10, subscription_status: 'active', trial_ends_at: null }

beforeEach(() => vi.clearAllMocks())

describe('POST /api/lots', () => {
  it('400 si le corps est invalide', async () => {
    mockedCreate.mockResolvedValue(session({ id: 'u1' }))
    mockedAdmin.mockReturnValue(mockSupabase({}) as never)
    const res = await POST(req({ numero: 'A01' })) // manque copropriete_id, type, tantiemes
    expect(res.status).toBe(400)
  })

  // NB : checkQuota('lots') interroge coproprietes (liste du cabinet) PUIS lots (count),
  // avant le contrôle d'ownership de la route → chaque table est appelée 2 fois.
  it('404 si la copropriété cible appartient à un autre cabinet (fix cross-tenant)', async () => {
    mockedCreate.mockResolvedValue(session({ id: 'u1' }))
    mockedAdmin.mockReturnValue(mockSupabase({ tables: {
      cabinets: [{ data: cabinetOk }],
      coproprietes: [{ data: [] }, { data: null }], // checkQuota (liste) puis ownership KO
      lots: [{ count: 0 }],                          // checkQuota: comptage
    } }) as never)
    const res = await POST(req(validLot))
    expect(res.status).toBe(404)
  })

  it('200 si la copropriété est dans le cabinet → lot créé', async () => {
    mockedCreate.mockResolvedValue(session({ id: 'u1' }))
    mockedAdmin.mockReturnValue(mockSupabase({ tables: {
      cabinets: [{ data: cabinetOk }],
      coproprietes: [{ data: [{ id: COPRO }] }, { data: { id: COPRO } }], // liste (checkQuota) puis ownership OK
      lots: [{ count: 0 }, { data: { id: 'lot-new', ...validLot } }],      // count puis insert
    } }) as never)
    const res = await POST(req(validLot))
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ id: 'lot-new' })
  })
})
