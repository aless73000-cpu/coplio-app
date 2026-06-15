/**
 * Tests d'intégration — POST /api/assemblees/[id]/resolutions/[resolution_id]/resultat
 *
 * Vérifie le calcul de résultat d'une résolution AG bout-en-bout :
 * agrégation des votes réels + application du MajorityEngine + isolation cabinet.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { mockSupabase } from './helpers/supabase-mock'
import { POST } from '@/app/api/assemblees/[id]/resolutions/[resolution_id]/resultat/route'

const mockedCreate = vi.mocked(createClient)
const mockedAdmin = vi.mocked(createAdminClient)

const AG = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const RESO = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
const params = Promise.resolve({ id: AG, resolution_id: RESO })
const post = () => POST(new Request('http://test', { method: 'POST' }), { params })

const session = (user: { id: string } | null, cabinetId = 'cab-1') =>
  mockSupabase({ user, tables: { profiles: [{ data: user ? { cabinet_id: cabinetId } : null }] } }) as never

beforeEach(() => vi.clearAllMocks())

describe('POST .../resolutions/[id]/resultat', () => {
  it('401 si non authentifié', async () => {
    mockedCreate.mockResolvedValue(session(null))
    mockedAdmin.mockReturnValue(mockSupabase({}) as never)
    expect((await post()).status).toBe(401)
  })

  it('404 si l\'AG est introuvable', async () => {
    mockedCreate.mockResolvedValue(session({ id: 'u1' }))
    mockedAdmin.mockReturnValue(mockSupabase({ tables: { assemblees_generales: [{ data: null }] } }) as never)
    expect((await post()).status).toBe(404)
  })

  it('403 si l\'AG appartient à un autre cabinet', async () => {
    mockedCreate.mockResolvedValue(session({ id: 'u1' }, 'cab-1'))
    mockedAdmin.mockReturnValue(mockSupabase({ tables: {
      assemblees_generales: [{ data: { id: AG, tantiemes_presents: 1000, copropriete_id: 'c1' } }],
      coproprietes: [{ data: { cabinet_id: 'AUTRE-cabinet', 'tantièmes_totaux': 10000 } }],
    } }) as never)
    expect((await post()).status).toBe(403)
  })

  it('Art. 24 : adopte la résolution si tantièmes pour > 50% des présents', async () => {
    mockedCreate.mockResolvedValue(session({ id: 'u1' }, 'cab-1'))
    mockedAdmin.mockReturnValue(mockSupabase({ tables: {
      assemblees_generales: [{ data: { id: AG, tantiemes_presents: 1000, copropriete_id: 'c1' } }],
      coproprietes: [{ data: { cabinet_id: 'cab-1', 'tantièmes_totaux': 10000, nb_copropriétaires: 5 } }],
      ag_resolutions: [
        { data: { id: RESO, type_vote: 'art_24' } },           // SELECT résolution
        { data: { id: RESO, adoptee: true } },                  // UPDATE … select().single()
      ],
      ag_votes: [{ data: [
        { valeur: 'pour', tantiemes: 600 },
        { valeur: 'contre', tantiemes: 100 },
      ] }],
    } }) as never)
    const res = await post()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.calcul.adoptee).toBe(true)        // 600 > 500 (50% de 1000 présents)
  })

  it('Art. 24 : rejette si tantièmes pour ≤ 50% des présents', async () => {
    mockedCreate.mockResolvedValue(session({ id: 'u1' }, 'cab-1'))
    mockedAdmin.mockReturnValue(mockSupabase({ tables: {
      assemblees_generales: [{ data: { id: AG, tantiemes_presents: 1000, copropriete_id: 'c1' } }],
      coproprietes: [{ data: { cabinet_id: 'cab-1', 'tantièmes_totaux': 10000, nb_copropriétaires: 5 } }],
      ag_resolutions: [
        { data: { id: RESO, type_vote: 'art_24' } },
        { data: { id: RESO, adoptee: false } },
      ],
      ag_votes: [{ data: [
        { valeur: 'pour', tantiemes: 400 },
        { valeur: 'contre', tantiemes: 500 },
      ] }],
    } }) as never)
    const res = await post()
    expect(res.status).toBe(200)
    expect((await res.json()).calcul.adoptee).toBe(false) // 400 ≤ 500
  })
})
