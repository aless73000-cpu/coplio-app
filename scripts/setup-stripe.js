/**
 * Script de configuration Stripe pour Coplio
 * Usage : STRIPE_SECRET_KEY=sk_live_xxx node scripts/setup-stripe.js
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY manquant')
  process.exit(1)
}

const PLANS = [
  {
    key: 'starter',
    name: 'Coplio Starter',
    description: '1 gestionnaire · 50 lots max · Portail copropriétaire inclus',
    amount: 9900, // en centimes
  },
  {
    key: 'pro',
    name: 'Coplio Pro',
    description: '5 gestionnaires · 200 lots · Vote AG en ligne · Relances automatiques',
    amount: 18900,
  },
  {
    key: 'expert',
    name: 'Coplio Cabinet',
    description: 'Gestionnaires illimités · Lots illimités · Support prioritaire',
    amount: 27900,
  },
]

async function setup() {
  console.log('🚀 Configuration Stripe Coplio\n')

  const results = {}

  for (const plan of PLANS) {
    process.stdout.write(`Création du produit "${plan.name}"... `)

    // Créer le produit
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: { plan_key: plan.key },
    })

    // Créer le prix mensuel récurrent
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.amount,
      currency: 'eur',
      recurring: { interval: 'month' },
      metadata: { plan_key: plan.key },
    })

    results[plan.key] = price.id
    console.log(`✅ ${price.id}`)
  }

  // Add-on portail brandé (par lot)
  process.stdout.write('Création de l\'add-on portail brandé... ')
  const addonProduct = await stripe.products.create({
    name: 'Add-on : Portail copropriétaire brandé',
    description: '0,30€ / lot / mois — Personnalisation aux couleurs du cabinet',
    metadata: { plan_key: 'addon_portail' },
  })
  const addonPrice = await stripe.prices.create({
    product: addonProduct.id,
    unit_amount: 30,
    currency: 'eur',
    recurring: { interval: 'month', usage_type: 'metered' },
    metadata: { plan_key: 'addon_portail' },
  })
  results['addon_portail'] = addonPrice.id
  console.log(`✅ ${addonPrice.id}`)

  console.log('\n✅ Produits créés avec succès !\n')
  console.log('Ajoutez ces variables dans votre .env.local et sur Vercel :\n')
  console.log(`STRIPE_PRICE_STARTER=${results.starter}`)
  console.log(`STRIPE_PRICE_PRO=${results.pro}`)
  console.log(`STRIPE_PRICE_EXPERT=${results.expert}`)
  console.log(`STRIPE_PRICE_ADDON_PORTAIL=${results.addon_portail}`)
  console.log('\nN\'oubliez pas d\'ajouter aussi :')
  console.log('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...')
  console.log('STRIPE_SECRET_KEY=sk_live_...')
  console.log('STRIPE_WEBHOOK_SECRET=whsec_... (après avoir créé le webhook)')
}

setup().catch(err => {
  console.error('❌ Erreur:', err.message)
  process.exit(1)
})
