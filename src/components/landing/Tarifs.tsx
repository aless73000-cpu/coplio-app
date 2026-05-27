'use client'

import Link from 'next/link'
import { Check, Zap, ArrowRight } from 'lucide-react'
import { PLANS_CONFIG } from '@/types'
import { Reveal } from './Reveal'

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

const TAKEN = 47
const TOTAL = 50

export default function Tarifs() {
  const plans = Object.entries(PLANS_CONFIG).map(([key, plan]) => ({
    key,
    ...plan,
    ...PLAN_META[key],
    highlight: 'popular' in plan && plan.popular === true,
  }))

  return (
    <section id="tarifs" className="py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6">

        <Reveal className="text-center mb-14">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.18em] mb-4">Tarifs</p>
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#374151] mb-5"
            style={{ letterSpacing: '-0.03em', lineHeight: 1.08 }}
          >
            Simple, transparent,<br />sans surprise
          </h2>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            14 jours d&apos;essai gratuit sur tous les plans. Aucune carte bancaire requise.
          </p>
        </Reveal>

        {/* Urgency banner */}
        <Reveal delay={100}>
          <div className="rounded-2xl border border-[#374151]/15 p-5 mb-12 overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #F8F9FA 0%, #F1F5F9 100%)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-9 h-9 bg-[#374151] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#374151]">Offre fondateur — {TOTAL - TAKEN} places restantes</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tarif actuel <strong>bloqué à vie</strong> pour les {TOTAL} premiers abonnés, même si les prix augmentent.
                  </p>
                </div>
              </div>
              <Link
                href="/register"
                className="flex items-center gap-1.5 bg-[#374151] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#4B5563] transition-colors whitespace-nowrap flex-shrink-0"
              >
                Réserver ma place <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                <span>{TAKEN} places prises</span>
                <span>{TOTAL - TAKEN} restantes sur {TOTAL}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-[#374151] transition-all"
                  style={{ width: `${(TAKEN / TOTAL) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map(({ key, name, price, desc, highlight, badge, features, cta, href }, i) => (
            <Reveal key={key} delay={i * 80}>
              <div
                className={`relative rounded-3xl p-8 border-2 flex flex-col transition-all duration-300 h-full ${
                  highlight
                    ? 'border-[#374151] bg-[#374151] shadow-2xl shadow-[#374151]/25 md:-mt-5 md:-mb-5'
                    : 'border-gray-100 bg-white hover:border-[#374151]/30 hover:shadow-xl hover:shadow-black/[0.05] hover:-translate-y-1'
                }`}
              >
                {badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="bg-white text-[#374151] text-xs font-bold px-5 py-1.5 rounded-full shadow-lg border border-[#374151]/10">
                      {badge}
                    </span>
                  </div>
                )}

                <div className="mb-7">
                  <h3 className={`font-bold text-xl mb-1.5 ${highlight ? 'text-white' : 'text-[#1D1D1F]'}`}>{name}</h3>
                  <p className={`text-sm mb-5 ${highlight ? 'text-white/65' : 'text-gray-500'}`}>{desc}</p>
                  <div className="flex items-end gap-2">
                    <span className={`text-5xl font-bold tracking-tight ${highlight ? 'text-white' : 'text-[#1D1D1F]'}`} style={{ letterSpacing: '-0.04em' }}>
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
                        <Check className={`w-2.5 h-2.5 ${highlight ? 'text-white' : 'text-[#374151]'}`} />
                      </div>
                      <span className={highlight ? 'text-white/80' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={href}
                  className={`w-full py-3.5 rounded-2xl font-bold text-sm text-center transition-all block hover:-translate-y-0.5 ${
                    highlight
                      ? 'bg-white text-[#374151] hover:bg-[#F1F5F9] shadow-md'
                      : 'bg-[#374151] text-white hover:bg-[#4B5563] shadow-md shadow-[#374151]/20'
                  }`}
                >
                  {cta}
                </a>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <p className="text-center text-sm text-gray-400 mt-12">
            Tous les prix sont HT · TVA applicable selon votre situation ·{' '}
            <a href="mailto:contact@coplio.fr" className="text-[#374151] hover:underline font-medium">
              Tarif sur mesure pour grands portefeuilles
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
