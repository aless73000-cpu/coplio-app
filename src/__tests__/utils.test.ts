import { describe, it, expect } from 'vitest'
import { formatEuro, formatFileSize, slugify } from '@/lib/utils'

// ─── Test 1 : formatEuro ──────────────────────────────────────────────────────
describe('formatEuro', () => {
  it('formate un montant positif en euros français', () => {
    const result = formatEuro(1234.5)
    expect(result).toContain('1')
    expect(result).toContain('234')
    expect(result).toContain('€')
  })

  it('formate zéro', () => {
    expect(formatEuro(0)).toContain('0')
  })

  it('formate un montant négatif (impayé remboursé)', () => {
    const result = formatEuro(-500)
    expect(result).toContain('500')
    expect(result).toContain('€')
  })

  it('arrondit à 2 décimales maximum', () => {
    const result = formatEuro(1.999)
    expect(result).not.toContain('1.999')
  })
})

// ─── Test 2 : formatFileSize ─────────────────────────────────────────────────
describe('formatFileSize', () => {
  it('affiche 0 B pour un fichier vide', () => {
    expect(formatFileSize(0)).toBe('0 B')
  })

  it('affiche en KB pour ~1000 bytes', () => {
    expect(formatFileSize(1024)).toContain('KB')
  })

  it('affiche en MB pour ~1 million bytes', () => {
    expect(formatFileSize(1_048_576)).toContain('MB')
  })

  it('affiche en GB pour ~1 milliard bytes', () => {
    expect(formatFileSize(1_073_741_824)).toContain('GB')
  })
})

// ─── Test 3 : slugify ────────────────────────────────────────────────────────
describe('slugify', () => {
  it('convertit en minuscules et remplace les espaces', () => {
    expect(slugify('Mon Cabinet Syndic')).toBe('mon-cabinet-syndic')
  })

  it('supprime les accents', () => {
    const result = slugify('Résidence Les Étoiles')
    expect(result).not.toMatch(/[éèêàâùîô]/i)
  })

  it('supprime les caractères spéciaux', () => {
    const result = slugify('Copropriété #1 (Paris)')
    expect(result).not.toMatch(/[#()]/i)
  })
})
