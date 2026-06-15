/**
 * Tests d'intégration — GET /api/relances-parametres
 *
 * Couvre le fix d'isolation cross-tenant : on ne peut lire les paramètres
 * de relance que d'une copropriété appartenant à SON cabinet.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { mockSupabase } from './helpers/supabase-mock'
import { GET } from '@/app/api/relances-parametres/route'

const mockedCreate = vi.mocked(createClient)
const mockedAdmin = vi.mocked(createAdminClient)

const COPRO = '33333333-3333-3333-3333-333333333333'
const url = (qs = '') => new Request(`http://test/api/relances-parametres${qs}`)

/** Session = requireCabinetUser (auth + profiles.cabinet_id). */
const session = (user: { id: string } | null, cabinetId = 'cab-1') =>
  mockSupabase({ user, tables: { profiles: [{ data: user ? { cabinet_id: cabinetId } : null }] } }) as never

beforeEach(() => vi.clearAllMocks())

describe('GET /api/relances-parametres', () => {
  it('401 si non authentifié', async () => {
    mockedCreate.mockResolvedValue(session(null))
    mockedAdmin.mockReturnValue(mockSupabase({}) as never)
    const res = await GET(url(`?copropriete_id=${COPRO}`))
    expect(res.status).toBe(401)
  })

  it('400 si copropriete_id manquant', async () => {
    mockedCreate.mockResolvedValue(session({ id: 'u1' }))
    mockedAdmin.mockReturnValue(mockSupabase({}) as never)
    const res = await GET(url())
    expect(res.status).toBe(400)
  })

  it('404 si la copropriété appartient à un autre cabinet (fix cross-tenant)', async () => {
    mockedCreate.mockResolvedValue(session({ id: 'u1' }))
    mockedAdmin.mockReturnValue(mockSupabase({ tables: { coproprietes: [{ data: null }] } }) as never)
    const res = await GET(url(`?copropriete_id=${COPRO}`))
    expect(res.status).toBe(404)
  })

  it('200 + données existantes si la copropriété est dans le cabinet', async () => {
    mockedCreate.mockResolvedValue(session({ id: 'u1' }))
    mockedAdmin.mockReturnValue(mockSupabase({ tables: {
      coproprietes: [{ data: { id: COPRO } }],
      relance_parametres: [{ data: { copropriete_id: COPRO, actif: false, delai_premier_rappel: 15 } }],
    } }) as never)
    const res = await GET(url(`?copropriete_id=${COPRO}`))
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ copropriete_id: COPRO, actif: false })
  })

  it('200 + valeurs par défaut si aucun paramètre configuré', async () => {
    mockedCreate.mockResolvedValue(session({ id: 'u1' }))
    mockedAdmin.mockReturnValue(mockSupabase({ tables: {
      coproprietes: [{ data: { id: COPRO } }],
      relance_parametres: [{ data: null }],
    } }) as never)
    const res = await GET(url(`?copropriete_id=${COPRO}`))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.copropriete_id).toBe(COPRO)
    expect(body.actif).toBe(true) // défaut
  })
})
