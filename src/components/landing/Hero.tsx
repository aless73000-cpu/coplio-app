import Link from 'next/link'
import {
  Home, Building2, Users, FileText,
  ArrowRight, Zap, BarChart3, Bell,
  Receipt, AlertTriangle, CalendarDays, TrendingUp,
  CheckCircle2,
} from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-[66px] overflow-hidden" style={{ background: '#0B5E46' }}>

      {/* Mesh gradient orbs — will-change:transform → GPU layer, évite le repaint CPU */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="orb  absolute top-[-10%] left-[-5%] w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(159,225,203,.30) 0%, transparent 65%)', willChange: 'transform, opacity' }} />
        <div className="orb2 absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(15,110,86,.55) 0%, transparent 65%)', willChange: 'transform, opacity' }} />
        <div className="orb3 absolute top-[40%] right-[25%] w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,.06) 0%, transparent 70%)', willChange: 'transform, opacity' }} />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.035]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">

          {/* ── Left column ── */}
          <div className="fade-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-white/90 text-xs sm:text-sm mb-8 backdrop-blur-sm max-w-full">
              <Zap className="w-3.5 h-3.5 text-[#9FE1CB] flex-shrink-0" />
              <span className="truncate">Nouveau · Import CSV &amp; portail copropriétaire</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.6rem] xl:text-6xl font-bold text-white leading-[1.08] mb-6 tracking-tight">
              La gestion de<br />
              copropriété,{' '}
              <span className="text-[#9FE1CB]">enfin simple</span>
            </h1>

            <p className="text-lg text-white/68 leading-relaxed mb-10 max-w-[480px]">
              Coplio centralise copropriétés, copropriétaires, charges, sinistres et assemblées générales dans une seule plateforme pensée pour les syndics indépendants.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link href="/register"
                className="flex items-center justify-center gap-2 bg-white text-[#0F6E56] font-bold px-7 py-4 rounded-2xl hover:bg-[#E5F5EF] transition-all text-base shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-black/25 hover:-translate-y-0.5">
                Démarrer gratuitement <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#tarifs"
                className="flex items-center justify-center gap-2 border border-white/25 bg-white/8 text-white font-medium px-7 py-4 rounded-2xl hover:bg-white/15 transition-all text-base backdrop-blur-sm">
                Voir les tarifs
              </a>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-white/50 text-sm">
              {['14 jours gratuits', 'Sans carte bancaire', 'Sans engagement'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#9FE1CB]" /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* ── Right column — browser + floating cards ── */}
          <div className="hidden lg:block relative fade-up-2">

            {/* Floating card 1 — Recouvrement */}
            <div className="float-a absolute -left-14 top-6 z-20 bg-white rounded-2xl shadow-2xl shadow-black/15 p-4 w-48 border border-gray-100/50">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 bg-[#E5F5EF] rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-[#0F6E56]" />
                </div>
                <span className="text-xs font-bold text-gray-700">Recouvrement</span>
              </div>
              <div className="text-3xl font-bold text-[#0F6E56] mb-0.5">94%</div>
              <div className="text-xs text-gray-400">Ce mois-ci</div>
              <div className="mt-2.5 flex gap-0.5 items-end h-6">
                {[60, 72, 68, 85, 79, 94].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm" style={{
                    height: `${h}%`,
                    background: i === 5 ? '#0F6E56' : i >= 4 ? '#6DC5A8' : '#E5F5EF',
                  }} />
                ))}
              </div>
            </div>

            {/* Floating card 2 — AG */}
            <div className="float-b absolute -right-10 top-12 z-20 bg-white rounded-2xl shadow-2xl shadow-black/15 p-4 w-52 border border-gray-100/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
                  <CalendarDays className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <span className="text-xs font-bold text-gray-700">Prochaine AG</span>
              </div>
              <div className="text-sm font-semibold text-[#1D1D1F] mb-0.5">Résidence Bellevue</div>
              <div className="text-xs text-gray-400 mb-2">Convocations envoyées ✓</div>
              <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 text-[10px] font-bold px-2.5 py-1 rounded-full">
                <Bell className="w-2.5 h-2.5" /> J-12
              </div>
            </div>

            {/* Floating card 3 — Lots */}
            <div className="float-c absolute -right-6 bottom-10 z-20 bg-[#0F6E56] rounded-2xl shadow-2xl shadow-[#0F6E56]/30 p-4 w-40">
              <div className="text-[#9FE1CB] text-xs font-semibold mb-1.5">Lots gérés</div>
              <div className="text-4xl font-bold text-white leading-none mb-0.5">87</div>
              <div className="text-white/50 text-xs">5 copropriétés</div>
            </div>

            {/* Browser window */}
            <div className="relative bg-white/12 backdrop-blur-sm border border-white/20 rounded-2xl p-2 shadow-2xl shadow-black/25">
              <div className="bg-[#F5F5F7] rounded-xl overflow-hidden">
                {/* Browser chrome */}
                <div className="bg-white px-4 py-2.5 flex items-center gap-3 border-b border-gray-100">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-md px-3 py-1 text-[11px] text-gray-400 text-center max-w-[200px] mx-auto">
                    app.coplio.fr/dashboard
                  </div>
                </div>

                {/* App UI */}
                <div className="flex h-[280px]">
                  {/* Sidebar */}
                  <div className="w-[168px] bg-[#0F6E56] p-3 flex flex-col gap-0.5 flex-shrink-0">
                    <div className="flex items-center gap-2 px-2 py-2 mb-2">
                      <div className="w-5 h-5 bg-white rounded-md flex items-center justify-center">
                        <Home className="w-3 h-3 text-[#0F6E56]" />
                      </div>
                      <span className="text-white font-bold text-sm">Coplio</span>
                    </div>
                    {[
                      { icon: BarChart3,    label: 'Tableau de bord', active: true },
                      { icon: Building2,   label: 'Copropriétés' },
                      { icon: Users,       label: 'Copropriétaires' },
                      { icon: Receipt,     label: 'Appels de charges' },
                      { icon: FileText,    label: 'Documents' },
                      { icon: AlertTriangle, label: 'Sinistres' },
                    ].map(({ icon: Icon, label, active }) => (
                      <div key={label} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${active ? 'bg-white/20' : ''}`}>
                        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? 'text-white' : 'text-white/40'}`} />
                        <span className={`text-[11px] ${active ? 'text-white font-semibold' : 'text-white/40'}`}>{label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 p-4 space-y-3 overflow-hidden">
                    <div className="text-xs font-bold text-[#1D1D1F]">Bonjour, Jean 👋</div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { v: '12',   l: 'Copropriétés', c: 'text-[#0F6E56]', bg: 'bg-[#E5F5EF]' },
                        { v: '284',  l: 'Lots',          c: 'text-blue-600',  bg: 'bg-blue-50' },
                        { v: '2',    l: 'Impayés',       c: 'text-red-500',   bg: 'bg-red-50' },
                      ].map(({ v, l, c, bg }) => (
                        <div key={l} className={`${bg} rounded-xl p-2.5`}>
                          <div className={`text-lg font-bold ${c}`}>{v}</div>
                          <div className="text-[9px] text-gray-500">{l}</div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white rounded-xl p-2.5 border border-gray-100">
                      <div className="text-[10px] font-semibold text-gray-500 mb-2">Recouvrement — 6 mois</div>
                      <div className="flex items-end gap-1 h-12">
                        {[62, 74, 69, 83, 77, 94].map((h, i) => (
                          <div key={i} className="flex-1 rounded-sm" style={{
                            height: `${h}%`,
                            background: i === 5 ? '#0F6E56' : i >= 4 ? '#6DC5A8' : '#E5F5EF',
                          }} />
                        ))}
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-2.5 border border-gray-100">
                      <div className="text-[10px] font-semibold text-gray-500 mb-1.5">Activité récente</div>
                      {['AG planifiée · Résidence Bellevue', 'Charge réglée · M. Martin', 'Sinistre clôturé · Dégât eaux'].map((t) => (
                        <div key={t} className="flex items-center gap-1.5 mb-1">
                          <div className="w-1 h-1 rounded-full bg-[#0F6E56] flex-shrink-0" />
                          <span className="text-[9px] text-gray-400">{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave SVG */}
      <div className="absolute bottom-0 left-0 right-0 leading-[0]">
        <svg viewBox="0 0 1440 64" xmlns="http://www.w3.org/2000/svg" className="w-full block fill-white">
          <path d="M0,64 C480,0 960,0 1440,64 L1440,64 L0,64 Z" />
        </svg>
      </div>
    </section>
  )
}
