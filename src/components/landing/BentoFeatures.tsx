import { BarChart3, Users, Receipt, CalendarDays, AlertTriangle, FileText, Check } from 'lucide-react'

const features = [
  {
    icon: BarChart3,
    title: 'Tableau de bord',
    desc: 'KPIs, graphiques de recouvrement et alertes — tout votre portefeuille d\'un coup d\'œil.',
    accent: false,
    wide: true,
  },
  {
    icon: Users,
    title: 'Portail copropriétaire',
    desc: 'Espace dédié accessible 24h/24 sans mot de passe.',
    accent: true,
    wide: false,
  },
  {
    icon: Receipt,
    title: 'Appels de charges',
    desc: 'Émettez et suivez les paiements. Relances automatiques.',
    accent: false,
    wide: false,
  },
  {
    icon: CalendarDays,
    title: 'Assemblées générales',
    desc: 'Convocations, votes, PV — tout dans Coplio.',
    accent: false,
    wide: false,
  },
  {
    icon: AlertTriangle,
    title: 'Sinistres',
    desc: 'Déclarez et suivez chaque sinistre de A à Z.',
    accent: false,
    wide: false,
  },
  {
    icon: FileText,
    title: 'Documents',
    desc: 'Archivage sécurisé partagé avec les copropriétaires.',
    accent: false,
    wide: false,
  },
]

export default function BentoFeatures() {
  return (
    <section id="solutions" className="py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <div className="max-w-2xl mb-20">
          <p className="text-xs font-semibold text-[#0A3D2B] uppercase tracking-[0.18em] mb-4">Fonctionnalités</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-[#1D1D1F] mb-5" style={{ letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Tout ce dont un syndic a besoin
          </h2>
          <p className="text-lg text-gray-400 leading-relaxed">
            Une plateforme complète pensée pour l&apos;efficacité au quotidien.
          </p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-3 gap-5">

          {/* Feature 1 — Large */}
          <div className="md:col-span-2 rounded-3xl p-8 border border-gray-100 bg-[#FAFAFA] hover:bg-white hover:shadow-xl hover:shadow-black/[0.06] hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-11 h-11 bg-[#0A3D2B] rounded-2xl flex items-center justify-center mb-6">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[#1D1D1F] mb-2" style={{ letterSpacing: '-0.02em' }}>Tableau de bord & rapports</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-sm">
              KPIs, graphiques de recouvrement et alertes intelligentes — tout votre portefeuille d&apos;un coup d&apos;œil. Export PDF en un clic.
            </p>
            {/* Mini preview */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { v: '12',   l: 'Copropriétés', c: '#0A3D2B', bg: '#E8F5EF' },
                { v: '284',  l: 'Lots',          c: '#1D4ED8', bg: '#EFF6FF' },
                { v: '3',    l: 'AG à venir',    c: '#D97706', bg: '#FEF3C7' },
                { v: '1.4k', l: 'Impayés €',     c: '#DC2626', bg: '#FEF2F2' },
              ].map(({ v, l, c, bg }) => (
                <div key={l} className="rounded-xl p-3" style={{ background: bg }}>
                  <div className="text-base font-bold" style={{ color: c }}>{v}</div>
                  <div className="text-[9px] text-gray-500 mt-0.5 leading-tight">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Feature 2 — Portail — dark */}
          <div className="rounded-3xl p-8 flex flex-col hover:-translate-y-1 transition-all duration-300"
            style={{ background: '#0A3D2B' }}>
            <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2" style={{ letterSpacing: '-0.02em' }}>Portail copropriétaire</h3>
            <p className="text-white/50 text-sm leading-relaxed flex-1">
              Espace dédié accessible 24h/24, sans mot de passe à retenir.
            </p>
            <div className="mt-8 space-y-2">
              {['Charges & documents', 'Messagerie directe', 'Suivi sinistres'].map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-white/60 text-xs">
                  <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 text-[#3CC49A]" />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Features 3–6 — small tiles */}
          {[
            { icon: Receipt,       title: 'Appels de charges',    desc: 'Émettez et suivez les paiements. Relances automatiques dès le premier retard.' },
            { icon: CalendarDays,  title: 'Assemblées générales', desc: 'Convocations, votes, procès-verbaux — tout dans Coplio.' },
            { icon: AlertTriangle, title: 'Sinistres',            desc: 'Déclarez et pilotez chaque dossier de sinistre de A à Z.' },
            { icon: FileText,      title: 'Documents',            desc: 'Archivage sécurisé, partagé directement avec vos copropriétaires.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title}
              className="rounded-3xl p-8 border border-gray-100 bg-[#FAFAFA] hover:bg-white hover:shadow-xl hover:shadow-black/[0.06] hover:-translate-y-1 transition-all duration-300">
              <div className="w-11 h-11 bg-[#E8F5EF] rounded-2xl flex items-center justify-center mb-5">
                <Icon className="w-5 h-5 text-[#0A3D2B]" />
              </div>
              <h3 className="text-base font-bold text-[#1D1D1F] mb-2" style={{ letterSpacing: '-0.015em' }}>{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}

        </div>
      </div>
    </section>
  )
}
