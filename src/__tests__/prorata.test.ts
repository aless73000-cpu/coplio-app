/**
 * Tests — Prorata temporis (Loi 1965 art. 14-1, décret 1967)
 *
 * Répartition des charges vendeur/acheteur lors d'une mutation en cours
 * d'exercice. Un bug ici = mauvaise ventilation de charges (argent).
 */
import { describe, it, expect } from 'vitest'
import { joursEntre, calculerProrata, ventilerMutation, quotePart } from '@/lib/prorata'

describe('joursEntre — bornes incluses', () => {
  it('compte une année civile complète (365 j)', () => {
    expect(joursEntre(new Date(2023, 0, 1), new Date(2023, 11, 31))).toBe(365)
  })

  it('compte une année bissextile (366 j)', () => {
    expect(joursEntre(new Date(2024, 0, 1), new Date(2024, 11, 31))).toBe(366)
  })

  it('compte une seule journée', () => {
    expect(joursEntre(new Date(2023, 5, 15), new Date(2023, 5, 15))).toBe(1)
  })
})

describe('calculerProrata', () => {
  it('détention sur toute l\'année → fraction 1, montant intégral', () => {
    const r = calculerProrata(1200, new Date(2023, 0, 1), new Date(2023, 11, 31))
    expect(r.fraction).toBe(1)
    expect(r.montant).toBe(1200)
    expect(r.joursDetention).toBe(365)
  })

  it('borne les dates hors exercice', () => {
    // entrée avant le début et sortie après la fin → ramenées à l'exercice
    const r = calculerProrata(
      1200,
      new Date(2022, 5, 1),   // avant
      new Date(2024, 5, 1),   // après
      new Date(2023, 0, 1),
      new Date(2023, 11, 31),
    )
    expect(r.fraction).toBe(1)
    expect(r.joursDetention).toBe(365)
  })

  it('arrondit le montant au centime', () => {
    // ~la moitié de l'année
    const r = calculerProrata(1000, new Date(2023, 0, 1), new Date(2023, 6, 2), new Date(2023, 0, 1), new Date(2023, 11, 31))
    expect(r.montant).toBeCloseTo(1000 * r.fraction, 2)
    expect(Number.isInteger(Math.round(r.montant * 100))).toBe(true)
  })
})

describe('ventilerMutation — vendeur + acheteur = total', () => {
  it('répartit la charge sans perte (contrôle d\'équilibre)', () => {
    const v = ventilerMutation(1200, new Date(2023, 6, 1)) // mutation au 1er juillet
    expect(v.controle).toBe(true)
    expect(v.total).toBeCloseTo(1200, 1)
    expect(v.partVendeur.montant).toBeGreaterThan(0)
    expect(v.partAcheteur.montant).toBeGreaterThan(0)
  })

  it('attribue le jour de mutation à l\'acheteur (vendeur s\'arrête la veille)', () => {
    const v = ventilerMutation(1200, new Date(2023, 6, 1))
    expect(v.partVendeur.au.getDate()).toBe(30) // 30 juin
    expect(v.partAcheteur.du.getDate()).toBe(1) // 1er juillet
  })

  it('mutation au 1er janvier → tout pour l\'acheteur', () => {
    const v = ventilerMutation(1200, new Date(2023, 0, 1))
    expect(v.partAcheteur.montant).toBeCloseTo(1200, 1)
    expect(v.partVendeur.montant).toBe(0)
  })
})

describe('quotePart', () => {
  it('répartit selon les tantièmes', () => {
    expect(quotePart(1000, 250, 1000)).toBe(250)
  })

  it('renvoie 0 si tantièmes totaux = 0 (pas de division par zéro)', () => {
    expect(quotePart(1000, 100, 0)).toBe(0)
  })

  it('arrondit au centime', () => {
    expect(quotePart(1000, 333, 1000)).toBe(333)
    expect(quotePart(100, 1, 3)).toBe(33.33)
  })
})
