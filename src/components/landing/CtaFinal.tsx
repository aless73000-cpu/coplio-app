import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function CtaFinal() {
  return (
    <section className="py-32 bg-white">
      <div className="max-w-3xl mx-auto px-6 text-center">

        <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.18em] mb-6">Commencer</p>

        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#374151] mb-6" style={{ letterSpacing: '-0.04em', lineHeight: 1.05 }}>
          Prêt à simplifier<br />votre gestion ?
        </h2>

        <p className="text-lg text-slate-400 mb-12 max-w-lg mx-auto leading-relaxed">
          14 jours d&apos;essai gratuit. Sans engagement, sans carte bancaire.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="flex items-center gap-2 bg-[#374151] text-white font-semibold px-8 py-4 rounded-full hover:bg-[#4B5563] transition-all text-base hover:-translate-y-0.5 shadow-xl shadow-black/10"
            style={{ letterSpacing: '-0.01em' }}
          >
            Créer mon compte gratuitement <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="text-slate-400 hover:text-[#374151] transition-colors text-base px-6 py-4">
            J&apos;ai déjà un compte
          </Link>
        </div>

        <p className="mt-10 text-xs text-slate-300">
          contact@coplio.fr · Réponse sous 24h · RGPD · Données hébergées en Europe
        </p>

      </div>
    </section>
  )
}
