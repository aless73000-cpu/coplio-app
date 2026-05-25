'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-[66px] overflow-hidden bg-[#0A3D2B]">

      {/* Gradient de fond unique, sobre */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(60,196,154,.18) 0%, transparent 70%)',
        }} />
      </div>

      {/* Contenu centré */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 text-center py-24">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 border border-white/15 rounded-full px-4 py-1.5 text-white/70 text-sm mb-10 bg-white/5 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3CC49A]" />
          Nouveau · Import CSV &amp; portail copropriétaire
        </div>

        {/* H1 */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6" style={{ letterSpacing: '-0.04em', lineHeight: 1.05 }}>
          La gestion de<br />copropriété,<br />
          <span style={{ color: '#3CC49A' }}>enfin simple</span>
        </h1>

        {/* Sous-titre */}
        <p className="text-lg sm:text-xl text-white/50 mb-10 max-w-2xl mx-auto leading-relaxed" style={{ letterSpacing: '-0.01em' }}>
          Coplio centralise copropriétés, charges, sinistres et assemblées générales dans une seule plateforme pensée pour les syndics indépendants.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
          <Link
            href="/register"
            className="flex items-center gap-2 bg-white text-[#0A3D2B] font-semibold px-7 py-3.5 rounded-full hover:bg-[#E5F5EF] transition-all text-base shadow-2xl shadow-black/30 hover:-translate-y-0.5"
            style={{ letterSpacing: '-0.01em' }}
          >
            Démarrer gratuitement <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#tarifs"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-base px-6 py-3.5 rounded-full hover:bg-white/8"
          >
            Voir les tarifs
          </a>
        </div>

        {/* Trust strip */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-white/35 text-sm">
          {['14 jours gratuits', 'Sans carte bancaire', 'Sans engagement'].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3CC49A]" /> {t}
            </span>
          ))}
        </div>
      </div>

      {/* App screenshot — simple, pas de floating cards */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 pb-0">
        <div className="rounded-t-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40"
          style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(2px)' }}>
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
              <div className="w-3 h-3 rounded-full bg-green-400/70" />
            </div>
            <div className="flex-1 bg-white/8 rounded-md px-3 py-1 text-center max-w-[200px] mx-auto text-white/30 text-xs">
              app.coplio.fr/dashboard
            </div>
          </div>
          {/* Dashboard preview */}
          <div className="flex h-[240px] sm:h-[300px] overflow-hidden">
            {/* Sidebar */}
            <div className="w-[160px] bg-[#0A3D2B]/80 p-3 flex flex-col gap-1 flex-shrink-0 border-r border-white/5">
              <div className="flex items-center gap-2 px-2 py-2 mb-3">
                <div className="w-5 h-5 bg-[#3CC49A] rounded-md flex items-center justify-center">
                  <span className="text-[#0A3D2B] text-[9px] font-bold">C</span>
                </div>
                <span className="text-white/80 font-semibold text-sm">Coplio</span>
              </div>
              {['Tableau de bord', 'Copropriétés', 'Copropriétaires', 'Appels charges', 'Documents', 'Sinistres'].map((item, i) => (
                <div key={item} className={`px-2 py-1.5 rounded-lg text-[11px] ${i === 0 ? 'bg-white/15 text-white font-medium' : 'text-white/35'}`}>
                  {item}
                </div>
              ))}
            </div>
            {/* Main */}
            <div className="flex-1 p-5 space-y-4 overflow-hidden bg-[#F7F8F7]">
              <div className="text-xs font-semibold text-[#1D1D1F]">Bonjour, Jean 👋</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: '12', l: 'Copropriétés', c: '#0A3D2B', bg: '#E5F5EF' },
                  { v: '284', l: 'Lots', c: '#1D4ED8', bg: '#EFF6FF' },
                  { v: '2', l: 'Impayés', c: '#DC2626', bg: '#FEF2F2' },
                ].map(({ v, l, c, bg }) => (
                  <div key={l} className="rounded-xl p-3" style={{ background: bg }}>
                    <div className="text-base font-bold" style={{ color: c }}>{v}</div>
                    <div className="text-[9px] text-gray-500 mt-0.5">{l}</div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm">
                <div className="text-[10px] text-gray-400 font-medium mb-2">Recouvrement 6 mois</div>
                <div className="flex items-end gap-1 h-10">
                  {[55, 68, 72, 81, 78, 94].map((h, i) => (
                    <div key={i} className="flex-1 rounded-sm" style={{
                      height: `${h}%`,
                      background: i === 5 ? '#0A3D2B' : '#D1FAE5',
                    }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave */}
      <div className="absolute bottom-0 left-0 right-0 leading-[0] pointer-events-none">
        <svg viewBox="0 0 1440 48" xmlns="http://www.w3.org/2000/svg" className="w-full block fill-white">
          <path d="M0,48 C480,0 960,0 1440,48 L1440,48 L0,48 Z" />
        </svg>
      </div>
    </section>
  )
}
