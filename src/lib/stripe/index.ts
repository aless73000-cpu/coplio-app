import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  appInfo: {
    name: 'Coplio',
    version: '1.0.0',
  },
})

export const STRIPE_PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER!,
  pro: process.env.STRIPE_PRICE_PRO!,
  expert: process.env.STRIPE_PRICE_EXPERT!,
  addon_portail: process.env.STRIPE_PRICE_ADDON_PORTAIL!,
}

export const PLAN_LIMITS = {
  trial:   { max_gestionnaires: 1, max_lots: 50 },
  starter: { max_gestionnaires: 1, max_lots: 50 },
  pro:     { max_gestionnaires: 5, max_lots: 200 },
  expert:  { max_gestionnaires: 999, max_lots: 999 },
}

export type PlanKey = keyof typeof PLAN_LIMITS
