import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { PLAN_LIMITS } from '@/lib/stripe'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

const RELEVANT_EVENTS = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
])

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  if (!RELEVANT_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const cabinetId = session.metadata?.cabinet_id
        const plan = session.metadata?.plan

        if (cabinetId && plan) {
          const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.starter

          await supabase
            .from('cabinets')
            .update({
              plan: plan as 'trial' | 'starter' | 'pro' | 'expert',
              subscription_status: 'active',
              stripe_subscription_id: session.subscription as string,
              max_gestionnaires: limits.max_gestionnaires,
              max_lots: limits.max_lots,
            })
            .eq('id', cabinetId)
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object as Stripe.Subscription
        const cabinetId = sub.metadata?.cabinet_id

        if (cabinetId) {
          const plan = sub.metadata?.plan || 'starter'
          const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.starter

          await supabase
            .from('cabinets')
            .update({
              plan: plan as 'trial' | 'starter' | 'pro' | 'expert',
              subscription_status: sub.status as 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete',
              stripe_subscription_id: sub.id,
              current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
              max_gestionnaires: limits.max_gestionnaires,
              max_lots: limits.max_lots,
            })
            .eq('id', cabinetId)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const cabinetId = sub.metadata?.cabinet_id

        if (cabinetId) {
          await supabase
            .from('cabinets')
            .update({
              plan: 'starter',
              subscription_status: 'canceled',
              stripe_subscription_id: null,
            })
            .eq('id', cabinetId)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        await supabase
          .from('cabinets')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', customerId)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        await supabase
          .from('cabinets')
          .update({ subscription_status: 'active' })
          .eq('stripe_customer_id', customerId)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
