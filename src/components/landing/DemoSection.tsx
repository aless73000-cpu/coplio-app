'use client'

import { Building2, Play, BarChart3, Bell, AlertTriangle } from 'lucide-react'
import { Reveal } from './Reveal'

function scrollToShowcase() {
  document.getElementById('fonctionnalites')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function DemoSection() {
  return (
    <section className="py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6">

        <Reveal className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-4 text-slate-400">
            Voyez Coplio en action
          </p>
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#374151] mb-5"
            style={{ letterSpacing: '-0.03em', lineHeight: 1.08 }}
          >
            Une interface pensée<br />pour gagner du temps
          </h2>
          <p className="text-lg text-slate-400 max-w-lg mx-auto">
            Un aperçu de l&apos;interface — découvrez les modules en 30 secondes.
          </p>
        </Reveal>

        {/* Large mockup */}
        <Reveal delay={100}>
          <div className="relative rounded-3xl overflow-hidden border border-slate-100 shadow-2xl shadow-black/[0.08] group cursor-pointer" onClick={scrollToShowcase}>

            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-5 py-3.5 bg-slate-50 border-b border-slate-100">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-300/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-300/60" />
                <div className="w-3 h-3 rounded-full bg-green-300/60" />
              </div>
              <div className="flex-1 bg-white border border-slate-100 rounded-md px-3 py-1 text-center max-w-[240px] mx-auto text-slate-300 text-xs">
                app.coplio.fr/dashboard
              </div>
            </div>

            {/* Dashboard full preview */}
            <div className="flex h-[260px] sm:h-[380px] lg:h-[460px] overflow-hidden bg-[#F8F9FA]">

              {/* Sidebar */}
              <div className="hidden sm:flex w-[180px] p-3 flex-col gap-1 flex-shrink-0 border-r border-slate-100 bg-[#374151]">
                <div className="flex items-center gap-2 px-2 py-2 mb-3">
                  <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center">
                    <Building2 className="w-3.5 h-3.5 text-white/70" />
                  </div>
                  <span className="text-white/80 font-semibold text-sm">Coplio</span>
                </div>
                {['Tableau de bord', 'Copropriétés', 'Copropriétaires', 'Appels charges', 'Documents', 'Sinistres', 'Assemblées', 'Messagerie'].map((item, i) => (
                  <div key={item} className={`px-2 py-1.5 rounded-lg text-xs ${i === 0 ? 'bg-white/10 text-white font-medium' : 'text-white/30'}`}>
                    {item}
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div className="flex-1 p-5 lg:p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-bold text-[#374151]">Bonjour, Jean 👋</div>
                    <div className="text-xs text-slate-400">Mercredi 27 mai 2025</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center">
                      <Bell className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="w-7 h-7 bg-[#374151] rounded-full flex items-center justify-center">
                      <span className="text-white text-[9px] font-bold">JD</span>
                    </div>
                  </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  {[
                    { v: '12',    l: 'Copropriétés', c: '#374151', bg: '#F1F5F9' },
                    { v: '284',   l: 'Lots gérés',    c: '#1E40AF', bg: '#EFF6FF' },
                    { v: '3',     l: 'AG à venir',    c: '#92400E', bg: '#FEF9C3' },
                    { v: '1 400€',l: 'Impayés',       c: '#B91C1C', bg: '#FEF2F2' },
                  ].map(({ v, l, c, bg }) => (
                    <div key={l} className="rounded-2xl p-4" style={{ background: bg }}>
                      <div className="text-lg font-bold" style={{ color: c }}>{v}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{l}</div>
                    </div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-3">
                  {/* Chart */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                        Recouvrement — 6 mois
                      </div>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+12%</span>
                    </div>
                    <div className="flex items-end gap-1.5 h-16">
                      {[62, 71, 78, 74, 88, 94].map((h, i) => (
                        <div key={i} className="flex-1 rounded-md" style={{
                          height: `${h}%`,
                          background: i === 5 ? '#374151' : i === 4 ? '#64748B' : '#E2E8F0',
                        }} />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2">
                      {['Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr'].map(m => (
                        <span key={m} className="text-[9px] text-slate-300">{m}</span>
                      ))}
                    </div>
                  </div>

                  {/* Recent activity */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-50">
                    <div className="text-xs font-semibold text-slate-600 mb-3">Alertes récentes</div>
                    <div className="space-y-2">
                      {[
                        { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', text: 'Impayé · Rés. Bellevue · M. Martin', time: '10:24' },
                        { icon: Bell,          color: 'text-blue-500',  bg: 'bg-blue-50',  text: 'AG planifiée · Villa des Pins · 12 juin', time: '09:15' },
                        { icon: AlertTriangle, color: 'text-red-500',   bg: 'bg-red-50',   text: 'Sinistre déclaré · Le Clos · Lot B04', time: 'Hier' },
                      ].map(({ icon: Icon, color, bg, text, time }) => (
                        <div key={text} className="flex items-center gap-2.5">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
                            <Icon className={`w-3 h-3 ${color}`} />
                          </div>
                          <span className="text-[10px] text-slate-500 flex-1 leading-tight">{text}</span>
                          <span className="text-[9px] text-slate-300 flex-shrink-0">{time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Play overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors duration-300">
              <div className="flex flex-col items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-16 h-16 bg-white rounded-full shadow-2xl flex items-center justify-center">
                  <Play className="w-6 h-6 text-[#374151] ml-1" />
                </div>
                <span className="text-white text-sm font-semibold bg-black/40 backdrop-blur-sm px-4 py-1.5 rounded-full">
                  Explorer la démo interactive
                </span>
              </div>
            </div>

            {/* Bottom gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
              style={{ background: 'linear-gradient(to top, rgba(248,249,250,0.8), transparent)' }} />
          </div>
        </Reveal>

        {/* Footnote */}
        <Reveal delay={200} className="text-center mt-6">
          <p className="text-sm text-slate-400">
            Cliquez pour explorer chaque module · ou{' '}
            <a href="/register" className="text-[#374151] font-medium hover:underline">
              démarrez votre essai gratuit directement
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
