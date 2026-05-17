import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { stripe, STRIPE_PRICES } from '@/lib/stripe'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('cabinet_id, role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'owner') {
      return NextResponse.json({ error: 'Accès réservé au propriétaire du cabinet' }, { status: 403 })
    }

    const admin = createAdminClient()
    const { data: cabinet } = await admin
      .from('cabinets')
      .select('stripe_customer_id, stripe_subscription_id, nom, email_contact, addon_portail_actif, max_lots')
      .eq('id', profile.cabinet_id ?? '')
      .single()

    if (!cabinet) return NextResponse.json({ error: 'Cabinet introuvable' }, { status: 404 })
    if (cabinet.addon_portail_actif) {
      return NextResponse.json({ error: 'Add-on déjà actif' }, { status: 400 })
    }
    if (!cabinet.stripe_subscription_id) {
      return NextResponse.json({ error: 'Abonnement actif requis avant d\'activer un add-on' }, { status: 400 })
    }
    if (!STRIPE_PRICES.addon_portail) {
      return NextResponse.json({ error: 'Add-on non configuré (STRIPE_PRICE_ADDON_PORTAIL manquant)' }, { status: 503 })
    }

    const lots = cabinet.max_lots === 999 ? 1 : (cabinet.max_lots ?? 1)

    const session = await stripe.checkout.sessions.create({
      customer: cabinet.stripe_customer_id ?? undefined,
      customer_email: cabinet.stripe_customer_id ? undefined : (cabinet.email_contact ?? user.email),
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_PRICES.addon_portail,
          quantity: lots,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/facturation?success=true&addon=portail`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/facturation?canceled=true`,
      subscription_data: {
        metadata: {
          cabinet_id: profile.cabinet_id ?? '',
          addon: 'portail',
        },
      },
      metadata: {
        cabinet_id: profile.cabinet_id ?? '',
        addon: 'portail',
      },
      locale: 'fr',
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Addon portail checkout error:', error)
    return NextResponse.json({ error: 'Erreur lors de la création du paiement' }, { status: 500 })
  }
}
