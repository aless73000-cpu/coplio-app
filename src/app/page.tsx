'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  Home, Building2, Users, FileText, Wrench, MessageCircle,
  ChevronRight, Check, Star, ArrowRight, Shield, Zap, Clock,
  BarChart3, Calendar, Bell, Lock, Globe, Heart, Menu, X,
  ChevronDown, Mail, Phone
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans antialiased text-[#444441]">
      <Nav />
      <Hero />
      <LogoBar />
      <Solutions />
      <Besoins />
      <Fonctionnalites />
      <Tarifs />
      <QuiSommesNous />
      <FAQ />
      <CtaFinal />
      <Footer />
    </div>
  )
}

/* ── Navigation ─────────────────────────────────────────────────── */
function Nav() {
  const [open, setOpen] = useState(false)

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
          <a href="#solutions" className="hover:text-[#0F6E56] transition-colors">Solutions</a>
          <a href="#besoins" className="hover:text-[#0F6E56] transition-colors">Vos besoins</a>
          <a href="#tarifs" className="hover:text-[#0F6E56] transition-colors">Tarifs</a>
          <a href="#faq" className="hover:text-[#0F6E56] transition-colors">FAQ</a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/portail"
            className="text-sm text-gray-600 hover:text-[#0F6E56] transition-colors"
          >
            Espace copropriétaire
          </Link>
          <Link
            href="/login"
            className="text-sm text-gray-500 hover:text-[#444441] transition-colors"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="text-sm bg-[#0F6E56] text-white px-4 py-2 rounded-lg hover:bg-[#0d5e49] transition-colors font-medium"
          >
            Essai gratuit →
          </Link>
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-4">
          <a href="#solutions" className="block text-sm text-gray-600 hover:text-[#0F6E56]" onClick={() => setOpen(false)}>Solutions</a>
          <a href="#besoins" className="block text-sm text-gray-600 hover:text-[#0F6E56]" onClick={() => setOpen(false)}>Vos besoins</a>
          <a href="#tarifs" className="block text-sm text-gray-600 hover:text-[#0F6E56]" onClick={() => setOpen(false)}>Tarifs</a>
          <a href="#faq" className="block text-sm text-gray-600 hover:text-[#0F6E56]" onClick={() => setOpen(false)}>FAQ</a>
          <hr className="border-gray-100" />
          <Link href="/portail" className="block text-sm text-gray-600 hover:text-[#0F6E56]" onClick={() => setOpen(false)}>Espace copropriétaire</Link>
          <Link href="/login" className="block text-sm text-gray-600 hover:text-[#0F6E56]" onClick={() => setOpen(false)}>Se connecter</Link>
          <Link
            href="/register"
            className="block text-sm bg-[#0F6E56] text-white px-4 py-3 rounded-lg hover:bg-[#0d5e49] transition-colors font-medium text-center"
            onClick={() => setOpen(false)}
          >
            Essai gratuit 14 jours →
          </Link>
        </div>
      )}
    </header>
  )
}

/* ── Hero ───────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden bg-[#0F6E56]">
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
            Démarrer gratuitement
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#tarifs"
            className="flex items-center gap-2 border border-white/30 text-white font-medium px-8 py-4 rounded-xl hover:bg-white/10 transition-colors text-base"
          >
            Voir les tarifs
          </a>
        </div>

        <p className="text-white/50 text-sm mt-6">14 jours d&apos;essai gratuit · Sans engagement · Aucune carte bancaire requise</p>

        {/* Mockup dashboard */}
        <div className="mt-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-2 max-w-4xl mx-auto shadow-2xl">
          <div className="bg-[#F1EFE8] rounded-xl overflow-hidden">
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
                  <div key={label} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
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

