/**
 * Tests d'intégration — GET /api/exports/fec
 *
 * Vérifie l'isolation tenant : l'export FEC ne contient QUE les écritures
 * des copropriétés du cabinet (fix cross-tenant de l'audit). Une copropriété
 * d'un autre cabinet → export vide (en-tête seul).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { mockSupabase } from './helpers/supabase-mock'
import { GET } from '@/app/api/exports/fec/route'

const mockedCreate = vi.mocked(createClient)
const mockedAdmin = vi.mocked(createAdminClient)

const url = (qs = '') => new Request(`http://test/api/exports/fec${qs}`)
const session = (user: { id: string } | null) =>
  mockSupabase({ user, tables: { profiles: [{ data: user ? { cabinet_id: 'cab-1' } : null }] } }) as never

const appel = {
  id: 'a1', montant: 100, montant_paye: 0, date_echeance: '2024-03-15', date_paiement: null, paye: false,
  lot: { id: 'l1', numero: 'A01', copropriete: { id: 'c1', nom: 'Résidence Test' } },
}

beforeEach(() => vi.clearAllMocks())

describe('GET /api/exports/fec', () => {
  it('401 si non authentifié', async () => {
    mockedCreate.mockResolvedValue(session(null))
    mockedAdmin.mockReturnValue(mockSupabase({}) as never)
    const res = await GET(url('?annee=2024'))
    expect(res.status).toBe(401)
  })

  it('copropriété hors cabinet → export vide (en-tête seul, isolation)', async () => {
    mockedCreate.mockResolvedValue(session({ id: 'u1' }))
    // eq(cabinet) + eq(copro) → aucune copro de ce cabinet ne correspond
    mockedAdmin.mockReturnValue(mockSupabase({ tables: { coproprietes: [{ data: [] }] } }) as never)
    const res = await GET(url('?annee=2024&copropriete_id=99999999-9999-9999-9999-999999999999'))
    expect(res.status).toBe(200)
    const body = await res.text()
    expect(body.split('\n')).toHaveLength(1) // en-tête uniquement, aucune écriture
  })

  it('copropriété du cabinet → écritures incluses', async () => {
    mockedCreate.mockResolvedValue(session({ id: 'u1' }))
    mockedAdmin.mockReturnValue(mockSupabase({ tables: {
      coproprietes: [{ data: [{ id: 'c1' }] }],
      lots: [{ data: [{ id: 'l1' }] }],
      appels_charges: [{ data: [appel] }],
    } }) as never)
    const res = await GET(url('?annee=2024'))
    expect(res.status).toBe(200)
    const lines = (await res.text()).split('\n')
    expect(lines.length).toBeGreaterThan(1)          // en-tête + écritures
    expect(lines[0]).toContain('JournalCode')        // en-tête FEC
    expect(lines.some(l => l.includes('411'))).toBe(true) // ligne compte copropriétaire
  })
})
