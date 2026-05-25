import {
  Building2, Users, FileText,
  Check, BarChart3, Receipt,
  AlertTriangle, CalendarDays,
} from 'lucide-react'

export default function BentoFeatures() {
  return (
    <section id="solutions" className="py-24 bg-[#F5F5F7]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-[11px] font-bold text-[#0F6E56] uppercase tracking-[0.18em]">Fonctionnalités</span>
          <h2 className="text-4xl font-bold text-[#1D1D1F] mt-3 mb-4 tracking-tight">
            Tout ce dont un syndic a besoin
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Une plateforme complète pensée pour l&apos;efficacité au quotidien — de la gestion courante aux situations d&apos;urgence.
          </p>
        </div>

        {/* Bento grid — 3 cols */}
        <div className="grid md:grid-cols-3 gap-4">

          {/* ① Dashboard — wide (col-span-2) */}
          <div className="md:col-span-2 bg-white rounded-3xl border border-gray-100 overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="p-7 pb-4">
              <div className="w-11 h-11 bg-[#E5F5EF] rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#0F6E56] transition-colors">
                <BarChart3 className="w-5 h-5 text-[#0F6E56] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-[#1D1D1F] mb-2">Tableau de bord & rapports PDF</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-lg">
                Visualisez l&apos;état de tout votre portefeuille en un coup d&apos;œil. KPIs, graphiques de recouvrement, alertes prioritaires — et générez vos rapports en un clic.
              </p>
            </div>
            {/* Mini dashboard preview */}
            <div className="mx-6 bg-[#F5F5F7] rounded-t-2xl p-4 overflow-hidden border-t-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                {[
                  { v: '12',    l: 'Copropriétés', c: 'text-[#0F6E56]' },
                  { v: '284',   l: 'Lots',          c: 'text-blue-600' },
                  { v: '3',     l: 'AG à venir',    c: 'text-amber-600' },
                  { v: '1.4k€', l: 'Impayés',       c: 'text-red-500' },
                ].map(({ v, l, c }) => (
                  <div key={l} className="bg-white rounded-xl p-3 border border-gray-50 shadow-sm">
                    <div className={`text-lg font-bold ${c}`}>{v}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{l}</div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl p-3 border border-gray-50 shadow-sm">
                <div className="text-[11px] font-semibold text-gray-500 mb-2">Taux de recouvrement — 6 mois</div>
                <div className="flex items-end gap-1.5 h-14">
                  {[62, 71, 78, 74, 88, 94].map((h, i) => (
                    <div key={i} className="flex-1 rounded-md transition-all duration-300" style={{
                      height: `${h}%`,
                      background: i === 5 ? '#0F6E56' : i >= 4 ? '#6DC5A8' : '#E5F5EF',
                    }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ② Portail copropriétaire — green card */}
          <div className="bg-[#0F6E56] rounded-3xl p-7 flex flex-col group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center mb-5">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Portail copropriétaire</h3>
            <p className="text-white/65 text-sm leading-relaxed flex-1">
              Offrez à vos copropriétaires un espace dédié pour consulter charges, documents et sinistres — accessible 24h/24, sans mot de passe à retenir.
            </p>
            <div className="mt-6 bg-white/10 rounded-2xl p-4 space-y-2">
              {[
                { label: 'Q1 2025 · 420 €', badge: 'Payé ✓',    badgeColor: 'bg-[#9FE1CB] text-[#0F6E56]' },
                { label: 'Q2 2025 · 435 €', badge: 'À venir',   badgeColor: 'bg-white/20 text-white/70' },
              ].map(({ label, badge, badgeColor }) => (
                <div key={label} className="flex items-center justify-between bg-white/10 rounded-xl px-3.5 py-2.5">
                  <span className="text-white/70 text-xs">{label}</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ③ Appels de charges */}
          <div className="bg-white rounded-3xl border border-gray-100 p-7 group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-11 h-11 bg-[#E5F5EF] rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#0F6E56] transition-colors">
              <Receipt className="w-5 h-5 text-[#0F6E56] group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-[#1D1D1F] mb-2">Appels de charges & impayés</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-5">
              Émettez vos appels de fonds, suivez les paiements et relancez automatiquement les copropriétaires en retard.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-400">Recouvrement</span>
                <span className="font-bold text-[#0F6E56]">78 %</span>
              </div>
              <div className="w-full bg-[#E5F5EF] rounded-full h-2">
                <div className="bg-[#0F6E56] h-2 rounded-full transition-all" style={{ width: '78%' }} />
              </div>
              <p className="text-[10px] text-gray-400">Taux moyen sur le portefeuille</p>
            </div>
          </div>

          {/* ④ AG */}
          <div className="bg-white rounded-3xl border border-gray-100 p-7 group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-11 h-11 bg-amber-50 rounded-2xl flex items-center justify-center mb-5">
              <CalendarDays className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-[#1D1D1F] mb-2">Assemblées générales</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-5">
              Préparez ordres du jour, envoyez les convocations, archivez les PV — tout dans Coplio, rien à jongler.
            </p>
            <div className="space-y-2">
              {[
                { step: '01 · Planification',  done: true },
                { step: '02 · Convocations',   done: true },
                { step: '03 · Votes',          done: true },
                { step: '04 · PV archivé',     done: false },
              ].map(({ step, done }) => (
                <div key={step} className="flex items-center gap-2.5">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-[#E5F5EF]' : 'bg-gray-100'}`}>
                    {done && <Check className="w-2.5 h-2.5 text-[#0F6E56]" />}
                  </div>
                  <span className={`text-xs ${done ? 'text-gray-600' : 'text-gray-300'}`}>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ⑤ Sinistres */}
          <div className="bg-white rounded-3xl border border-gray-100 p-7 group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-11 h-11 bg-red-50 rounded-2xl flex items-center justify-center mb-5">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-[#1D1D1F] mb-2">Sinistres & travaux</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-5">
              Déclarez, suivez et clôturez chaque sinistre étape par étape — des premières constatations jusqu&apos;à la résolution.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Signalé',  color: 'bg-amber-50 text-amber-700' },
                { label: 'En cours', color: 'bg-blue-50 text-blue-700' },
                { label: 'Clôturé', color: 'bg-[#E5F5EF] text-[#0F6E56]' },
              ].map(({ label, color }) => (
                <div key={label} className={`${color} rounded-xl px-2 py-2 text-center`}>
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
