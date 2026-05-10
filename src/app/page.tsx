import Link from 'next/link'
import {
  Home, Building2, Users, FileText, Wrench, MessageCircle,
  ChevronRight, Check, Star, ArrowRight, Shield, Zap, Clock,
  BarChart3, Calendar, Bell, Lock, Globe, Heart
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans antialiased text-[#444441]">
      <Nav />
      <Hero />
      <SocialProof />
      <Solutions />
      <Besoins />
      <Fonctionnalites />
      <Tarifs />
      <QuiSommesNous />
      <Temoignages />
      <CtaFinal />
      <Footer />
    </div>
  )
}

/* ── Navigation ─────────────────────────────────────────────────── */
function Nav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#0F6E56] rounded-lg flex items-center justify-center">
            <Home className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl text-[#0F6E56] tracking-tight">Coplio</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm text-gray-600">
          <a href="#solutions" className="hover:text-[#0F6E56] transition-colors">Nos solutions</a>
          <a href="#besoins" className="hover:text-[#0F6E56] transition-colors">Vos besoins</a>
          <a href="#fonctionnalites" className="hover:text-[#0F6E56] transition-colors">Fonctionnalités</a>
          <a href="#tarifs" className="hover:text-[#0F6E56] transition-colors">Tarifs</a>
          <a href="#qui-sommes-nous" className="hover:text-[#0F6E56] transition-colors">Qui sommes-nous</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/portail"
            className="text-sm text-gray-600 hover:text-[#0F6E56] transition-colors hidden sm:block"
          >
            Espace copropriétaire
          </Link>
          <Link
            href="/login"
            className="text-sm bg-[#0F6E56] text-white px-4 py-2 rounded-lg hover:bg-[#0d5e49] transition-colors font-medium"
          >
            Se connecter
          </Link>
        </div>
      </div>
    </header>
  )
}

