'use client'

import Link from 'next/link'
import { Zap, ArrowRight } from 'lucide-react'
import { Reveal } from './Reveal'
import PricingTarifs from './PricingTarifs'

const TOTAL = 50

export default function Tarifs({ founderTaken = 47 }: { founderTaken?: number }) {
  const TAKEN = Math.min(founderTaken, TOTAL)

  const founderBanner = (
    <Reveal>
      <div
        className="rounded-2xl border border-[#374151]/15 p-5 overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #F8F9FA 0%, #F1F5F9 100%)' }}
      >
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
  )

  return (
    <section id="tarifs" className="py-24 bg-white">
      <PricingTarifs headingLevel={2} founderSlot={founderBanner} />
    </section>
  )
}