/* ── Logo bar / Early adopter ───────────────────────────────────── */
function LogoBar() {
  return (
    <section className="border-b border-gray-100 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <p className="text-center text-sm text-gray-400 mb-8 uppercase tracking-wider font-medium">
          Rejoignez les premiers syndics à moderniser leur gestion
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { emoji: '🚀', label: 'Lancement en cours', sub: 'Soyez parmi les premiers' },
            { emoji: '💰', label: 'Tarif early adopter', sub: 'Prix bloqué à vie' },
            { emoji: '🎯', label: 'Produit sur-mesure', sub: 'Conçu avec des syndics' },
            { emoji: '🇫🇷', label: '100% français', sub: 'Données hébergées en Europe' },
          ].map(({ emoji, label, sub }) => (
            <div key={label} className="text-center p-4 rounded-xl bg-[#F1EFE8]">
              <div className="text-2xl mb-2">{emoji}</div>
              <div className="font-semibold text-sm text-[#444441]">{label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
            </div>
          ))}
        </div>
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
            Une plateforme complète pour gérer l&apos;ensemble de votre activité de syndic, de la gestion courante aux situations d&apos;urgence.
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
    { icon: Bell, label: 'Alertes temps réel', desc: 'Soyez notifié dès qu\'un sinistre urgent ou un impayé est détecté.' },
    { icon: FileText, label: 'Documents légaux', desc: 'PV d\'AG, règlements de copropriété, fiches techniques — tout est archivé.' },
    { icon: Globe, label: 'Portail en ligne 24h/24', desc: 'Vos copropriétaires accèdent à leur espace à tout moment, depuis n\'importe où.' },
    { icon: Clock, label: 'Prise en main rapide', desc: 'Interface intuitive, formation non requise. Opérationnel en moins d\'une journée.' },
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
        "Jusqu'à 5 copropriétés",
        "Jusqu'à 75 lots",
        'Portail copropriétaire inclus',
        'Gestion des documents',
        'Appels de charges & impayés',
        'Messagerie syndic ↔ copropriétaires',
        'Support par email',
      ],
      cta: 'Démarrer gratuitement',
      href: '/register',
    },
    {
      name: 'Pro',
      price: '189',
      desc: 'Pour les syndics actifs avec un portefeuille croissant.',
      highlight: true,
      badge: 'Le plus populaire',
      features: [
        "Jusqu'à 20 copropriétés",
        "Jusqu'à 400 lots",
        'Tout le plan Starter',
        'Assemblées générales en ligne',
        'Suivi sinistres & travaux',
        'Relances automatiques',
        'Alertes & notifications temps réel',
        'Support prioritaire',
      ],
      cta: 'Essayer 14 jours gratuits',
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
        "Multi-utilisateurs (jusqu'à 5)",
        'Rapports & exports avancés',
        'Personnalisation aux couleurs du cabinet',
        'Onboarding dédié',
        'Support téléphonique',
      ],
      cta: 'Nous contacter',
      href: 'mailto:contact@coplio.fr',
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
            14 jours d&apos;essai gratuit sur tous les plans. Aucune carte bancaire requise.
          </p>
        </div>

        {/* Early adopter banner */}
        <div className="bg-[#E1F5EE] border border-[#0F6E56]/20 rounded-2xl p-4 mb-8 text-center">
          <p className="text-sm text-[#0F6E56] font-medium">
            🎉 <strong>Offre de lancement</strong> — Les premiers abonnés bénéficient du tarif actuel bloqué à vie, même si les prix augmentent.
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

              <a
                href={href}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm text-center transition-colors ${
                  highlight
                    ? 'bg-white text-[#0F6E56] hover:bg-[#E1F5EE]'
                    : 'bg-[#0F6E56] text-white hover:bg-[#0d5e49]'
                }`}
              >
                {cta}
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          Tous les prix sont HT. TVA applicable selon votre situation.
          Vous gérez un grand portefeuille ?{' '}
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
    <section id="qui-sommes-nous" className="py-24 bg-[#F1EFE8]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-sm font-semibold text-[#0F6E56] uppercase tracking-wider">Qui sommes-nous</span>
            <h2 className="text-4xl font-bold text-[#444441] mt-3 mb-6">
              Nés de la frustration des syndics indépendants
            </h2>
            <p className="text-gray-500 leading-relaxed mb-6">
              Coplio est né d&apos;un constat simple : les outils de gestion de copropriété existants sont trop complexes,
              trop chers, ou pensés pour les grandes structures. Les syndics indépendants méritent mieux.
            </p>
            <p className="text-gray-500 leading-relaxed mb-8">
              Nous avons travaillé main dans la main avec des syndics pour concevoir une solution intuitive,
              abordable et vraiment utile au quotidien. Coplio, c&apos;est le logiciel qu&apos;on aurait voulu avoir.
            </p>

            <div className="space-y-3">
              {[
                'Fondé en France, pour le marché français',
                'Données hébergées en Europe (RGPD)',
                'Support disponible par messagerie',
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
                le service à ses copropriétaires, pas l&apos;administration.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5">
              <div className="text-3xl font-bold text-[#0F6E56] mb-1">2025</div>
              <div className="text-sm text-gray-500">Année de création</div>
            </div>
            <div className="bg-white rounded-2xl p-5">
              <div className="text-3xl font-bold text-[#0F6E56] mb-1">100%</div>
              <div className="text-sm text-gray-500">Indépendant & français</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── FAQ ────────────────────────────────────────────────────────── */
function FAQ() {
  const items = [
    {
      q: 'Est-ce que je dois fournir ma carte bancaire pour l\'essai gratuit ?',
      a: 'Non. Vous démarrez votre essai de 14 jours sans aucune carte bancaire. Vous ne payez que si vous décidez de continuer à l\'issue de la période d\'essai.',
    },
    {
      q: 'Puis-je importer mes données existantes ?',
      a: 'Oui. Vous pouvez importer vos copropriétaires et vos lots via un fichier CSV. Notre équipe peut aussi vous accompagner gratuitement pour la migration si vous avez un volume important.',
    },
    {
      q: 'Que se passe-t-il à la fin de l\'essai gratuit ?',
      a: 'Vous recevez un rappel 7 jours avant la fin de votre essai. Si vous ne souscrivez pas, votre accès est simplement suspendu — vos données sont conservées 30 jours supplémentaires.',
    },
    {
      q: 'Mes copropriétaires doivent-ils payer pour accéder au portail ?',
      a: 'Non. Le portail copropriétaire est inclus dans tous les plans, sans surcoût. Vos copropriétaires accèdent gratuitement à leur espace personnel.',
    },
    {
      q: 'Puis-je changer de plan à tout moment ?',
      a: 'Oui. Vous pouvez passer à un plan supérieur ou inférieur à tout moment depuis votre espace. Le changement prend effet immédiatement, avec un ajustement au prorata.',
    },
    {
      q: 'Où sont hébergées mes données ?',
      a: 'Toutes vos données sont hébergées en Europe (Union Européenne), en conformité avec le RGPD. Elles ne sont jamais revendues ni partagées avec des tiers.',
    },
  ]

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-[#0F6E56] uppercase tracking-wider">FAQ</span>
          <h2 className="text-4xl font-bold text-[#444441] mt-3 mb-4">Questions fréquentes</h2>
          <p className="text-gray-500 text-lg">
            Vous ne trouvez pas votre réponse ?{' '}
            <a href="mailto:contact@coplio.fr" className="text-[#0F6E56] hover:underline">Écrivez-nous</a>
          </p>
        </div>

        <div className="space-y-3">
          {items.map(({ q, a }) => (
            <FAQItem key={q} question={q} answer={a} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-5 text-left hover:bg-[#F1EFE8] transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="font-medium text-[#444441] text-sm pr-4">{question}</span>
        <ChevronDown className={`w-4 h-4 text-[#0F6E56] flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5">
          <p className="text-gray-500 text-sm leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
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
          Démarrez votre essai gratuit de 14 jours. Sans engagement, sans carte bancaire.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
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
            J&apos;ai déjà un compte
          </Link>
        </div>

        {/* Contact rapide */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-white/50 text-sm">
          <a href="mailto:contact@coplio.fr" className="flex items-center gap-2 hover:text-white/80 transition-colors">
            <Mail className="w-4 h-4" />
            contact@coplio.fr
          </a>
          <span className="hidden sm:block">·</span>
          <span className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Réponse sous 24h ouvrées
          </span>
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
            <div className="mt-4 flex items-center gap-2">
              <a href="mailto:contact@coplio.fr" className="text-white/40 hover:text-white/70 transition-colors text-xs flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                contact@coplio.fr
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">Produit</h4>
            <ul className="space-y-2.5 text-sm text-white/50">
              <li><a href="#solutions" className="hover:text-white transition-colors">Nos solutions</a></li>
              <li><a href="#tarifs" className="hover:text-white transition-colors">Tarifs</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Se connecter</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Créer un compte</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">Informations</h4>
            <ul className="space-y-2.5 text-sm text-white/50">
              <li><Link href="/portail" className="hover:text-white transition-colors">Portail copropriétaire</Link></li>
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
