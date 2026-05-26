/**
 * Tests — Import de lots (parsing Excel)
 *
 * Vérifie les fonctions de normalisation de l'import Excel :
 * - normalizeLotType : mapping des types de lots
 * - normalizeKey : suppression accents / casse / caractères spéciaux
 * - findCol : recherche de colonnes avec fuzzy matching
 *
 * Ces fonctions sont critiques : un mapping incorrect peut
 * créer des lots avec le mauvais type ou rater des champs.
 */
import { describe, it, expect } from 'vitest'

// ─── Logique extraite de import/dossier/route.ts ─────────────

const LOT_TYPES = ['appartement', 'maison', 'local_commercial', 'parking', 'cave', 'autre'] as const
type LotType = typeof LOT_TYPES[number]

function normalizeLotType(raw: string): LotType {
  const s = raw.toLowerCase().trim()
  if (LOT_TYPES.includes(s as LotType)) return s as LotType
  if (s.startsWith('app') || s.includes('appart')) return 'appartement'
  if (s.startsWith('mai') || s.includes('villa')) return 'maison'
  if (s.includes('local') || s.includes('comm') || s.includes('bureau')) return 'local_commercial'
  if (s.includes('park') || s.includes('garage') || s.includes('box')) return 'parking'
  if (s.includes('cave') || s.includes('sous')) return 'cave'
  return 'autre'
}

function normalizeKey(s: string): string {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function findCol(row: Record<string, unknown>, keywords: string[]): string {
  const entries = Object.entries(row)
  for (const kw of keywords) {
    const normKw = normalizeKey(kw)
    const found = entries.find(([k]) => normalizeKey(k) === normKw)
    if (found) return String(found[1] ?? '').trim()
    const partial = entries.find(([k]) => normalizeKey(k).includes(normKw))
    if (partial) return String(partial[1] ?? '').trim()
  }
  return ''
}

// ─── Tests : normalizeLotType ─────────────────────────────────

describe('normalizeLotType — mapping des types', () => {
  it('type exact "appartement"', () => {
    expect(normalizeLotType('appartement')).toBe('appartement')
  })

  it('type exact "parking"', () => {
    expect(normalizeLotType('parking')).toBe('parking')
  })

  it('type exact "cave"', () => {
    expect(normalizeLotType('cave')).toBe('cave')
  })

  it('"Appartement" en majuscule', () => {
    expect(normalizeLotType('Appartement')).toBe('appartement')
  })

  it('"appart" → appartement', () => {
    expect(normalizeLotType('appart')).toBe('appartement')
  })

  it('"Appt" → appartement', () => {
    expect(normalizeLotType('Appt')).toBe('appartement')
  })

  it('"villa" → maison', () => {
    expect(normalizeLotType('villa')).toBe('maison')
  })

  it('"Maison individuelle" → maison', () => {
    expect(normalizeLotType('maison individuelle')).toBe('maison')
  })

  it('"local commercial" → local_commercial', () => {
    expect(normalizeLotType('local commercial')).toBe('local_commercial')
  })

  it('"bureau" → local_commercial', () => {
    expect(normalizeLotType('bureau')).toBe('local_commercial')
  })

  it('"garage" → parking', () => {
    expect(normalizeLotType('garage')).toBe('parking')
  })

  it('"box" → parking', () => {
    expect(normalizeLotType('box')).toBe('parking')
  })

  it('"sous-sol" → cave', () => {
    expect(normalizeLotType('sous-sol')).toBe('cave')
  })

  it('valeur inconnue → autre', () => {
    expect(normalizeLotType('inconnu')).toBe('autre')
  })

  it('string vide → autre', () => {
    expect(normalizeLotType('')).toBe('autre')
  })
})

// ─── Tests : normalizeKey ─────────────────────────────────────

describe('normalizeKey — normalisation des clés de colonnes', () => {
  it('supprime les accents', () => {
    expect(normalizeKey('Numéro')).toBe('numero')
  })

  it('met en minuscule', () => {
    expect(normalizeKey('Tantièmes')).toBe('tantiemes')
  })

  it('supprime espaces et tirets', () => {
    expect(normalizeKey('N° Lot')).toBe('nlot')
  })

  it('supprime les parenthèses et m²', () => {
    expect(normalizeKey('Surface (m²)')).toBe('surfacem')
  })

  it('clé standard sans modification', () => {
    expect(normalizeKey('email')).toBe('email')
  })

  it('clé avec slash', () => {
    expect(normalizeKey('Surface/m2')).toBe('surfacem2')
  })
})

// ─── Tests : findCol ──────────────────────────────────────────

describe('findCol — recherche de colonnes dans une ligne Excel', () => {
  const row = {
    'Numéro lot': 'A01',
    'Type de lot': 'Appartement',
    'Surface (m²)': '45',
    'Tantièmes': '150',
    'Email': 'test@example.com',
  }

  it('trouve "numero" dans "Numéro lot"', () => {
    expect(findCol(row, ['numero', 'num', 'lot'])).toBe('A01')
  })

  it('trouve "tantiemes" dans "Tantièmes"', () => {
    expect(findCol(row, ['tantiemes', 'tantieme'])).toBe('150')
  })

  it('trouve "email" exact', () => {
    expect(findCol(row, ['email', 'mail'])).toBe('test@example.com')
  })

  it('trouve "surface" dans "Surface (m²)"', () => {
    expect(findCol(row, ['surface', 'superficie'])).toBe('45')
  })

  it('retourne "" si colonne introuvable', () => {
    expect(findCol(row, ['telephone', 'tel', 'phone'])).toBe('')
  })

  it('premier keyword prioritaire si plusieurs correspondent', () => {
    // "num" et "numero" correspondent tous les deux à "Numéro lot"
    const result = findCol(row, ['numero', 'num'])
    expect(result).toBe('A01')
  })
})

// ─── Tests : validation des tantièmes ────────────────────────

describe('Validation des tantièmes', () => {
  function validateTantiemes(raw: string): number | null {
    const val = parseInt(raw.replace(/\s/g, ''), 10)
    return isNaN(val) || val < 1 ? null : val
  }

  it('parse "150"', () => {
    expect(validateTantiemes('150')).toBe(150)
  })

  it('parse "1 500" avec espace', () => {
    expect(validateTantiemes('1 500')).toBe(1500)
  })

  it('"0" → null (invalide)', () => {
    expect(validateTantiemes('0')).toBeNull()
  })

  it('string vide → null', () => {
    expect(validateTantiemes('')).toBeNull()
  })

  it('"abc" → null', () => {
    expect(validateTantiemes('abc')).toBeNull()
  })

  it('valeur négative → null', () => {
    expect(validateTantiemes('-5')).toBeNull()
  })
})
