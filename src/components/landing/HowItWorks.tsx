import { Home, Users, TrendingUp } from 'lucide-react'

const steps = [
  {
    n: '01',
    icon: Home,
    title: 'Créez votre cabinet',
    desc: 'Renseignez les informations de votre cabinet en 2 minutes. Ajoutez vos premières copropriétés et importez vos lots via CSV.',
  },
  {
    n: '02',
    icon: Users,
    title: 'Invitez vos copropriétaires',
    desc: 'Envoyez des invitations par email. Chaque copropriétaire reçoit un lien magique pour accéder à son espace — sans mot de passe.',
  },
  {
    n: '03',
    icon: TrendingUp,
    title: 'Pilotez en temps réel',
    desc: 'Suivez impayés, sinistres et assemblées depuis votre tableau de bord. Générez vos rapports PDF en un clic.',
  },
]

export default function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="py-28 relative overflow-hidden" style={{ background: '#071210' }}>
      {/* Background texture */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(15,110,86,.25) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        <div className="text-center mb-20">
          <span className="inline-block text-[11px] font-bold text-[#3CC49A] uppercase tracking-[0.18em] mb-4">
            Comment ça marche
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-5 tracking-tight" style={{ letterSpacing: '-0.03em' }}>
            Opérationnel en moins<br />d&apos;une journée
          </h2>
          <p className="text-white/45 text-lg max-w-xl mx-auto">
            Pas de migration compliquée, pas de formation. Vous êtes prêt en quelques clics.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-[52px] left-[calc(16.6%+40px)] right-[calc(16.6%+40px)] h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(60,196,154,.3) 20%, rgba(60,196,154,.3) 80%, transparent)' }} />

          {steps.map(({ n, icon: Icon, title, desc }) => (
            <div key={n} className="relative group">
              <div className="rounded-3xl p-8 border border-white/[0.07] hover:border-[#3CC49A]/30 transition-all duration-300"
                style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}>
                {/* Step number badge */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(60,196,154,0.15)' }}>
                    <Icon className="w-5 h-5 text-[#3CC49A]" />
                  </div>
                  <span className="text-[#3CC49A]/50 text-xs font-bold tracking-widest">{n}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-3" style={{ letterSpacing: '-0.015em' }}>{title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
