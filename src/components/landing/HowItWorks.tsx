import { Home, Users, TrendingUp } from 'lucide-react'

const steps = [
  {
    n: '01',
    icon: Home,
    title: 'Créez votre cabinet',
    desc: 'Renseignez les informations de votre cabinet en 2 minutes. Ajoutez vos copropriétés et importez vos lots via CSV.',
  },
  {
    n: '02',
    icon: Users,
    title: 'Invitez vos copropriétaires',
    desc: 'Envoyez des invitations par email. Chaque copropriétaire accède à son espace via un lien magique — sans mot de passe.',
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
    <section id="comment-ca-marche" className="py-32 bg-[#F7F8F7]">
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-20">
          <p className="text-xs font-semibold text-[#0A3D2B] uppercase tracking-[0.18em] mb-4">Comment ça marche</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-[#1D1D1F] mb-5" style={{ letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Opérationnel en<br />moins d&apos;une journée
          </h2>
          <p className="text-lg text-gray-400 max-w-lg mx-auto">
            Pas de migration compliquée, pas de formation. Prêt en quelques clics.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map(({ n, icon: Icon, title, desc }) => (
            <div key={n} className="bg-white rounded-3xl p-8 border border-gray-100 hover:shadow-lg hover:shadow-black/[0.05] hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#0A3D2B] rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-100" style={{ letterSpacing: '-0.03em' }}>{n}</span>
              </div>
              <h3 className="text-lg font-bold text-[#1D1D1F] mb-3" style={{ letterSpacing: '-0.015em' }}>{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
