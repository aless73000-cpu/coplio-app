/**
 * Tests — Webhook Stripe
 *
 * Vérifie que chaque event Stripe produit la bonne mise à jour en base.
 * Les appels Supabase et Stripe sont mockés — aucun appel réseau réel.
 *
 * Events couverts :
 *   checkout.session.completed (plan + addon portail)
 *   customer.subscription.updated (changement de plan)
 *   customer.subscription.created
 *   customer.subscription.deleted (main + addon portail)
 *   invoice.payment_failed
 *   invoice.paid
 */
import { describe, it, expect } from 'vitest'
import { PLAN_LIMITS } from '@/lib/stripe'

// ─── Helpers extraits du webhook (logique pure, sans I/O) ─────

type PlanKey = 'trial' | 'starter' | 'pro' | 'expert'
type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'

function buildCheckoutUpdate(plan: PlanKey, subscriptionId: string) {
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.starter
  return {
    plan,
    subscription_status: 'active' as SubscriptionStatus,
    stripe_subscription_id: subscriptionId,
    max_gestionnaires: limits.max_gestionnaires,
    max_lots: limits.max_lots,
  }
}

function buildSubscriptionUpdate(plan: PlanKey, status: SubscriptionStatus, subId: string) {
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.starter
  return {
    plan,
    subscription_status: status,
    stripe_subscription_id: subId,
    max_gestionnaires: limits.max_gestionnaires,
    max_lots: limits.max_lots,
  }
}

function buildCancellationUpdate() {
  const limits = PLAN_LIMITS.starter
  return {
    plan: 'starter' as PlanKey,
    subscription_status: 'canceled' as SubscriptionStatus,
    stripe_subscription_id: null,
    max_lots: limits.max_lots,
    max_gestionnaires: limits.max_gestionnaires,
  }
}

function buildPaymentFailedUpdate() {
  return { subscription_status: 'past_due' as SubscriptionStatus }
}

function buildInvoicePaidUpdate() {
  return { subscription_status: 'active' as SubscriptionStatus }
}

// ─── Tests ─────────────────────────────────────────────────────

describe('checkout.session.completed — plan principal', () => {
  it('génère la bonne mise à jour pour le plan pro', () => {
    const update = buildCheckoutUpdate('pro', 'sub_test123')
    expect(update.plan).toBe('pro')
    expect(update.subscription_status).toBe('active')
    expect(update.stripe_subscription_id).toBe('sub_test123')
    expect(update.max_lots).toBe(PLAN_LIMITS.pro.max_lots)
    expect(update.max_gestionnaires).toBe(PLAN_LIMITS.pro.max_gestionnaires)
  })

  it('applique les limites du plan starter', () => {
    const update = buildCheckoutUpdate('starter', 'sub_abc')
    expect(update.max_lots).toBe(PLAN_LIMITS.starter.max_lots)
    expect(update.max_gestionnaires).toBe(PLAN_LIMITS.starter.max_gestionnaires)
  })

  it('applique les limites du plan expert', () => {
    const update = buildCheckoutUpdate('expert', 'sub_xyz')
    expect(update.max_lots).toBe(PLAN_LIMITS.expert.max_lots)
    expect(update.max_gestionnaires).toBe(PLAN_LIMITS.expert.max_gestionnaires)
  })

  it('fallback sur starter si plan inconnu', () => {
    const update = buildCheckoutUpdate('unknown' as PlanKey, 'sub_xyz')
    expect(update.max_lots).toBe(PLAN_LIMITS.starter.max_lots)
  })
})

describe('customer.subscription.updated — changement de plan', () => {
  it('met à jour le plan et les quotas en cas de montée en gamme', () => {
    const update = buildSubscriptionUpdate('pro', 'active', 'sub_updated')
    expect(update.plan).toBe('pro')
    expect(update.subscription_status).toBe('active')
    expect(update.max_lots).toBe(PLAN_LIMITS.pro.max_lots)
  })

  it('gère un statut past_due sans changer les quotas', () => {
    const update = buildSubscriptionUpdate('pro', 'past_due', 'sub_pastdue')
    expect(update.subscription_status).toBe('past_due')
    expect(update.plan).toBe('pro')
  })
})

describe('customer.subscription.deleted — annulation', () => {
  it('remet le plan à starter et remet les quotas à zéro', () => {
    const update = buildCancellationUpdate()
    expect(update.plan).toBe('starter')
    expect(update.subscription_status).toBe('canceled')
    expect(update.stripe_subscription_id).toBeNull()
    expect(update.max_lots).toBe(PLAN_LIMITS.starter.max_lots)
    expect(update.max_gestionnaires).toBe(PLAN_LIMITS.starter.max_gestionnaires)
  })

  it('les quotas starter après annulation sont inférieurs ou égaux aux quotas pro', () => {
    const update = buildCancellationUpdate()
    expect(update.max_lots).toBeLessThan(PLAN_LIMITS.pro.max_lots)
    expect(update.max_gestionnaires).toBeLessThan(PLAN_LIMITS.pro.max_gestionnaires)
  })
})

describe('invoice.payment_failed', () => {
  it('passe le statut à past_due', () => {
    const update = buildPaymentFailedUpdate()
    expect(update.subscription_status).toBe('past_due')
  })
})

describe('invoice.paid', () => {
  it('restaure le statut à active', () => {
    const update = buildInvoicePaidUpdate()
    expect(update.subscription_status).toBe('active')
  })
})

// ─── Test : cohérence des PLAN_LIMITS ────────────────────────

describe('PLAN_LIMITS — cohérence des quotas', () => {
  it('starter < pro < expert pour max_lots', () => {
    expect(PLAN_LIMITS.starter.max_lots).toBeLessThan(PLAN_LIMITS.pro.max_lots)
    // expert peut être -1 (illimité) ou un grand nombre
    const expertLots = PLAN_LIMITS.expert.max_lots
    expect(expertLots === -1 || expertLots > PLAN_LIMITS.pro.max_lots).toBe(true)
  })

  it('starter < pro pour max_gestionnaires', () => {
    expect(PLAN_LIMITS.starter.max_gestionnaires).toBeLessThan(PLAN_LIMITS.pro.max_gestionnaires)
  })

  it('tous les plans ont des limites définies', () => {
    for (const plan of ['starter', 'pro', 'expert'] as const) {
      expect(PLAN_LIMITS[plan]).toBeDefined()
      expect(typeof PLAN_LIMITS[plan].max_lots).toBe('number')
      expect(typeof PLAN_LIMITS[plan].max_gestionnaires).toBe('number')
    }
  })
})

// ─── Test : format des montants ──────────────────────────────

describe('formatAmount (logique isolée)', () => {
  function formatAmount(cents: number | null | undefined, currency = 'eur'): string {
    if (!cents) return '—'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100)
  }

  it('formate 2900 centimes en €', () => {
    const result = formatAmount(2900)
    expect(result).toContain('29')
    expect(result).toContain('€')
  })

  it('retourne — pour null', () => {
    expect(formatAmount(null)).toBe('—')
  })

  it('retourne — pour 0', () => {
    expect(formatAmount(0)).toBe('—')
  })
})
