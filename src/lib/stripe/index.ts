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

export const stripe = getStripe()

export const STRIPE_PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER ?? '',
  pro: process.env.STRIPE_PRICE_PRO ?? '',
  expert: process.env.STRIPE_PRICE_EXPERT ?? '',
  addon_portail: process.env.STRIPE_PRICE_ADDON_PORTAIL ?? '',
}

// ⚠️ Ces valeurs DOIVENT correspondre à PLANS_CONFIG (src/types/index.ts)
// et à la landing page (/src/app/page.tsx). Toute modification ici
// doit être répercutée dans les deux autres fichiers.
export const PLAN_LIMITS = {
  trial:   { max_gestionnaires: 1, max_lots: 50,  max_coproprietes: 3   },
  starter: { max_gestionnaires: 1, max_lots: 75,  max_coproprietes: 10  },
  pro:     { max_gestionnaires: 5, max_lots: 400, max_coproprietes: 50  },
  expert:  { max_gestionnaires: 999, max_lots: 999, max_coproprietes: 999 },
}

export type PlanKey = keyof typeof PLAN_LIMITS
