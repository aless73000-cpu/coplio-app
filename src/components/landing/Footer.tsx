import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#0A3D2B] text-white">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-4 gap-12 mb-16">

          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 bg-[#3CC49A] rounded-xl flex items-center justify-center">
                <span className="text-[#0A3D2B] text-xs font-bold">C</span>
              </div>
              <span className="font-bold text-xl" style={{ letterSpacing: '-0.02em' }}>Coplio</span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs mb-6">
              Le logiciel de gestion de copropriété pour syndics indépendants. Simple, moderne, efficace.
            </p>
            <a href="mailto:contact@coplio.fr" className="text-white/40 hover:text-white/70 transition-colors text-sm">
              contact@coplio.fr
            </a>
          </div>

          {/* Produit */}
          <div>
            <h4 className="font-semibold text-sm mb-5 text-white/60" style={{ letterSpacing: '0.02em' }}>Produit</h4>
            <ul className="space-y-3 text-sm text-white/35">
              <li><a href="#solutions"  className="hover:text-white/70 transition-colors">Fonctionnalités</a></li>
              <li><a href="#tarifs"     className="hover:text-white/70 transition-colors">Tarifs</a></li>
              <li><a href="#faq"        className="hover:text-white/70 transition-colors">FAQ</a></li>
              <li><Link href="/login"   className="hover:text-white/70 transition-colors">Se connecter</Link></li>
              <li><Link href="/register" className="hover:text-white/70 transition-colors">Créer un compte</Link></li>
            </ul>
          </div>

          {/* Informations */}
          <div>
            <h4 className="font-semibold text-sm mb-5 text-white/60" style={{ letterSpacing: '0.02em' }}>Informations</h4>
            <ul className="space-y-3 text-sm text-white/35">
              <li><Link href="/portail"         className="hover:text-white/70 transition-colors">Espace copropriétaire</Link></li>
              <li><a href="#qui-sommes-nous"     className="hover:text-white/70 transition-colors">Qui sommes-nous</a></li>
              <li><Link href="/cgu"             className="hover:text-white/70 transition-colors">CGU</Link></li>
              <li><Link href="/confidentialite" className="hover:text-white/70 transition-colors">Confidentialité</Link></li>
            </ul>
          </div>

        </div>

        <div className="border-t border-white/8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/25 text-xs">© {new Date().getFullYear()} Coplio. Tous droits réservés.</p>
          <p className="text-white/25 text-xs">Fait avec ❤️ en France · Données hébergées en Europe · RGPD</p>
        </div>
      </div>
    </footer>
  )
}
