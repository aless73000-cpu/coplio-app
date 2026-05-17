import { describe, it, expect } from 'vitest'
import { PLAN_LIMITS } from '@/lib/stripe'

// ─── Test 4 : limites des plans ──────────────────────────────────────────────
describe('PLAN_LIMITS', () => {
  it('le plan trial a les mêmes limites que starter', () => {
    expect(PLAN_LIMITS.trial.max_lots).toBe(PLAN_LIMITS.starter.max_lots)
    expect(PLAN_LIMITS.trial.max_gestionnaires).toBe(PLAN_LIMITS.starter.max_gestionnaires)
  })

  it('pro permet plus de lots que starter', () => {
    expect(PLAN_LIMITS.pro.max_lots).toBeGreaterThan(PLAN_LIMITS.starter.max_lots)
  })

  it('expert est illimité (999)', () => {
    expect(PLAN_LIMITS.expert.max_lots).toBe(999)
    expect(PLAN_LIMITS.expert.max_gestionnaires).toBe(999)
  })

  it('tous les plans ont max_lots et max_gestionnaires définis', () => {
    for (const [plan, limits] of Object.entries(PLAN_LIMITS)) {
      expect(limits.max_lots, `${plan}.max_lots`).toBeGreaterThan(0)
      expect(limits.max_gestionnaires, `${plan}.max_gestionnaires`).toBeGreaterThan(0)
    }
  })
})
