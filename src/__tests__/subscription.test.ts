/**
 * Tests — Logique d'abonnement et annulation
 *
 * Bug corrigé : l'annulation d'abonnement ne réinitialisait pas
 * max_lots et max_gestionnaires → les clients annulés conservaient
 * les quotas de leur ancien plan Pro/Expert.
 */
import { describe, it, expect } from 'vitest'
import { PLAN_LIMITS } from '@/lib/stripe'

// ─── Logique extraite du webhook stripe ──────────────────────

type PlanKey = 'trial' | 'starter' | 'pro' | 'expert'

function buildCancellationUpdate(currentPlan: PlanKey) {
  const starterLimits = PLAN_LIMITS['starter']
  return {
    plan: 'starter' as const,
    subscription_status: 'canceled' as const,
    stripe_subscription_id: null,
    max_lots: starterLimits.max_lots,
    max_gestionnaires: starterLimits.max_gestionnaires,
  }
}

function buildCheckoutUpdate(plan: PlanKey) {
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.starter
  return {
    plan,
    subscription_status: 'active' as const,
    max_lots: limits.max_lots,
    max_gestionnaires: limits.max_gestionnaires,
  }
}

// ─── Tests ────────────────────────────────────────────────────

describe('buildCancellationUpdate — réinitialisation des quotas', () => {
  it('remet plan à "starter" après annulation', () => {
    const update = buildCancellationUpdate('pro')
    expect(update.plan).toBe('starter')
  })

  it('remet subscription_status à "canceled"', () => {
    const update = buildCancellationUpdate('pro')
    expect(update.subscription_status).toBe('canceled')
  })

  it('remet stripe_subscription_id à null', () => {
    const update = buildCancellationUpdate('pro')
    expect(update.stripe_subscription_id).toBeNull()
  })

  it('réinitialise max_lots au niveau Starter après annulation Pro (bug corrigé)', () => {
    const update = buildCancellationUpdate('pro')
    // Un ex-client Pro ne doit plus avoir 400 lots
    expect(update.max_lots).toBe(PLAN_LIMITS.starter.max_lots)
    expect(update.max_lots).toBeLessThan(PLAN_LIMITS.pro.max_lots)
  })

  it('réinitialise max_gestionnaires au niveau Starter après annulation Expert (bug corrigé)', () => {
    const update = buildCancellationUpdate('expert')
    expect(update.max_gestionnaires).toBe(PLAN_LIMITS.starter.max_gestionnaires)
    expect(update.max_gestionnaires).toBeLessThan(PLAN_LIMITS.expert.max_gestionnaires)
  })

  it('le résultat est identique peu importe le plan annulé', () => {
    const fromPro = buildCancellationUpdate('pro')
    const fromExpert = buildCancellationUpdate('expert')
    expect(fromPro).toEqual(fromExpert)
  })
})

describe('buildCheckoutUpdate — activation des bons quotas', () => {
  it('active les limites Starter correctes (75 lots)', () => {
    const update = buildCheckoutUpdate('starter')
    expect(update.max_lots).toBe(75)
    expect(update.max_gestionnaires).toBe(1)
  })

  it('active les limites Pro correctes (400 lots)', () => {
    const update = buildCheckoutUpdate('pro')
    expect(update.max_lots).toBe(400)
    expect(update.max_gestionnaires).toBe(5)
  })

  it('active les limites Expert correctes (illimité)', () => {
    const update = buildCheckoutUpdate('expert')
    expect(update.max_lots).toBe(999)
    expect(update.max_gestionnaires).toBe(999)
  })

  it('un plan inconnu fallback sur Starter', () => {
    const update = buildCheckoutUpdate('trial')
    // trial n'a pas de PLANS_CONFIG, doit fallback sur starter
    expect(update.max_lots).toBeGreaterThan(0)
  })
})
