import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, ArrowLeft } from 'lucide-react'
import { SoftwareApplicationJsonLd } from '@/components/seo/JsonLd'
import { PLANS_CONFIG } from '@/types'

const { starter, pro, expert } = PLANS_CONFIG

export const metadata: Metadata = {
  title: 'Tarifs',
  description:
    `Découvrez les tarifs de Coplio — logiciel de gestion de copropriété. Plans ${starter.name} (${starter.price}€/mois), ${pro.name} (${pro.price}€/mois) et ${expert.name} (${expert.price}€/mois). Essai gratuit 14 jours, sans carte bancaire.`,
  alternates: { canonical: 'https://coplio.fr/tarifs' },
  openGraph: {
    title: `Tarifs Coplio — Logiciel syndic à partir de ${starter.price}€/mois`,
    description:
      'Plans adaptés à chaque cabinet syndic. Essai gratuit 14 jours sans engagement.',
    url: 'https://coplio.fr/tarifs',
    images: [{ url: 'https://coplio.fr/opengraph-image', width: 1200, height: 630 }],
  },
}

const PLAN_CTA: Record<string, string> = {
  starter: 'Démarrer gratuitement',
  pro: 'Essayer 14 jours gratuits',
  expert: 'Nous contacter',
}

const PLAN_HREF: Record<string, string> = {
  starter: '/register',
  pro: '/register',
  expert: 'mailto:contact@coplio.fr',
}

export default function TarifsPage() {
  const plans = Object.entries(PLANS_CONFIG).map(([key, plan]) => ({
    key,
    ...plan,
    cta: PLAN_CTA[key],
    href: PLAN_HREF[key],
  }))

  return (
    <>
      <SoftwareApplicationJsonLd />

      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="max-w-5xl mx-auto px-6 pt-10 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0F6E56] transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l&apos;accueil
          </Link>

          <div className="text-center mb-16">
            <span className="text-[11px] font-bold text-[#0F6E56] uppercase tracking-[0.18em]">
              Tarifs
            </span>
            <h1 className="text-5xl font-bold text-[#1C1C1A] mt-3 mb-5 tracking-tight">
              Simple et transparent
            </h1>
            <p className="text-gray-500 text-xl max-w-xl mx-auto leading-relaxed">
              14 jours d&apos;essai gratuit. Sans carte bancaire. Sans engagement.
            </p>
          </div>
        </div>

        {/* Plans */}
        <div className="max-w-5xl mx-auto px-6 pb-24">
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.key}
                className={`rounded-2xl border p-8 flex flex-col ${'popular' in plan && plan.popular
                  ? 'border-[#0F6E56] shadow-lg shadow-[#0F6E56]/10 relative'
                  : 'border-gray-200'
                }`}
              >
                {'popular' in plan && plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-[#0F6E56] text-white text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                      Le plus populaire
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="text-xl font-bold text-[#1C1C1A]">{plan.name}</h2>
                </div>

                <div className="mb-8">
                  <span className="text-4xl font-bold text-[#1C1C1A]">{plan.price}€</span>
                  <span className="text-gray-400 text-sm ml-1">/mois</span>
                  <p className="text-xs text-gray-400 mt-1">HT · facturé mensuellement</p>
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-[#0F6E56] mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <a
                  href={plan.href}
                  className={`w-full py-3 rounded-xl text-sm font-semibold text-center transition-colors ${'popular' in plan && plan.popular
                    ? 'bg-[#0F6E56] text-white hover:bg-[#0F6E56]/90'
                    : 'bg-gray-100 text-[#1C1C1A] hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>

          {/* Garantie */}
          <p className="text-center text-sm text-gray-400 mt-12">
            Résiliation en 1 clic · Données exportables à tout moment · Hébergement 🇪🇺 RGPD
          </p>
        </div>
      </div>
    </>
  )
}
