/**
 * Tests d'intégration — POST /api/votes/[id]/repondre
 *
 * Vérifie la logique métier + sécurité du vote portail :
 * - non authentifié / profil copro introuvable
 * - vote clôturé / expiré / déjà voté
 * - INTÉGRITÉ : une option_id d'un AUTRE vote est rejetée (fix de l'audit)
 * - chemin nominal : vote enregistré
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { mockSupabase } from './helpers/supabase-mock'
import { POST } from '@/app/api/votes/[id]/repondre/route'

const mockedCreate = vi.mocked(createClient)
const mockedAdmin = vi.mocked(createAdminClient)

const VOTE_ID = '11111111-1111-1111-1111-111111111111'
const OPT_ID = '22222222-2222-2222-2222-222222222222'

const params = Promise.resolve({ id: VOTE_ID })
const req = (body: unknown) =>
  new Request('http://test/api/votes/x/repondre', { method: 'POST', body: JSON.stringify(body) })

const openVote = { id: VOTE_ID, statut: 'ouvert', date_fin: new Date(Date.now() + 86_400_000).toISOString() }

/** Session client (auth + table votes). */
function session(user: { id: string } | null, vote: unknown) {
  return mockSupabase({ user, tables: { votes: [{ data: vote }] } }) as never
}
/** Admin client : ordre des from() → coproprietaires, vote_reponses(select), vote_options, vote_reponses(insert). */
function admin(tables: Record<string, { data?: unknown; error?: unknown }[]>) {
  return mockSupabase({ tables }) as never
}

beforeEach(() => vi.clearAllMocks())

describe('POST /api/votes/[id]/repondre', () => {
  it('401 si non authentifié', async () => {
    mockedCreate.mockResolvedValue(session(null, openVote))
    mockedAdmin.mockReturnValue(admin({}))
    const res = await POST(req({ option_id: OPT_ID }), { params })
    expect(res.status).toBe(401)
  })

  it('403 si aucun profil copropriétaire lié', async () => {
    mockedCreate.mockResolvedValue(session({ id: 'u1' }, openVote))
    mockedAdmin.mockReturnValue(admin({ coproprietaires: [{ data: null }] }))
    const res = await POST(req({ option_id: OPT_ID }), { params })
    expect(res.status).toBe(403)
  })

  it('400 si le vote est clôturé', async () => {
    mockedCreate.mockResolvedValue(session({ id: 'u1' }, { ...openVote, statut: 'cloture' }))
    mockedAdmin.mockReturnValue(admin({ coproprietaires: [{ data: { id: 'cop-1' } }] }))
    const res = await POST(req({ option_id: OPT_ID }), { params })
    expect(res.status).toBe(400)
  })

  it('400 si le vote est expiré', async () => {
    const expired = { ...openVote, date_fin: new Date(Date.now() - 86_400_000).toISOString() }
    mockedCreate.mockResolvedValue(session({ id: 'u1' }, expired))
    mockedAdmin.mockReturnValue(admin({ coproprietaires: [{ data: { id: 'cop-1' } }] }))
    const res = await POST(req({ option_id: OPT_ID }), { params })
    expect(res.status).toBe(400)
  })

  it('409 si le copropriétaire a déjà voté', async () => {
    mockedCreate.mockResolvedValue(session({ id: 'u1' }, openVote))
    mockedAdmin.mockReturnValue(admin({
      coproprietaires: [{ data: { id: 'cop-1' } }],
      vote_reponses: [{ data: { id: 'rep-existante' } }],
    }))
    const res = await POST(req({ option_id: OPT_ID }), { params })
    expect(res.status).toBe(409)
  })

  it('400 si l\'option appartient à un AUTRE vote (fix intégrité)', async () => {
    mockedCreate.mockResolvedValue(session({ id: 'u1' }, openVote))
    mockedAdmin.mockReturnValue(admin({
      coproprietaires: [{ data: { id: 'cop-1' } }],
      vote_reponses: [{ data: null }],   // pas déjà voté
      vote_options: [{ data: null }],    // option absente pour CE vote → rejet
    }))
    const res = await POST(req({ option_id: OPT_ID }), { params })
    expect(res.status).toBe(400)
  })

  it('400 si option_id n\'est pas un UUID valide (Zod)', async () => {
    mockedCreate.mockResolvedValue(session({ id: 'u1' }, openVote))
    mockedAdmin.mockReturnValue(admin({
      coproprietaires: [{ data: { id: 'cop-1' } }],
      vote_reponses: [{ data: null }],
    }))
    const res = await POST(req({ option_id: 'pas-un-uuid' }), { params })
    expect(res.status).toBe(400)
  })

  it('200 chemin nominal : vote enregistré', async () => {
    mockedCreate.mockResolvedValue(session({ id: 'u1' }, openVote))
    mockedAdmin.mockReturnValue(admin({
      coproprietaires: [{ data: { id: 'cop-1' } }],
      vote_reponses: [{ data: null }, { error: null }], // existing-check puis insert
      vote_options: [{ data: { id: OPT_ID } }],
    }))
    const res = await POST(req({ option_id: OPT_ID }), { params })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })
})
