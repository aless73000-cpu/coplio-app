/**
 * Tests — Moteur de majorités AG (Loi du 10 juillet 1965)
 *
 * Couvre Art. 24, Art. 25 + passerelle 25-1, Art. 26 (double majorité),
 * unanimité, et le quorum. Un bug ici = résolution adoptée/rejetée à tort.
 */
import { describe, it, expect } from 'vitest'
import { calculateMajority, checkQuorum, type MajorityInput } from '@/lib/majority-engine'

function base(overrides: Partial<MajorityInput>): MajorityInput {
  return {
    type_vote: 'art_24',
    tantiemes_pour: 0,
    tantiemes_contre: 0,
    voix_pour: 0,
    voix_contre: 0,
    voix_abstention: 0,
    tantiemes_presents: 1000,
    tantiemes_totaux_copropriete: 1000,
    ...overrides,
  }
}

describe('calculateMajority — Art. 24 (majorité des présents)', () => {
  it('adopte si tantièmes pour > 50% des présents', () => {
    const r = calculateMajority(base({ type_vote: 'art_24', tantiemes_presents: 1000, tantiemes_pour: 501 }))
    expect(r.adoptee).toBe(true)
  })

  it('rejette si pile 50% (seuil strict, non atteint)', () => {
    const r = calculateMajority(base({ type_vote: 'art_24', tantiemes_presents: 1000, tantiemes_pour: 500 }))
    expect(r.adoptee).toBe(false)
  })
})

describe('calculateMajority — Art. 25 + passerelle 25-1', () => {
  it('adopte si pour > 50% des tantièmes totaux', () => {
    const r = calculateMajority(base({ type_vote: 'art_25', tantiemes_totaux_copropriete: 900, tantiemes_pour: 451 }))
    expect(r.adoptee).toBe(true)
    expect(r.passerelle_25_1).toBe(false)
  })

  it('déclenche la passerelle 25-1 si non adopté mais ≥ 1/3 des tantièmes', () => {
    const r = calculateMajority(base({ type_vote: 'art_25', tantiemes_totaux_copropriete: 900, tantiemes_pour: 300 }))
    expect(r.adoptee).toBe(false)
    expect(r.passerelle_25_1).toBe(true) // 300 >= 300 (1/3 de 900)
  })

  it('pas de passerelle si en dessous du tiers', () => {
    const r = calculateMajority(base({ type_vote: 'art_25', tantiemes_totaux_copropriete: 900, tantiemes_pour: 299 }))
    expect(r.adoptee).toBe(false)
    expect(r.passerelle_25_1).toBe(false)
  })
})

describe('calculateMajority — Art. 26 (double majorité)', () => {
  it('adopte si majorité en voix ET ≥ 2/3 des tantièmes', () => {
    const r = calculateMajority(base({
      type_vote: 'art_26', tantiemes_totaux_copropriete: 900, tantiemes_pour: 600,
      voix_pour: 6, voix_contre: 3, voix_abstention: 1,
    }))
    expect(r.adoptee).toBe(true) // 6 > 5 voix ET 600 >= 600 tantièmes
  })

  it('rejette si tantièmes < 2/3 même avec majorité en voix', () => {
    const r = calculateMajority(base({
      type_vote: 'art_26', tantiemes_totaux_copropriete: 900, tantiemes_pour: 599,
      voix_pour: 9, voix_contre: 1, voix_abstention: 0,
    }))
    expect(r.adoptee).toBe(false)
  })

  it('rejette si tantièmes OK mais pas la majorité en voix', () => {
    const r = calculateMajority(base({
      type_vote: 'art_26', tantiemes_totaux_copropriete: 900, tantiemes_pour: 700,
      voix_pour: 4, voix_contre: 5, voix_abstention: 1,
    }))
    expect(r.adoptee).toBe(false)
  })
})

describe('calculateMajority — unanimité', () => {
  it('adopte si aucune voix contre ni abstention', () => {
    const r = calculateMajority(base({ type_vote: 'unanimite', voix_pour: 5, voix_contre: 0, voix_abstention: 0 }))
    expect(r.adoptee).toBe(true)
  })

  it('rejette s\'il y a une abstention', () => {
    const r = calculateMajority(base({ type_vote: 'unanimite', voix_pour: 5, voix_contre: 0, voix_abstention: 1 }))
    expect(r.adoptee).toBe(false)
  })

  it('rejette si aucune voix pour', () => {
    const r = calculateMajority(base({ type_vote: 'unanimite', voix_pour: 0, voix_contre: 0, voix_abstention: 0 }))
    expect(r.adoptee).toBe(false)
  })
})

describe('calculateMajority — garde-fou', () => {
  it('ne divise pas par zéro si tantièmes totaux = 0', () => {
    const r = calculateMajority(base({ type_vote: 'art_25', tantiemes_totaux_copropriete: 0, tantiemes_pour: 100 }))
    expect(r.adoptee).toBe(false)
    expect(r.raison).toMatch(/impossible/i)
  })
})

describe('checkQuorum', () => {
  it('atteint si présents ≥ 25% des totaux (défaut)', () => {
    const q = checkQuorum(300, 1000)
    expect(q.atteint).toBe(true)
    expect(q.pourcentage).toBe(30)
  })

  it('insuffisant en dessous du seuil', () => {
    const q = checkQuorum(200, 1000)
    expect(q.atteint).toBe(false)
  })

  it('respecte une fraction de quorum personnalisée', () => {
    expect(checkQuorum(500, 1000, 0.5).atteint).toBe(true)
    expect(checkQuorum(499, 1000, 0.5).atteint).toBe(false)
  })

  it('ne divise pas par zéro si totaux = 0', () => {
    const q = checkQuorum(0, 0)
    expect(q.pourcentage).toBe(0)
  })
})
