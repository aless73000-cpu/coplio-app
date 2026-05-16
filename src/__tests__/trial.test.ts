/**
 * Tests — Système de trial
 *
 * Vérifie la logique de calcul de l'expiration du trial.
 * Bug corrigé : trial_ends_at n'était jamais défini à l'onboarding,
 * rendant tout le système de monétisation trial inopérant.
 */
import { describe, it, expect } from 'vitest'

// ─── Logique extraite de onboarding/route.ts ─────────────────

function computeTrialEndsAt(now = Date.now()): string {
  return new Date(now + 14 * 24 * 60 * 60 * 1000).toISOString()
}

// ─── Logique extraite de TrialBanner.tsx ─────────────────────

function computeDaysLeft(trialEndsAt: string | null, now = Date.now()): number | null {
  if (!trialEndsAt) return null
  const end = new Date(trialEndsAt)
  return Math.max(0, Math.ceil((end.getTime() - now) / (1000 * 60 * 60 * 24)))
}

function shouldShowTrialBanner(plan: string | null): boolean {
  return plan === 'trial'
}

// ─── Tests ────────────────────────────────────────────────────

describe('computeTrialEndsAt', () => {
  it('retourne une date ISO valide', () => {
    const result = computeTrialEndsAt()
    expect(() => new Date(result)).not.toThrow()
    expect(new Date(result).toISOString()).toBe(result)
  })

  it('expire exactement dans 14 jours', () => {
    const now = new Date('2025-01-01T00:00:00.000Z').getTime()
    const result = computeTrialEndsAt(now)
    const expected = new Date('2025-01-15T00:00:00.000Z').toISOString()
    expect(result).toBe(expected)
  })

  it('est dans le futur', () => {
    const result = computeTrialEndsAt()
    expect(new Date(result).getTime()).toBeGreaterThan(Date.now())
  })
})

describe('computeDaysLeft', () => {
  it('retourne null si trialEndsAt est null', () => {
    expect(computeDaysLeft(null)).toBeNull()
  })

  it('retourne 14 le jour de l\'activation', () => {
    const now = new Date('2025-01-01T12:00:00.000Z').getTime()
    const endsAt = new Date('2025-01-15T12:00:00.000Z').toISOString()
    expect(computeDaysLeft(endsAt, now)).toBe(14)
  })

  it('retourne 0 quand le trial est expiré (ne va pas négatif)', () => {
    const now = new Date('2025-02-01T00:00:00.000Z').getTime()
    const endsAt = new Date('2025-01-15T00:00:00.000Z').toISOString()
    expect(computeDaysLeft(endsAt, now)).toBe(0)
  })

  it('retourne 1 le dernier jour', () => {
    const now = new Date('2025-01-14T06:00:00.000Z').getTime()
    const endsAt = new Date('2025-01-15T00:00:00.000Z').toISOString()
    expect(computeDaysLeft(endsAt, now)).toBe(1)
  })

  it('retourne 7 à J-7', () => {
    const now = new Date('2025-01-08T00:00:00.000Z').getTime()
    const endsAt = new Date('2025-01-15T00:00:00.000Z').toISOString()
    expect(computeDaysLeft(endsAt, now)).toBe(7)
  })
})

describe('shouldShowTrialBanner', () => {
  it('affiche la bannière seulement pour plan === "trial"', () => {
    expect(shouldShowTrialBanner('trial')).toBe(true)
  })

  it('n\'affiche pas la bannière pour plan === null (bug corrigé)', () => {
    expect(shouldShowTrialBanner(null)).toBe(false)
  })

  it('n\'affiche pas la bannière pour plan === "starter"', () => {
    expect(shouldShowTrialBanner('starter')).toBe(false)
  })

  it('n\'affiche pas la bannière pour plan === "pro"', () => {
    expect(shouldShowTrialBanner('pro')).toBe(false)
  })

  it('n\'affiche pas la bannière pour plan === "expert"', () => {
    expect(shouldShowTrialBanner('expert')).toBe(false)
  })
})
