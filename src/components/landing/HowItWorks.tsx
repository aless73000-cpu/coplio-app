import { Home, Users, TrendingUp } from 'lucide-react'
import { Reveal } from './Reveal'

const steps = [
  { n: '01', icon: Home,       title: 'Créez votre cabinet',         desc: 'Renseignez les informations de votre cabinet en 2 minutes. Ajoutez vos copropriétés et importez vos lots via CSV.' },
  { n: '02', icon: Users,      title: 'Invitez vos copropriétaires', desc: 'Envoyez des invitations par email. Chaque copropriétaire accède à son espace via un lien magique — sans mot de passe.' },
  { n: '03', icon: TrendingUp, title: 'Pilotez en temps réel',       desc: 'Suivez impayés, sinistres et assemblées depuis votre tableau de bord. Générez vos rapports PDF en un clic.' },
]

export default function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="py-32" style={{ background: '#08090A' }}>
      <div className="max-w-6xl mx-auto px-6">

        <Reveal className="text-center mb-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-4" style={{ color: 'rgba(255,255,255,0.28)' }}>
            Comment ça marche
          </p>
          <h2
            className="text-4xl sm:text-5xl font-bold text-white mb-5"
            style={{ letterSpacing: '-0.03em', lineHeight: 1.1 }}
          >
            Opérationnel en<br />moins d&apos;une journée
          </h2>
          <p className="text-lg max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.36)' }}>
            Pas de migration compliquée, pas de formation. Prêt en quelques clics.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map(({ n, icon: Icon, title, desc }, i) => (
            <Reveal key={n} delay={i * 100}>
              <div
                className="h-full rounded-3xl p-8 border hover:-translate-y-1 transition-all duration-300"
                style={{ background: 'rgba(255,255,255,0.035)', borderColor: 'rgba(255,255,255,0.07)' }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white/60" />
                  </div>
                  <span
                    className="text-3xl font-bold"
                    style={{ letterSpacing: '-0.03em', color: 'rgba(255,255,255,0.10)' }}
                  >
                    {n}
                  </span>
                </div>
                <h3
                  className="text-lg font-bold text-white mb-3"
                  style={{ letterSpacing: '-0.015em' }}
                >
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.40)' }}>
                  {desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  )
}
