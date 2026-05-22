import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { withErrorHandler } from '@/lib/api-handler'
import { captureException } from '@/lib/monitoring'
export const POST = withErrorHandler(async () => {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('cabinet_id')
      .eq('id', user.id)
      .single()

    const { data: cabinet } = await supabase
      .from('cabinets')
      .select('stripe_customer_id')
      .eq('id', profile?.cabinet_id ?? '')
      .single()

    if (!cabinet?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Aucun abonnement Stripe trouvé' },
        { status: 404 }
      )
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: cabinet.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/facturation`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    captureException(error, { context: 'stripe-portal' })
    return NextResponse.json(
      { error: 'Erreur lors de l\'accès au portail Stripe' },
      { status: 500 }
    )
  }
})