/* ── Hero ───────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden bg-[#0F6E56]">
      {/* Cercles décoratifs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-white/90 text-sm mb-8">
          <Zap className="w-3.5 h-3.5" />
          Le logiciel pensé pour les syndics indépendants
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6 max-w-4xl mx-auto">
          Gérez vos copropriétés<br />
          <span className="text-[#9FE1CB]">sans vous perdre dans la paperasse</span>
        </h1>

        <p className="text-xl text-white/75 max-w-2xl mx-auto mb-10 leading-relaxed">
          Coplio centralise la gestion de vos immeubles, vos copropriétaires, vos assemblées générales
          et vos sinistres dans une plateforme simple et moderne.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="flex items-center gap-2 bg-white text-[#0F6E56] font-semibold px-8 py-4 rounded-xl hover:bg-[#E1F5EE] transition-colors text-base"
          >
            Essayer gratuitement
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 border border-white/30 text-white font-medium px-8 py-4 rounded-xl hover:bg-white/10 transition-colors text-base"
          >
            Se connecter
          </Link>
        </div>

        <p className="text-white/50 text-sm mt-6">Sans engagement · Aucune carte bancaire requise</p>

        {/* Mockup dashboard */}
        <div className="mt-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-2 max-w-4xl mx-auto shadow-2xl">
          <div className="bg-[#F1EFE8] rounded-xl overflow-hidden">
            {/* Fake browser bar */}
            <div className="bg-white px-4 py-2.5 flex items-center gap-2 border-b border-gray-100">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-gray-100 rounded-md px-3 py-1 text-xs text-gray-400 text-center">
                app.coplio.fr/dashboard
              </div>
            </div>
            {/* Fake dashboard */}
            <div className="flex h-48">
              <div className="w-48 bg-[#0F6E56] p-3 flex flex-col gap-2 flex-shrink-0">
                <div className="bg-white/20 rounded-lg h-7" />
                {['Tableau de bord', 'Copropriétés', 'Copropriétaires', 'Documents', 'Sinistres'].map(item => (
                  <div key={item} className="flex items-center gap-2 px-2 py-1.5 rounded-md">
                    <div className="w-3 h-3 rounded bg-white/30 flex-shrink-0" />
                    <div className="text-white/70 text-xs">{item}</div>
                  </div>
                ))}
              </div>
              <div className="flex-1 p-4 grid grid-cols-3 gap-3 content-start">
                {['5 copropriétés', '87 lots', '3 sinistres'].map((label, i) => (
                  <div key={label} className={`bg-white rounded-lg p-3 shadow-sm border border-gray-100`}>
                    <div className={`w-6 h-6 rounded-md mb-2 ${i === 2 ? 'bg-red-100' : 'bg-[#E1F5EE]'}`} />
                    <div className="text-xs font-semibold text-gray-700">{label}</div>
                  </div>
                ))}
                <div className="col-span-3 bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                  <div className="text-xs font-semibold text-gray-600 mb-2">Activité récente</div>
                  <div className="space-y-1.5">
                    {['Nouvelle AG planifiée — Résidence le Bellevue', 'Charge réglée — M. Dupont', 'Sinistre clôturé — Dégât des eaux'].map(item => (
                      <div key={item} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0F6E56] flex-shrink-0" />
                        <div className="text-xs text-gray-500">{item}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Social proof ───────────────────────────────────────────────── */
function SocialProof() {
  const stats = [
    { value: '500+', label: 'Copropriétés gérées' },
    { value: '12 000+', label: 'Copropriétaires connectés' },
    { value: '98%', label: 'Taux de satisfaction' },
    { value: '< 2h', label: 'Pour être opérationnel' },
  ]
  return (
    <section className="border-b border-gray-100 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map(({ value, label }) => (
          <div key={label} className="text-center">
            <div className="text-3xl font-bold text-[#0F6E56]">{value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── Solutions ──────────────────────────────────────────────────── */
function Solutions() {
  const items = [
    {
      icon: Building2,
      title: 'Gestion des copropriétés',
      desc: 'Centralisez toutes vos résidences, lots et copropriétaires dans un seul espace clair et organisé.',
    },
    {
      icon: Users,
      title: 'Portail copropriétaire',
      desc: 'Offrez à vos copropriétaires un espace dédié pour consulter leurs charges, documents et sinistres.',
    },
    {
      icon: Calendar,
      title: 'Assemblées générales',
      desc: 'Préparez, organisez et archivez vos AG en ligne. Résolutions, votes, convocations — tout en un.',
    },
    {
      icon: Wrench,
      title: 'Sinistres & travaux',
      desc: 'Suivez chaque dossier sinistre étape par étape, des déclarations aux devis jusqu\'à la clôture.',
    },
    {
      icon: BarChart3,
      title: 'Appels de charges',
      desc: 'Gérez les appels de fonds, suivez les impayés et relancez automatiquement les copropriétaires.',
    },
    {
      icon: MessageCircle,
      title: 'Messagerie intégrée',
      desc: 'Communiquez directement avec vos copropriétaires depuis la plateforme, sans e-mails dispersés.',
    },
  ]

  return (
    <section id="solutions" className="py-24 bg-[#F1EFE8]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-[#0F6E56] uppercase tracking-wider">Nos solutions</span>
          <h2 className="text-4xl font-bold text-[#444441] mt-3 mb-4">Tout ce dont un syndic a besoin</h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Une plateforme complète pour gérer l'ensemble de votre activité de syndic, de la gestion courante aux situations d'urgence.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {items.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 bg-[#E1F5EE] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#0F6E56] transition-colors">
                <Icon className="w-6 h-6 text-[#0F6E56] group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-semibold text-[#444441] text-lg mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Vos besoins ────────────────────────────────────────────────── */
function Besoins() {
  const problems = [
    {
      problem: 'Des documents éparpillés dans des dizaines de dossiers',
      solution: 'Tous vos documents centralisés, accessibles en un clic, partagés automatiquement avec les bons copropriétaires.',
    },
    {
      problem: 'Des relances manuelles qui prennent des heures',
      solution: 'Coplio détecte les impayés et envoie des relances automatiques au bon moment, sans intervention de votre part.',
    },
    {
      problem: 'Des copropriétaires qui vous appellent pour tout',
      solution: 'Le portail copropriétaire leur donne un accès autonome à leurs informations — charges, travaux, documents, messagerie.',
    },
    {
      problem: 'Des AG laborieuses à organiser et archiver',
      solution: 'Préparez vos ordres du jour, envoyez les convocations et archivez les PV directement depuis Coplio.',
    },
  ]

  return (
    <section id="besoins" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-[#0F6E56] uppercase tracking-wider">Vos besoins</span>
          <h2 className="text-4xl font-bold text-[#444441] mt-3 mb-4">On connaît vos problèmes du quotidien</h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Coplio a été conçu avec et pour les syndics indépendants. Chaque fonctionnalité répond à un vrai besoin terrain.
          </p>
        </div>

        <div className="space-y-4 max-w-3xl mx-auto">
          {problems.map(({ problem, solution }, i) => (
            <div key={i} className="bg-[#F1EFE8] rounded-2xl p-6 border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-500 font-bold text-sm">✕</div>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#444441] mb-3">{problem}</p>
                  <div className="flex items-start gap-3 bg-white rounded-xl p-4 border border-[#E1F5EE]">
                    <div className="w-6 h-6 bg-[#E1F5EE] rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-[#0F6E56]" />
                    </div>
                    <p className="text-sm text-gray-600">{solution}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Fonctionnalités clés ───────────────────────────────────────── */
function Fonctionnalites() {
  const features = [
    { icon: Shield, label: 'Données sécurisées', desc: 'Hébergement européen, chiffrement SSL, accès par rôle.' },
    { icon: Bell, label: 'Alertes temps réel', desc: 'Soyez notifié dès qu\'un sinistre urgence ou un impayé est détecté.' },
    { icon: FileText, label: 'Documents légaux', desc: 'PV d\'AG, règlements de copropriété, fiches techniques — tout est archivé.' },
    { icon: Globe, label: 'Portail en ligne 24h/24', desc: 'Vos copropriétaires accèdent à leur espace à tout moment, depuis n\'importe où.' },
    { icon: Clock, label: 'Gain de temps réel', desc: 'Nos clients gagnent en moyenne 8h par semaine sur les tâches administratives.' },
    { icon: Lock, label: 'Accès par rôle', desc: 'Syndic, collaborateur, copropriétaire : chacun voit uniquement ce qui le concerne.' },
  ]

  return (
    <section id="fonctionnalites" className="py-24 bg-[#0F6E56]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-[#9FE1CB] uppercase tracking-wider">Fonctionnalités</span>
          <h2 className="text-4xl font-bold text-white mt-3 mb-4">Une plateforme moderne et fiable</h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Construite avec les meilleures technologies, Coplio est rapide, sécurisée et conçue pour durer.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-colors">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">{label}</h3>
              <p className="text-white/65 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Tarifs ─────────────────────────────────────────────────────── */
function Tarifs() {
  const plans = [
    {
      name: 'Starter',
      price: '99',
      desc: 'Parfait pour démarrer et gérer un petit portefeuille.',
      highlight: false,
      badge: null,
      features: [
        'Jusqu\'à 5 copropriétés',
        'Jusqu\'à 75 lots',
        'Portail copropriétaire inclus',
        'Gestion des documents',
        'Appels de charges & impayés',
        'Messagerie syndic ↔ copropriétaires',
        'Support par email',
      ],
      cta: 'Commencer gratuitement',
      href: '/register',
    },
    {
      name: 'Pro',
      price: '189',
      desc: 'Pour les syndics actifs avec un portefeuille croissant.',
      highlight: true,
      badge: 'Le plus populaire',
      features: [
        'Jusqu\'à 20 copropriétés',
        'Jusqu\'à 400 lots',
        'Tout le plan Starter',
        'Assemblées générales en ligne',
        'Suivi sinistres & travaux',
        'Relances automatiques',
        'Alertes & notifications temps réel',
        'Support prioritaire',
      ],
      cta: 'Essayer 30 jours gratuits',
      href: '/register',
    },
    {
      name: 'Cabinet',
      price: '279',
      desc: 'Pour les cabinets avec plusieurs gestionnaires.',
      highlight: false,
      badge: null,
      features: [
        'Copropriétés & lots illimités',
        'Tout le plan Pro',
        'Multi-utilisateurs (jusqu\'à 5)',
        'Rapports & exports avancés',
        'Personnalisation aux couleurs du cabinet',
        'Onboarding dédié',
        'Support téléphonique',
      ],
      cta: 'Nous contacter',
      href: '/register',
    },
  ]

  return (
    <section id="tarifs" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-[#0F6E56] uppercase tracking-wider">Tarifs</span>
          <h2 className="text-4xl font-bold text-[#444441] mt-3 mb-4">
            Simple, transparent, sans surprise
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Tous les plans incluent 30 jours d&apos;essai gratuit. Aucune carte bancaire requise.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map(({ name, price, desc, highlight, badge, features, cta, href }) => (
            <div
              key={name}
              className={`relative rounded-2xl p-8 border-2 flex flex-col ${
                highlight
                  ? 'border-[#0F6E56] bg-[#0F6E56] text-white shadow-2xl scale-105'
                  : 'border-gray-100 bg-white'
              }`}
            >
              {badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-[#9FE1CB] text-[#0F6E56] text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap">
                    {badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className={`font-bold text-xl mb-1 ${highlight ? 'text-white' : 'text-[#444441]'}`}>{name}</h3>
                <p className={`text-sm mb-4 ${highlight ? 'text-white/70' : 'text-gray-500'}`}>{desc}</p>
                <div className="flex items-end gap-1">
                  <span className={`text-5xl font-bold ${highlight ? 'text-white' : 'text-[#444441]'}`}>{price}€</span>
                  <span className={`text-sm mb-2 ${highlight ? 'text-white/60' : 'text-gray-400'}`}>/mois HT</span>
                </div>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      highlight ? 'bg-white/20' : 'bg-[#E1F5EE]'
                    }`}>
                      <Check className={`w-2.5 h-2.5 ${highlight ? 'text-white' : 'text-[#0F6E56]'}`} />
                    </div>
                    <span className={highlight ? 'text-white/85' : 'text-gray-600'}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={href}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm text-center transition-colors ${
                  highlight
                    ? 'bg-white text-[#0F6E56] hover:bg-[#E1F5EE]'
                    : 'bg-[#0F6E56] text-white hover:bg-[#0d5e49]'
                }`}
              >
                {cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          Tous les prix sont HT. TVA applicable selon votre situation.
          Vous gérez plus de 5 cabinets ?{' '}
          <a href="mailto:contact@coplio.fr" className="text-[#0F6E56] hover:underline">Contactez-nous</a>{' '}
          pour un tarif sur mesure.
        </p>
      </div>
    </section>
  )
}

/* ── Qui sommes-nous ────────────────────────────────────────────── */
function QuiSommesNous() {
  return (
    <section id="qui-sommes-nous" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-sm font-semibold text-[#0F6E56] uppercase tracking-wider">Qui sommes-nous</span>
            <h2 className="text-4xl font-bold text-[#444441] mt-3 mb-6">
              Nés de la frustration des syndics indépendants
            </h2>
            <p className="text-gray-500 leading-relaxed mb-6">
              Coplio est né d'un constat simple : les outils de gestion de copropriété existants sont trop complexes,
              trop chers, ou pensés pour les grandes structures. Les syndics indépendants méritent mieux.
            </p>
            <p className="text-gray-500 leading-relaxed mb-8">
              Notre équipe a travaillé main dans la main avec des syndics pour concevoir une solution intuitive,
              abordable et vraiment utile au quotidien. Coplio, c'est le logiciel qu'on aurait voulu avoir.
            </p>

            <div className="space-y-3">
              {[
                'Fondé en France, pour le marché français',
                'Données hébergées en Europe (RGPD)',
                'Support disponible 7j/7 par messagerie',
                'Mises à jour régulières basées sur vos retours',
              ].map(item => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-[#E1F5EE] rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-[#0F6E56]" />
                  </div>
                  <span className="text-sm text-gray-600">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#E1F5EE] rounded-2xl p-6 col-span-2">
              <Heart className="w-8 h-8 text-[#0F6E56] mb-3" />
              <h3 className="font-bold text-[#0F6E56] text-lg mb-2">Notre mission</h3>
              <p className="text-[#0F6E56]/80 text-sm leading-relaxed">
                Permettre à chaque syndic indépendant de se concentrer sur ce qui compte vraiment :
                le service à ses copropriétaires, pas l'administration.
              </p>
            </div>
            <div className="bg-[#F1EFE8] rounded-2xl p-5">
              <div className="text-3xl font-bold text-[#0F6E56] mb-1">2024</div>
              <div className="text-sm text-gray-500">Année de création</div>
            </div>
            <div className="bg-[#F1EFE8] rounded-2xl p-5">
              <div className="text-3xl font-bold text-[#0F6E56] mb-1">100%</div>
              <div className="text-sm text-gray-500">Indépendant & français</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Témoignages ────────────────────────────────────────────────── */
function Temoignages() {
  const items = [
    {
      quote: 'Avant Coplio, je passais mes soirées à répondre aux e-mails de copropriétaires. Maintenant ils ont tout sur le portail et me contactent uniquement pour des vraies urgences.',
      name: 'Marie L.',
      role: 'Syndic indépendant — Lyon',
    },
    {
      quote: 'La gestion des AG a été transformée. Je prépare l\'ordre du jour en 20 minutes et j\'envoie les convocations en un clic. Les PV sont archivés automatiquement.',
      name: 'Thomas D.',
      role: 'Cabinet de syndic — Paris',
    },
    {
      quote: 'Le suivi des sinistres est excellent. Mes copropriétaires voient l\'avancement en temps réel, ça évite des dizaines d\'appels par semaine.',
      name: 'Sophie M.',
      role: 'Syndic bénévole — Bordeaux',
    },
  ]

  return (
    <section className="py-24 bg-[#F1EFE8]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-[#0F6E56] uppercase tracking-wider">Témoignages</span>
          <h2 className="text-4xl font-bold text-[#444441] mt-3">Ils nous font confiance</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {items.map(({ quote, name, role }) => (
            <div key={name} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#0F6E56] text-[#0F6E56]" />
                ))}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-6 italic">&ldquo;{quote}&rdquo;</p>
              <div>
                <div className="font-semibold text-[#444441] text-sm">{name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── CTA final ──────────────────────────────────────────────────── */
function CtaFinal() {
  return (
    <section className="py-24 bg-[#0F6E56] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">
          Prêt à simplifier votre gestion ?
        </h2>
        <p className="text-white/70 text-lg mb-10">
          Rejoignez les syndics qui ont déjà choisi Coplio. Démarrez gratuitement, sans engagement.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="flex items-center gap-2 bg-white text-[#0F6E56] font-semibold px-8 py-4 rounded-xl hover:bg-[#E1F5EE] transition-colors text-base w-full sm:w-auto justify-center"
          >
            Créer mon compte gratuitement
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="border border-white/30 text-white font-medium px-8 py-4 rounded-xl hover:bg-white/10 transition-colors text-base w-full sm:w-auto text-center"
          >
            J'ai déjà un compte
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ── Footer ─────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="bg-[#444441] text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-[#0F6E56] rounded-lg flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">Coplio</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              Le logiciel de gestion de copropriété pour syndics indépendants. Simple, moderne, efficace.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">Produit</h4>
            <ul className="space-y-2.5 text-sm text-white/50">
              <li><a href="#solutions" className="hover:text-white transition-colors">Nos solutions</a></li>
              <li><a href="#fonctionnalites" className="hover:text-white transition-colors">Fonctionnalités</a></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Se connecter</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Créer un compte</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">Espace copropriétaire</h4>
            <ul className="space-y-2.5 text-sm text-white/50">
              <li><Link href="/portail" className="hover:text-white transition-colors">Se connecter au portail</Link></li>
              <li><a href="#qui-sommes-nous" className="hover:text-white transition-colors">Qui sommes-nous</a></li>
              <li><Link href="/cgu" className="hover:text-white transition-colors">CGU</Link></li>
              <li><Link href="/confidentialite" className="hover:text-white transition-colors">Confidentialité</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs">© {new Date().getFullYear()} Coplio. Tous droits réservés.</p>
          <p className="text-white/30 text-xs">Fait avec ❤️ en France · Données hébergées en Europe</p>
        </div>
      </div>
    </footer>
  )
}
