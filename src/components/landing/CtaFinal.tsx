import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function CtaFinal() {
  return (
    <section className="relative py-40 overflow-hidden" style={{ background: '#08090A' }}>
      {/* Subtle glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(99,102,241,.07) 0%, transparent 70%)',
      }} />

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">

        <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-6" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Commencer
        </p>

        <h2
          className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6"
          style={{ letterSpacing: '-0.04em', lineHeight: 1.05 }}
        >
          Prêt à simplifier<br />votre gestion ?
        </h2>

        <p className="text-lg mb-12 max-w-lg mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.36)' }}>
          14 jours d&apos;essai gratuit. Sans engagement, sans carte bancaire.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="flex items-center gap-2 bg-white text-[#08090A] font-semibold px-8 py-4 rounded-full hover:bg-slate-100 transition-all text-base hover:-translate-y-0.5 shadow-2xl shadow-black/60"
            style={{ letterSpacing: '-0.01em' }}
          >
            Créer mon compte gratuitement <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="transition-colors text-base px-6 py-4 rounded-full hover:bg-white/5"
            style={{ color: 'rgba(255,255,255,0.30)' }}
          >
            J&apos;ai déjà un compte
          </Link>
        </div>

        <p className="mt-10 text-xs" style={{ color: 'rgba(255,255,255,0.18)' }}>
          contact@coplio.fr · Réponse sous 24h · RGPD · Données hébergées en Europe
        </p>

      </div>
    </section>
  )
}
