/**
 * Tests — Logique de filtrage des documents (portail copropriétaire)
 *
 * Bug corrigé : les documents sans lot_id étaient visibles par tous les
 * résidents de tous les immeubles du même cabinet (fuite RGPD).
 *
 * La correction filtre les documents sans lot_id par copropriete_id.
 */
import { describe, it, expect } from 'vitest'

// ─── Logique extraite de (portail)/accueil/page.tsx ──────────

type DocumentFilter =
  | { type: 'lot_and_copropriete'; lotId: string; coproprieteId: string }
  | { type: 'copropriete_only'; coproprieteId: string }
  | { type: 'lot_only'; lotId: string }
  | { type: 'none' }

function buildDocumentFilter(
  lotId: string | null | undefined,
  coproprieteId: string | null | undefined
): DocumentFilter {
  if (lotId && coproprieteId) {
    return { type: 'lot_and_copropriete', lotId, coproprieteId }
  }
  if (coproprieteId) {
    return { type: 'copropriete_only', coproprieteId }
  }
  if (lotId) {
    return { type: 'lot_only', lotId }
  }
  return { type: 'none' }
}

// Simule les documents qu'un filtre retournerait
type Doc = { id: string; lot_id: string | null; copropriete_id: string }

function applyFilter(docs: Doc[], filter: DocumentFilter): Doc[] {
  switch (filter.type) {
    case 'lot_and_copropriete':
      return docs.filter(
        d => d.lot_id === filter.lotId ||
        (d.lot_id === null && d.copropriete_id === filter.coproprieteId)
      )
    case 'copropriete_only':
      return docs.filter(d => d.lot_id === null && d.copropriete_id === filter.coproprieteId)
    case 'lot_only':
      return docs.filter(d => d.lot_id === filter.lotId)
    case 'none':
      return []
  }
}

// ─── Fixtures ────────────────────────────────────────────────

const docs: Doc[] = [
  { id: 'doc-1', lot_id: 'lot-A', copropriete_id: 'copro-1' },   // doc lot spécifique
  { id: 'doc-2', lot_id: null,    copropriete_id: 'copro-1' },   // doc général copro-1
  { id: 'doc-3', lot_id: null,    copropriete_id: 'copro-2' },   // doc général copro-2 (AUTRE immeuble)
  { id: 'doc-4', lot_id: 'lot-B', copropriete_id: 'copro-2' },   // doc lot autre immeuble
]

// ─── Tests ────────────────────────────────────────────────────

describe('buildDocumentFilter', () => {
  it('retourne lot_and_copropriete quand les deux sont présents', () => {
    const f = buildDocumentFilter('lot-A', 'copro-1')
    expect(f.type).toBe('lot_and_copropriete')
  })

  it('retourne copropriete_only quand seulement coproprieteId est présent', () => {
    const f = buildDocumentFilter(null, 'copro-1')
    expect(f.type).toBe('copropriete_only')
  })

  it('retourne lot_only quand seulement lotId est présent', () => {
    const f = buildDocumentFilter('lot-A', null)
    expect(f.type).toBe('lot_only')
  })

  it('retourne none quand les deux sont absents', () => {
    const f = buildDocumentFilter(null, null)
    expect(f.type).toBe('none')
  })
})

describe('applyFilter — isolation entre copropriétés (RGPD)', () => {
  it('un résident de copro-1 voit ses docs de lot ET les docs généraux de copro-1', () => {
    const filter = buildDocumentFilter('lot-A', 'copro-1')
    const result = applyFilter(docs, filter)
    const ids = result.map(d => d.id)
    expect(ids).toContain('doc-1')  // doc de son lot
    expect(ids).toContain('doc-2')  // doc général de sa copro
  })

  it('un résident de copro-1 NE VOIT PAS les docs de copro-2 (bug RGPD corrigé)', () => {
    const filter = buildDocumentFilter('lot-A', 'copro-1')
    const result = applyFilter(docs, filter)
    const ids = result.map(d => d.id)
    expect(ids).not.toContain('doc-3')  // doc général copro-2 → invisible
    expect(ids).not.toContain('doc-4')  // doc lot copro-2 → invisible
  })

  it('un résident sans lot voit seulement les docs généraux de sa copro', () => {
    const filter = buildDocumentFilter(null, 'copro-2')
    const result = applyFilter(docs, filter)
    const ids = result.map(d => d.id)
    expect(ids).toContain('doc-3')
    expect(ids).not.toContain('doc-2')  // copro-1, invisible
  })

  it('sans lotId ni coproprieteId : aucun document retourné', () => {
    const filter = buildDocumentFilter(null, null)
    const result = applyFilter(docs, filter)
    expect(result).toHaveLength(0)
  })
})
