'use client'

import { Check, Zap } from 'lucide-react'
import { PLANS_CONFIG } from '@/types'

const PLAN_META: Record<string, { desc: string; badge: string | null; cta: string; href: string }> = {
  starter: {
    desc: 'Parfait pour démarrer et gérer un petit portefeuille.',
    badge: null,
    cta: 'Démarrer gratuitement',
    href: '/register',
  },
  pro: {
    desc: 'Pour les syndics actifs avec un portefeuille croissant.',
    badge: '⭐ Le plus populaire',
    cta: 'Essayer 14 jours gratuits',
    href: '/register',
  },
  expert: {
    desc: 'Pour les cabinets avec plusieurs gestionnaires.',
    badge: null,
    cta: 'Nous contacter',
    href: 'mailto:contact@coplio.fr',
  },
}

export default function Tarifs() {
  const plans = Object.entries(PLANS_CONFIG).map(([key, plan]) => ({
    key,
    ...plan,
    ...PLAN_META[key],
    highlight: 'popular' in plan && plan.popular === true,
  }))

  return (
    <section id="tarifs" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-[11px] font-bold text-[#0F6E56] uppercase tracking-[0.18em]">Tarifs</span>
          <h2 className="text-4xl font-bold text-[#1C1C1A] mt-3 mb-4 tracking-tight">
            Simple, transparent, sans surprise
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto mb-8">
            14 jours d&apos;essai gratuit sur tous les plans. Aucune carte bancaire requise.
          </p>
        </div>

        {/* Early adopter banner */}
        <div className="flex items-center justify-center gap-3 bg-gradient-to-r from-[#E1F5EE] to-[#F4F2EB] border border-[#0F6E56]/15 rounded-2xl p-4 mb-10">
          <Zap className="w-4 h-4 text-[#0F6E56] flex-shrink-0" />
          <p className="text-sm text-[#0F6E56]">
            <strong>Offre de lancement</strong> — Les premiers abonnés bénéficient du tarif actuel{' '}
            <strong>bloqué à vie</strong>, même si les prix augmentent.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map(({ key, name, price, desc, highlight, badge, features, cta, href }) => (
            <div
              key={key}
              className={`relative rounded-3xl p-8 border-2 flex flex-col transition-all duration-300 ${
                highlight
                  ? 'border-[#0F6E56] bg-[#0F6E56] shadow-2xl shadow-[#0F6E56]/25 md:-mt-5 md:-mb-5'
                  : 'border-gray-100 bg-white hover:border-[#0F6E56]/30 hover:shadow-lg'
              }`}
            >
              {badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="bg-white text-[#0F6E56] text-xs font-bold px-5 py-1.5 rounded-full shadow-lg border border-[#0F6E56]/10">
                    {badge}
                  </span>
                </div>
              )}

              <div className="mb-7">
                <h3 className={`font-bold text-xl mb-1.5 ${highlight ? 'text-white' : 'text-[#1C1C1A]'}`}>{name}</h3>
                <p className={`text-sm mb-5 ${highlight ? 'text-white/65' : 'text-gray-500'}`}>{desc}</p>
                <div className="flex items-end gap-2">
                  <span className={`text-5xl font-bold tracking-tight ${highlight ? 'text-white' : 'text-[#1C1C1A]'}`}>
                    {price}€
                  </span>
                  <span className={`text-sm mb-2 ${highlight ? 'text-white/55' : 'text-gray-400'}`}>/mois HT</span>
                </div>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      highlight ? 'bg-white/20' : 'bg-[#E1F5EE]'
                    }`}>
                      <Check className={`w-2.5 h-2.5 ${highlight ? 'text-white' : 'text-[#0F6E56]'}`} />
                    </div>
                    <span className={highlight ? 'text-white/80' : 'text-gray-600'}>{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href={href}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm text-center transition-all block ${
                  highlight
                    ? 'bg-white text-[#0F6E56] hover:bg-[#E1F5EE] shadow-md'
                    : 'bg-[#0F6E56] text-white hover:bg-[#0d5e49] shadow-md shadow-[#0F6E56]/20'
                }`}
              >
                {cta}
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mt-10">
          Tous les prix sont HT · TVA applicable selon votre situation ·{' '}
          <a href="mailto:contact@coplio.fr" className="text-[#0F6E56] hover:underline font-medium">
            Tarif sur mesure pour grands portefeuilles
          </a>
        </p>
      </div>
    </section>
  )
}
