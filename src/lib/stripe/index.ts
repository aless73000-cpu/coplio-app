import Stripe from 'stripe'

// Lazy initialization to avoid crash at build time when env vars aren't set
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'placeholder', {
      apiVersion: '2024-06-20',
      appInfo: {
        name: 'Coplio',
        version: '1.0.0',
      },
    })
  }
  return _stripe
}

// Backward-compatible named export used in existing route files
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export const STRIPE_PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER ?? '',
  pro: process.env.STRIPE_PRICE_PRO ?? '',
  expert: process.env.STRIPE_PRICE_EXPERT ?? '',
  addon_portail: process.env.STRIPE_PRICE_ADDON_PORTAIL ?? '',
}

export const PLAN_LIMITS = {
  trial:   { max_gestionnaires: 1, max_lots: 50 },
  starter: { max_gestionnaires: 1, max_lots: 50 },
  pro:     { max_gestionnaires: 5, max_lots: 200 },
  expert:  { max_gestionnaires: 999, max_lots: 999 },
}

export type PlanKey = keyof typeof PLAN_LIMITS
