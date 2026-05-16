import Link from 'next/link'
import { ArrowRight, Star, Mail, Clock, Shield } from 'lucide-react'

export default function CtaFinal() {
  return (
    <section className="py-24 bg-[#0F6E56] relative overflow-hidden">
      {/* Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,.08) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(159,225,203,.15) 0%, transparent 70%)' }} />

      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-white/80 text-sm mb-8">
          <Star className="w-3.5 h-3.5 text-[#9FE1CB]" />
          Offre de lancement · prix bloqué à vie
        </div>

        <h2 className="text-4xl md:text-5xl font-bold text-white mb-5 tracking-tight">
          Prêt à simplifier<br />votre gestion ?
        </h2>
        <p className="text-white/65 text-lg mb-12 max-w-lg mx-auto leading-relaxed">
          Démarrez votre essai gratuit de 14 jours. Sans engagement, sans carte bancaire.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <Link
            href="/register"
            className="flex items-center gap-2 bg-white text-[#0F6E56] font-bold px-8 py-4 rounded-2xl hover:bg-[#E1F5EE] transition-all text-base shadow-xl shadow-black/20 hover:-translate-y-0.5 w-full sm:w-auto justify-center"
          >
            Créer mon compte gratuitement <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="border border-white/25 bg-white/8 text-white font-medium px-8 py-4 rounded-2xl hover:bg-white/15 transition-all text-base w-full sm:w-auto text-center backdrop-blur-sm"
          >
            J&apos;ai déjà un compte
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-white/45 text-sm">
          <a href="mailto:contact@coplio.fr" className="flex items-center gap-2 hover:text-white/75 transition-colors">
            <Mail className="w-4 h-4" /> contact@coplio.fr
          </a>
          <span className="hidden sm:block">·</span>
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4" /> Réponse sous 24h ouvrées
          </span>
          <span className="hidden sm:block">·</span>
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4" /> RGPD · Données en Europe
          </span>
        </div>
      </div>
    </section>
  )
}
