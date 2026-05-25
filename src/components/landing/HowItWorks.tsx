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
    <section id="comment-ca-marche" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-[11px] font-bold text-[#0F6E56] uppercase tracking-[0.18em]">Comment ça marche</span>
          <h2 className="text-4xl font-bold text-[#1D1D1F] mt-3 mb-4 tracking-tight">
            Opérationnel en moins d&apos;une journée
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Pas de migration compliquée, pas de formation. Vous êtes prêt en quelques clics.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10 relative">
          {/* Connecting dots */}
          <div className="hidden md:block absolute top-[52px] left-[calc(16.6%+32px)] right-[calc(16.6%+32px)] h-px bg-gradient-to-r from-[#E5F5EF] via-[#0F6E56]/40 to-[#E5F5EF]" />

          {steps.map(({ n, icon: Icon, title, desc }) => (
            <div key={n} className="flex flex-col items-center text-center relative">
              <div className="relative mb-6">
                <div className="w-[104px] h-[104px] bg-[#F5F5F7] rounded-3xl flex items-center justify-center">
                  <Icon className="w-10 h-10 text-[#0F6E56]" />
                </div>
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-[#0F6E56] rounded-full flex items-center justify-center shadow-lg shadow-[#0F6E56]/30">
                  <span className="text-white text-[11px] font-bold">{n.slice(1)}</span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-[#1D1D1F] mb-3">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
