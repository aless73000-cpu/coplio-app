import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{ background: '#0D1117' }} className="text-white">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-4 gap-12 mb-16">

          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                <span className="text-white/60 text-xs font-bold">C</span>
              </div>
              <span className="font-bold text-xl text-white/80" style={{ letterSpacing: '-0.02em' }}>Coplio</span>
            </div>
            <p className="text-white/30 text-sm leading-relaxed max-w-xs mb-6">
              Le logiciel de gestion de copropriété pour syndics indépendants. Simple, moderne, efficace.
            </p>
            <a href="mailto:contact@coplio.fr" className="text-white/30 hover:text-white/60 transition-colors text-sm">
              contact@coplio.fr
            </a>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-5 text-white/40 uppercase tracking-wider text-[11px]">Produit</h4>
            <ul className="space-y-3 text-sm text-white/25">
              {[['#solutions', 'Fonctionnalités'], ['#tarifs', 'Tarifs'], ['#faq', 'FAQ']].map(([href, label]) => (
                <li key={href}><a href={href} className="hover:text-white/60 transition-colors">{label}</a></li>
              ))}
              <li><Link href="/login"    className="hover:text-white/60 transition-colors">Se connecter</Link></li>
              <li><Link href="/register" className="hover:text-white/60 transition-colors">Créer un compte</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-5 text-white/40 uppercase tracking-wider text-[11px]">Informations</h4>
            <ul className="space-y-3 text-sm text-white/25">
              <li><Link href="/portail"         className="hover:text-white/60 transition-colors">Espace copropriétaire</Link></li>
              <li><a href="#qui-sommes-nous"     className="hover:text-white/60 transition-colors">Qui sommes-nous</a></li>
              <li><Link href="/cgu"             className="hover:text-white/60 transition-colors">CGU</Link></li>
              <li><Link href="/confidentialite" className="hover:text-white/60 transition-colors">Confidentialité</Link></li>
            </ul>
          </div>

        </div>

        <div className="border-t border-white/[0.06] pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/20 text-xs">© {new Date().getFullYear()} Coplio. Tous droits réservés.</p>
          <p className="text-white/20 text-xs">Fait avec ❤️ en France · Données hébergées en Europe · RGPD</p>
        </div>
      </div>
    </footer>
  )
}
