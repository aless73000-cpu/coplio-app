'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2, Building2, Bell } from 'lucide-react'

export default function Hero() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center pt-[66px] overflow-hidden"
      style={{ background: '#08090A' }}
    >
      {/* Gradient top */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 55% at 50% -5%, rgba(99,102,241,.10) 0%, rgba(139,92,246,.06) 30%, transparent 70%)',
      }} />

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 text-center py-24">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 border border-white/[0.08] rounded-full px-4 py-1.5 text-white/40 text-sm mb-10 bg-white/[0.03]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          Nouveau · Import CSV &amp; portail copropriétaire
        </div>

        {/* H1 */}
        <h1
          className="text-5xl sm:text-6xl lg:text-[80px] font-bold text-white mb-6"
          style={{ letterSpacing: '-0.04em', lineHeight: 1.03 }}
        >
          La gestion de<br />copropriété,<br />
          <span style={{ color: 'rgba(255,255,255,0.28)' }}>enfin simple</span>
        </h1>

        {/* Subtitle */}
        <p
          className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.36)', letterSpacing: '-0.01em' }}
        >
          Coplio centralise copropriétés, charges, sinistres et assemblées générales dans une seule plateforme pensée pour les syndics indépendants.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
          <Link
            href="/register"
            className="flex items-center gap-2 bg-white text-[#08090A] font-semibold px-7 py-3.5 rounded-full hover:bg-slate-100 transition-all text-base shadow-2xl shadow-black/60 hover:-translate-y-0.5"
            style={{ letterSpacing: '-0.01em' }}
          >
            Démarrer gratuitement <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#tarifs"
            className="flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors text-base px-6 py-3.5 rounded-full hover:bg-white/5"
          >
            Voir les tarifs
          </a>
        </div>

        {/* Trust strip */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.22)' }}>
          {['14 jours gratuits', 'Sans carte bancaire', 'Sans engagement'].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} /> {t}
            </span>
          ))}
        </div>
      </div>

      {/* App preview */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 pb-0">
        <div
          className="rounded-t-2xl overflow-hidden border border-white/[0.07]"
          style={{ background: 'rgba(255,255,255,0.035)' }}
        >
          {/* Browser chrome */}
          <div
            className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05]"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-white/[0.08]" />
              <div className="w-3 h-3 rounded-full bg-white/[0.08]" />
              <div className="w-3 h-3 rounded-full bg-white/[0.08]" />
            </div>
            <div className="flex-1 bg-white/[0.05] rounded-md px-3 py-1 text-center max-w-[200px] mx-auto text-white/[0.18] text-xs">
              app.coplio.fr/dashboard
            </div>
          </div>

          {/* Dashboard */}
          <div className="flex h-[260px] sm:h-[320px] overflow-hidden">
            {/* Sidebar */}
            <div
              className="w-[160px] p-3 flex flex-col gap-1 flex-shrink-0 border-r border-white/[0.04]"
              style={{ background: '#1C1F26' }}
            >
              <div className="flex items-center gap-2 px-2 py-2 mb-3">
                <div className="w-6 h-6 bg-white/10 border border-white/10 rounded-lg flex items-center justify-center">
                  <Building2 className="w-3.5 h-3.5 text-white/60" />
                </div>
                <span className="text-white/70 font-semibold text-sm">Coplio</span>
              </div>
              {['Tableau de bord', 'Copropriétés', 'Copropriétaires', 'Appels charges', 'Documents', 'Sinistres'].map((item, i) => (
                <div
                  key={item}
                  className={`px-2 py-1.5 rounded-lg text-[11px] ${i === 0 ? 'bg-white/10 text-white/80 font-medium' : 'text-white/22'}`}
                >
                  {item}
                </div>
              ))}
            </div>

            {/* Main */}
            <div className="flex-1 p-5 space-y-3 overflow-hidden bg-[#F8F9FA]">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-[#374151]">Bonjour, Jean 👋</div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <Bell className="w-3 h-3" />
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { v: '12',    l: 'Copropriétés', c: '#374151', bg: '#F1F5F9' },
                  { v: '284',   l: 'Lots',          c: '#334155', bg: '#E2E8F0' },
                  { v: '3',     l: 'AG à venir',    c: '#92400E', bg: '#FEF9C3' },
                  { v: '1 4k€', l: 'Impayés',       c: '#B91C1C', bg: '#FEF2F2' },
                ].map(({ v, l, c, bg }) => (
                  <div key={l} className="rounded-xl p-2.5" style={{ background: bg }}>
                    <div className="text-sm font-bold" style={{ color: c }}>{v}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">{l}</div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm">
                <div className="text-[10px] text-slate-400 font-medium mb-2">Recouvrement — 6 derniers mois</div>
                <div className="flex items-end gap-1 h-12">
                  {[55, 68, 72, 81, 78, 94].map((h, i) => (
                    <div key={i} className="flex-1 rounded-sm transition-all" style={{
                      height: `${h}%`,
                      background: i === 5 ? '#334155' : i === 4 ? '#64748B' : '#E2E8F0',
                    }} />
                  ))}
                </div>
                <div className="flex justify-between mt-1.5">
                  {['Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr'].map(m => (
                    <span key={m} className="text-[8px] text-slate-300">{m}</span>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl p-2.5 shadow-sm border border-slate-100">
                <div className="text-[10px] text-slate-400 font-medium mb-1.5">Prochaines AG</div>
                {[
                  { nom: 'Résidence Voltaire', date: '12 juin' },
                  { nom: 'Copro Les Pins',     date: '18 juin' },
                ].map(({ nom, date }) => (
                  <div key={nom} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                    <span className="text-[9px] text-slate-500">{nom}</span>
                    <span className="text-[9px] font-medium text-[#374151]">{date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave → white section below */}
      <div className="absolute bottom-0 left-0 right-0 leading-[0] pointer-events-none">
        <svg viewBox="0 0 1440 48" xmlns="http://www.w3.org/2000/svg" className="w-full block fill-white">
          <path d="M0,48 C480,0 960,0 1440,48 L1440,48 L0,48 Z" />
        </svg>
      </div>
    </section>
  )
}
