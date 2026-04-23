import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, STRIPE_PRICES } from '@/lib/stripe'
import type { PlanKey } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { plan } = await request.json() as { plan: PlanKey }

    if (!STRIPE_PRICES[plan as keyof typeof STRIPE_PRICES]) {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
    }

    // Récupérer le cabinet
    const { data: profile } = await supabase
      .from('profiles')
      .select('cabinet_id')
      .eq('id', user.id)
      .single()

    const { data: cabinet } = await supabase
      .from('cabinets')
      .select('stripe_customer_id, nom, email_contact')
      .eq('id', profile?.cabinet_id ?? '')
      .single()

    if (!cabinet) {
      return NextResponse.json({ error: 'Cabinet introuvable' }, { status: 404 })
    }

    // Créer ou récupérer le customer Stripe
    let customerId = cabinet.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: cabinet.email_contact ?? user.email,
        name: cabinet.nom,
        metadata: {
          cabinet_id: profile?.cabinet_id ?? '',
          user_id: user.id,
        },
      })
      customerId = customer.id

      // Sauvegarder le customer_id
      await supabase
        .from('cabinets')
        .update({ stripe_customer_id: customerId })
        .eq('id', profile?.cabinet_id ?? '')
    }

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_PRICES[plan as keyof typeof STRIPE_PRICES],
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/facturation?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/facturation?canceled=true`,
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          cabinet_id: profile?.cabinet_id ?? '',
          plan,
        },
      },
      metadata: {
        cabinet_id: profile?.cabinet_id ?? '',
        plan,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      locale: 'fr',
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du paiement' },
      { status: 500 }
    )
  }
}
