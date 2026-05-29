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

const POPULAR_PLAN_KEY = 'pro'

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
        {/* Back bar — mobile only */}
        <div className="sticky top-0 z-10 md:hidden flex items-center gap-2 px-4 py-3 bg-white/90 backdrop-blur border-b border-gray-100">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#374151]"
          >
            <ArrowLeft className="w-4 h-4" />
            Accueil
          </Link>
        </div>

        {/* Header */}
        <div className="max-w-5xl mx-auto px-6 pt-10 pb-4">
          <Link
            href="/"
            className="hidden md:inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#374151] transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l&apos;accueil
          </Link>

          <div className="text-center mb-16">
            <span className="text-[11px] font-bold text-[#374151] uppercase tracking-[0.18em]">
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
                className={`rounded-2xl border p-8 flex flex-col ${plan.key === POPULAR_PLAN_KEY
                  ? 'border-[#374151] shadow-lg shadow-[#374151]/10 relative'
                  : 'border-gray-200'
                }`}
              >
                {plan.key === POPULAR_PLAN_KEY && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-[#374151] text-white text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
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
                      <Check className="w-4 h-4 text-[#374151] mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <a
                  href={plan.href}
                  className={`w-full py-3 rounded-xl text-sm font-semibold text-center transition-colors ${plan.key === POPULAR_PLAN_KEY
                    ? 'bg-[#374151] text-white hover:bg-[#374151]/90'
                    : 'bg-gray-100 text-[#1C1C1A] hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>

          {/* Tableau comparatif */}
          <div className="mt-20">
            <h2 className="text-2xl font-bold text-[#1C1C1A] text-center mb-2 tracking-tight">
              Comparez les plans
            </h2>
            <p className="text-gray-400 text-sm text-center mb-10">Toutes les fonctionnalités, plan par plan</p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-4 text-gray-400 font-normal w-1/2">Fonctionnalité</th>
                    {plans.map(p => (
                      <th key={p.key} className={`text-center pb-4 font-semibold ${p.key === POPULAR_PLAN_KEY ? 'text-[#374151]' : 'text-gray-500'}`}>
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {([
                    { label: 'Gestionnaires', values: ['1', 'Jusqu\'à 5', 'Illimités'] },
                    { label: 'Lots gérés', values: ['75 lots', '400 lots', 'Illimités'] },
                    { label: 'Portail copropriétaire', values: [true, true, true] },
                    { label: 'GED illimitée', values: [true, true, true] },
                    { label: 'Suivi sinistres', values: [true, true, true] },
                    { label: 'Appels de charges', values: [true, true, true] },
                    { label: 'Vote en ligne AG', values: [false, true, true] },
                    { label: 'Relances automatiques', values: [false, true, true] },
                    { label: 'Rapports avancés', values: [false, true, true] },
                    { label: 'Archivage légal 10 ans', values: [false, true, true] },
                    { label: 'API accès', values: [false, false, 'Bientôt'] },
                    { label: 'Portail brandé', values: [false, false, 'Bientôt'] },
                    { label: 'Support prioritaire', values: [false, false, true] },
                  ] as { label: string; values: (boolean | string)[] }[]).map(({ label, values }) => (
                    <tr key={label} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 text-gray-700 font-medium">{label}</td>
                      {values.map((v, i) => (
                        <td key={i} className="py-3.5 text-center">
                          {typeof v === 'boolean' ? (
                            v
                              ? <Check className="w-4 h-4 text-[#374151] mx-auto" />
                              : <span className="block w-4 h-0.5 bg-gray-200 mx-auto rounded" />
                          ) : v === 'Bientôt' ? (
                            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Bientôt</span>
                          ) : (
                            <span className="text-gray-700 font-medium">{v}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
