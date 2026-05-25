import {
  Building2, Users, FileText,
  Check, BarChart3, Receipt,
  AlertTriangle, CalendarDays,
} from 'lucide-react'

export default function BentoFeatures() {
  return (
    <section id="solutions" className="py-28 bg-[#F7F7F8]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-[11px] font-bold text-[#0F6E56] uppercase tracking-[0.18em]">Fonctionnalités</span>
          <h2 className="text-4xl md:text-5xl font-bold text-[#1D1D1F] mt-3 mb-4 tracking-tight" style={{ letterSpacing: '-0.03em' }}>
            Tout ce dont un syndic a besoin
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Une plateforme complète pensée pour l&apos;efficacité au quotidien — de la gestion courante aux situations d&apos;urgence.
          </p>
        </div>

        {/* Bento grid — 3 cols */}
        <div className="grid md:grid-cols-3 gap-4">

          {/* ① Dashboard — wide (col-span-2) */}
          <div className="md:col-span-2 bg-white rounded-3xl overflow-hidden group hover:-translate-y-1.5 transition-all duration-300"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 12px 40px rgba(0,0,0,0.08)' }}>
            <div className="p-8 pb-4">
              <div className="w-12 h-12 bg-[#E5F5EF] rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#0F6E56] transition-colors duration-200">
                <BarChart3 className="w-6 h-6 text-[#0F6E56] group-hover:text-white transition-colors duration-200" />
              </div>
              <h3 className="text-xl font-bold text-[#1D1D1F] mb-2" style={{ letterSpacing: '-0.015em' }}>Tableau de bord & rapports PDF</h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-lg">
                Visualisez l&apos;état de tout votre portefeuille en un coup d&apos;œil. KPIs, graphiques de recouvrement, alertes prioritaires — et générez vos rapports en un clic.
              </p>
            </div>
            {/* Mini dashboard preview */}
            <div className="mx-6 bg-[#F7F7F8] rounded-t-2xl p-4 overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                {[
                  { v: '12',    l: 'Copropriétés', c: 'text-[#0F6E56]', bg: 'bg-[#E5F5EF]' },
                  { v: '284',   l: 'Lots',          c: 'text-blue-600',  bg: 'bg-blue-50' },
                  { v: '3',     l: 'AG à venir',    c: 'text-amber-600', bg: 'bg-amber-50' },
                  { v: '1.4k€', l: 'Impayés',       c: 'text-red-500',   bg: 'bg-red-50' },
                ].map(({ v, l, c, bg }) => (
                  <div key={l} className={`${bg} rounded-xl p-3`}>
                    <div className={`text-lg font-bold ${c}`}>{v}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{l}</div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl p-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div className="text-[11px] font-semibold text-gray-400 mb-2">Taux de recouvrement — 6 mois</div>
                <div className="flex items-end gap-1.5 h-14">
                  {[62, 71, 78, 74, 88, 94].map((h, i) => (
                    <div key={i} className="flex-1 rounded-md" style={{
                      height: `${h}%`,
                      background: i === 5 ? '#0F6E56' : i >= 4 ? '#6DC5A8' : '#E5F5EF',
                    }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ② Portail copropriétaire — green card */}
          <div className="rounded-3xl p-8 flex flex-col group hover:-translate-y-1.5 transition-all duration-300"
            style={{ background: 'linear-gradient(145deg, #0F6E56 0%, #0a5240 100%)', boxShadow: '0 2px 8px rgba(15,110,86,0.2), 0 12px 40px rgba(15,110,86,0.25)' }}>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-5">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2" style={{ letterSpacing: '-0.015em' }}>Portail copropriétaire</h3>
            <p className="text-white/60 text-sm leading-relaxed flex-1">
              Offrez à vos copropriétaires un espace dédié pour consulter charges, documents et sinistres — accessible 24h/24, sans mot de passe à retenir.
            </p>
            <div className="mt-6 space-y-2">
              {[
                { label: 'Q1 2025 · 420 €', badge: 'Payé ✓',  badgeColor: 'bg-[#3CC49A]/20 text-[#9FE1CB]' },
                { label: 'Q2 2025 · 435 €', badge: 'À venir', badgeColor: 'bg-white/10 text-white/50' },
              ].map(({ label, badge, badgeColor }) => (
                <div key={label} className="flex items-center justify-between bg-white/[0.08] rounded-xl px-4 py-2.5">
                  <span className="text-white/60 text-xs">{label}</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ③ Appels de charges */}
          <div className="bg-white rounded-3xl p-8 group hover:-translate-y-1.5 transition-all duration-300"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.06)' }}>
            <div className="w-12 h-12 bg-[#E5F5EF] rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#0F6E56] transition-colors duration-200">
              <Receipt className="w-6 h-6 text-[#0F6E56] group-hover:text-white transition-colors duration-200" />
            </div>
            <h3 className="text-lg font-bold text-[#1D1D1F] mb-2" style={{ letterSpacing: '-0.015em' }}>Appels de charges & impayés</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Émettez vos appels de fonds, suivez les paiements et relancez automatiquement les copropriétaires en retard.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-400">Recouvrement</span>
                <span className="font-bold text-[#0F6E56]">78 %</span>
              </div>
              <div className="w-full bg-[#E5F5EF] rounded-full h-2.5">
                <div className="bg-[#0F6E56] h-2.5 rounded-full" style={{ width: '78%' }} />
              </div>
              <p className="text-[10px] text-gray-400">Taux moyen sur le portefeuille</p>
            </div>
          </div>

          {/* ④ AG */}
          <div className="bg-white rounded-3xl p-8 group hover:-translate-y-1.5 transition-all duration-300"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.06)' }}>
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-5">
              <CalendarDays className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-[#1D1D1F] mb-2" style={{ letterSpacing: '-0.015em' }}>Assemblées générales</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Préparez ordres du jour, envoyez les convocations, archivez les PV — tout dans Coplio, rien à jongler.
            </p>
            <div className="space-y-2.5">
              {[
                { step: '01 · Planification',  done: true },
                { step: '02 · Convocations',   done: true },
                { step: '03 · Votes',          done: true },
                { step: '04 · PV archivé',     done: false },
              ].map(({ step, done }) => (
                <div key={step} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-[#0F6E56]' : 'bg-gray-100'}`}>
                    {done && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-xs font-medium ${done ? 'text-gray-600' : 'text-gray-300'}`}>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ⑤ Sinistres */}
          <div className="bg-white rounded-3xl p-8 group hover:-translate-y-1.5 transition-all duration-300"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.06)' }}>
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-5">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-[#1D1D1F] mb-2" style={{ letterSpacing: '-0.015em' }}>Sinistres & travaux</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Déclarez, suivez et clôturez chaque sinistre étape par étape — des premières constatations jusqu&apos;à la résolution.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Signalé',  color: 'bg-amber-50 text-amber-700 border border-amber-100' },
                { label: 'En cours', color: 'bg-blue-50 text-blue-700 border border-blue-100' },
                { label: 'Clôturé', color: 'bg-[#E5F5EF] text-[#0F6E56] border border-[#0F6E56]/10' },
              ].map(({ label, color }) => (
                <div key={label} className={`${color} rounded-xl px-2 py-2.5 text-center`}>
                  <span className="text-[10px] font-bold">{label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
