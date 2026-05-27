import { BarChart3, Users, Receipt, CalendarDays, AlertTriangle, FileText, Check } from 'lucide-react'
import { Reveal } from './Reveal'

export default function BentoFeatures() {
  return (
    <section id="solutions" className="py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6">

        <Reveal className="max-w-2xl mb-20">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.18em] mb-4">Fonctionnalités</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#374151] mb-5" style={{ letterSpacing: '-0.03em', lineHeight: 1.08 }}>
            Tout ce dont un<br />syndic a besoin
          </h2>
          <p className="text-lg text-slate-400 leading-relaxed">
            Une plateforme complète pensée pour l&apos;efficacité au quotidien.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-5">

          {/* Dashboard — large */}
          <Reveal delay={100} className="md:col-span-2">
            <div className="h-full rounded-3xl p-8 border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-black/[0.05] hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-11 h-11 bg-[#374151] rounded-2xl flex items-center justify-center mb-6">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#374151] mb-2" style={{ letterSpacing: '-0.02em' }}>Tableau de bord & rapports</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm">
                KPIs, graphiques de recouvrement et alertes intelligentes. Export PDF en un clic.
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { v: '12',   l: 'Copropriétés', bg: '#F1F5F9', c: '#374151' },
                  { v: '284',  l: 'Lots',          bg: '#EFF6FF', c: '#1E40AF' },
                  { v: '3',    l: 'AG à venir',    bg: '#FEF9C3', c: '#92400E' },
                  { v: '1.4k', l: 'Impayés €',     bg: '#FEF2F2', c: '#B91C1C' },
                ].map(({ v, l, bg, c }) => (
                  <div key={l} className="rounded-xl p-3" style={{ background: bg }}>
                    <div className="text-base font-bold" style={{ color: c }}>{v}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Portail — dark */}
          <Reveal delay={200}>
            <div className="h-full rounded-3xl p-8 flex flex-col hover:-translate-y-1 transition-all duration-300" style={{ background: '#374151' }}>
              <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2" style={{ letterSpacing: '-0.02em' }}>Portail copropriétaire</h3>
              <p className="text-white/40 text-sm leading-relaxed flex-1">
                Espace dédié accessible 24h/24, sans mot de passe à retenir.
              </p>
              <div className="mt-8 space-y-2">
                {['Charges & documents', 'Messagerie directe', 'Suivi sinistres', 'Votes en ligne'].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-white/50 text-xs">
                    <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-slate-300" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Petites tuiles */}
          {[
            { icon: Receipt,       title: 'Appels de charges',    desc: 'Émettez et suivez les paiements. Relances automatiques dès le premier retard.' },
            { icon: CalendarDays,  title: 'Assemblées générales', desc: 'Convocations, votes, procès-verbaux — tout dans Coplio.' },
            { icon: AlertTriangle, title: 'Sinistres',            desc: 'Déclarez et pilotez chaque dossier de sinistre de A à Z.' },
            { icon: FileText,      title: 'Documents',            desc: 'Archivage sécurisé, partagé directement avec vos copropriétaires.' },
          ].map(({ icon: Icon, title, desc }, i) => (
            <Reveal key={title} delay={i * 80 + 100}>
              <div className="h-full rounded-3xl p-8 border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-black/[0.05] hover:-translate-y-1 transition-all duration-300">
                <div className="w-11 h-11 bg-slate-100 rounded-2xl flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-slate-500" />
                </div>
                <h3 className="text-base font-bold text-[#374151] mb-2" style={{ letterSpacing: '-0.015em' }}>{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            </Reveal>
          ))}

        </div>
      </div>
    </section>
  )
}
