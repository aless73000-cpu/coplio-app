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
          <span className="text-[11px] font-bold text-[#111827] uppercase tracking-[0.18em]">Tarifs</span>
          <h2 className="text-4xl font-bold text-[#1D1D1F] mt-3 mb-4 tracking-tight">
            Simple, transparent, sans surprise
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto mb-8">
            14 jours d&apos;essai gratuit sur tous les plans. Aucune carte bancaire requise.
          </p>
        </div>

        {/* Early adopter banner */}
        <div className="flex items-center justify-center gap-3 bg-gradient-to-r from-[#F1F5F9] to-[#F5F5F7] border border-[#111827]/15 rounded-2xl p-4 mb-10">
          <Zap className="w-4 h-4 text-[#111827] flex-shrink-0" />
          <p className="text-sm text-[#111827]">
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
                  ? 'border-[#111827] bg-[#111827] shadow-2xl shadow-[#111827]/25 md:-mt-5 md:-mb-5'
                  : 'border-gray-100 bg-white hover:border-[#111827]/30 hover:shadow-lg'
              }`}
            >
              {badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="bg-white text-[#111827] text-xs font-bold px-5 py-1.5 rounded-full shadow-lg border border-[#111827]/10">
                    {badge}
                  </span>
                </div>
              )}

              <div className="mb-7">
                <h3 className={`font-bold text-xl mb-1.5 ${highlight ? 'text-white' : 'text-[#1D1D1F]'}`}>{name}</h3>
                <p className={`text-sm mb-5 ${highlight ? 'text-white/65' : 'text-gray-500'}`}>{desc}</p>
                <div className="flex items-end gap-2">
                  <span className={`text-5xl font-bold tracking-tight ${highlight ? 'text-white' : 'text-[#1D1D1F]'}`}>
                    {price}€
                  </span>
                  <span className={`text-sm mb-2 ${highlight ? 'text-white/55' : 'text-gray-400'}`}>/mois HT</span>
                </div>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      highlight ? 'bg-white/20' : 'bg-[#F1F5F9]'
                    }`}>
                      <Check className={`w-2.5 h-2.5 ${highlight ? 'text-white' : 'text-[#111827]'}`} />
                    </div>
                    <span className={highlight ? 'text-white/80' : 'text-gray-600'}>{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href={href}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm text-center transition-all block ${
                  highlight
                    ? 'bg-white text-[#111827] hover:bg-[#F1F5F9] shadow-md'
                    : 'bg-[#111827] text-white hover:bg-[#1F2937] shadow-md shadow-[#111827]/20'
                }`}
              >
                {cta}
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mt-10">
          Tous les prix sont HT · TVA applicable selon votre situation ·{' '}
          <a href="mailto:contact@coplio.fr" className="text-[#111827] hover:underline font-medium">
            Tarif sur mesure pour grands portefeuilles
          </a>
        </p>
      </div>
    </section>
  )
}
