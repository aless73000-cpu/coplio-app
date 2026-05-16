'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  Home, Building2, Users, FileText, MessageCircle,
  Check, ArrowRight, Zap, Clock,
  BarChart3, Bell, Lock, Globe, Heart,
  Menu, X, ChevronDown, Mail, Receipt,
  AlertTriangle, CalendarDays, TrendingUp,
  CheckCircle2, Shield, Star,
} from 'lucide-react'
import { SoftwareApplicationJsonLd } from '@/components/seo/JsonLd'

const FeaturesShowcase = dynamic(() => import('@/components/landing/FeaturesShowcase'), { ssr: false })

export default function LandingPage() {
  return (
    <>
    <SoftwareApplicationJsonLd />
    <div className="min-h-screen bg-white antialiased text-[#1C1C1A]">
      <style>{`
        @keyframes floatY {
          0%,100%{transform:translateY(0px)}
          50%{transform:translateY(-10px)}
        }
        @keyframes meshPulse {
          0%,100%{opacity:.45;transform:scale(1)}
          50%{opacity:.75;transform:scale(1.06)}
        }
        @keyframes fadeUp {
          from{opacity:0;transform:translateY(20px)}
          to{opacity:1;transform:translateY(0)}
        }
        .float-a{animation:floatY 4s ease-in-out infinite}
        .float-b{animation:floatY 5s ease-in-out infinite;animation-delay:.9s}
        .float-c{animation:floatY 3.6s ease-in-out infinite;animation-delay:1.7s}
        .orb{animation:meshPulse 7s ease-in-out infinite}
        .orb2{animation:meshPulse 9s ease-in-out infinite;animation-delay:3.5s}
        .orb3{animation:meshPulse 6s ease-in-out infinite;animation-delay:1.5s}
        .fade-up{animation:fadeUp .7s ease both}
        .fade-up-2{animation:fadeUp .7s .15s ease both}
        .fade-up-3{animation:fadeUp .7s .3s ease both}
      `}</style>
      <Nav />
      <Hero />
      <TrustBar />
      <FeaturesShowcase />
      <BentoFeatures />
      <HowItWorks />
      <ProblemSolution />
      <Tarifs />
      <QuiSommesNous />
      <FAQ />
      <CtaFinal />
      <Footer />
    </div>
    </>
  )
}

/* ─────────────────────────────────────────────
   NAV — sticky avec mega-menu + mobile burger
───────────────────────────────────────────── */
function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [featuresOpen, setFeaturesOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const modules = [
    { icon: BarChart3,     label: 'Tableau de bord',      desc: 'KPIs, graphiques, rapports PDF' },
    { icon: Building2,    label: 'Copropriétés',          desc: 'Gérez tout votre portefeuille' },
    { icon: Users,        label: 'Copropriétaires',       desc: 'Portail & communication directe' },
    { icon: Receipt,      label: 'Appels de charges',     desc: 'Facturation et suivi des impayés' },
    { icon: FileText,     label: 'Documents',             desc: 'Archivage et partage sécurisé' },
    { icon: AlertTriangle,label: 'Sinistres',             desc: 'Suivi dossiers de A à Z' },
    { icon: CalendarDays, label: 'Assemblées générales',  desc: 'Convocations, votes, PV' },
    { icon: MessageCircle,label: 'Messagerie',            desc: 'Syndic ↔ copropriétaires' },
  ]

  function handleModuleClick(idx: number) {
    setFeaturesOpen(false)
    setMobileOpen(false)
    window.dispatchEvent(new CustomEvent('featureTabChange', { detail: idx }))
    setTimeout(() => {
      document.getElementById('fonctionnalites')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
  }

  const navLink = scrolled
    ? 'text-gray-600 hover:text-[#0F6E56] hover:bg-gray-50'
    : 'text-white/85 hover:text-white hover:bg-white/10'

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${
      scrolled
        ? 'bg-white/97 backdrop-blur-md shadow-sm border-b border-gray-100'
        : 'bg-[#0B6349]/55 backdrop-blur-md'
    }`}>
      <div className="max-w-7xl mx-auto px-5 h-[66px] flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 bg-[#0F6E56] rounded-xl flex items-center justify-center shadow-sm">
            <Home className="w-4 h-4 text-white" />
          </div>
          <span className={`font-bold text-xl tracking-tight ${scrolled ? 'text-[#0F6E56]' : 'text-white'}`}>
            Coplio
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">

          {/* Mega-menu Fonctionnalités */}
          <div
            className="relative"
            onMouseEnter={() => setFeaturesOpen(true)}
            onMouseLeave={() => setFeaturesOpen(false)}
          >
            <button className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${navLink} ${
              featuresOpen ? (scrolled ? 'bg-gray-50 text-[#0F6E56]' : 'bg-white/15 text-white') : ''
            }`}>
              Fonctionnalités
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${featuresOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown panel */}
            <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[560px] bg-white rounded-2xl shadow-2xl border border-gray-100/80 p-5 transition-all duration-200 origin-top ${
              featuresOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
            }`}>
              <div className="grid grid-cols-2 gap-1 mb-4">
                {modules.map(({ icon: Icon, label, desc }, idx) => (
                  <button
                    key={label}
                    onClick={() => handleModuleClick(idx)}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#F4F2EB] transition-colors text-left group"
                  >
                    <div className="w-8 h-8 bg-[#E1F5EE] rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#0F6E56] transition-colors">
                      <Icon className="w-4 h-4 text-[#0F6E56] group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#1C1C1A] leading-tight">{label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">Toutes les fonctionnalités incluses dès le 1er plan</span>
                <Link href="/register" className="flex items-center gap-1 text-xs font-bold text-[#0F6E56] hover:underline">
                  Essai gratuit 14j <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          <a href="#tarifs"           className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${navLink}`}>Tarifs</a>
          <a href="#besoins"          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${navLink}`}>Vos besoins</a>
          <a href="#faq"              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${navLink}`}>FAQ</a>
          <a href="#qui-sommes-nous"  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${navLink}`}>À propos</a>
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/portail" className={`text-sm font-medium transition-colors ${scrolled ? 'text-gray-500 hover:text-[#0F6E56]' : 'text-white/70 hover:text-white'}`}>
            Espace copropriétaire
          </Link>
          <Link href="/login" className={`text-sm transition-colors ${scrolled ? 'text-gray-500 hover:text-[#1C1C1A]' : 'text-white/60 hover:text-white'}`}>
            Se connecter
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-1.5 text-sm bg-[#0F6E56] text-white px-5 py-2.5 rounded-xl hover:bg-[#0d5e49] transition-colors font-semibold shadow-md shadow-[#0F6E56]/30"
          >
            Essai gratuit 14j <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile burger */}
        <button
          className={`md:hidden p-2 rounded-xl transition-colors ${scrolled ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen
            ? <X className={`w-5 h-5 ${scrolled ? 'text-[#1C1C1A]' : 'text-white'}`} />
            : <Menu className={`w-5 h-5 ${scrolled ? 'text-[#1C1C1A]' : 'text-white'}`} />
          }
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-5 py-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">Fonctionnalités</p>
          <div className="space-y-0.5 mb-4">
            {modules.map(({ icon: Icon, label }, idx) => (
              <button key={label} onClick={() => handleModuleClick(idx)}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-[#F4F2EB] transition-colors text-sm text-gray-700">
                <Icon className="w-4 h-4 text-[#0F6E56]" /> {label}
              </button>
            ))}
          </div>
          <div className="space-y-0.5 border-t border-gray-100 pt-4 mb-4">
            <a href="#tarifs"          onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm text-gray-600 hover:text-[#0F6E56] rounded-xl hover:bg-[#F4F2EB]">Tarifs</a>
            <a href="#faq"             onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm text-gray-600 hover:text-[#0F6E56] rounded-xl hover:bg-[#F4F2EB]">FAQ</a>
            <Link href="/portail"      onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm text-gray-600 hover:text-[#0F6E56] rounded-xl hover:bg-[#F4F2EB]">Espace copropriétaire</Link>
            <Link href="/login"        onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm text-gray-600 hover:text-[#0F6E56] rounded-xl hover:bg-[#F4F2EB]">Se connecter</Link>
          </div>
          <Link href="/register" onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center gap-2 bg-[#0F6E56] text-white px-4 py-3.5 rounded-xl font-semibold text-sm hover:bg-[#0d5e49] transition-colors">
            Démarrer — essai gratuit 14 jours <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </header>
  )
}

/* ─────────────────────────────────────────────
   HERO — split layout, mesh gradient, floating cards
───────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-[66px] overflow-hidden" style={{ background: '#0B5E46' }}>

      {/* Mesh gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="orb  absolute top-[-10%] left-[-5%] w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(159,225,203,.30) 0%, transparent 65%)' }} />
        <div className="orb2 absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(15,110,86,.55) 0%, transparent 65%)' }} />
        <div className="orb3 absolute top-[40%] right-[25%] w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,.06) 0%, transparent 70%)' }} />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.035]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">

          {/* ── Left column ── */}
          <div className="fade-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-white/90 text-sm mb-8 backdrop-blur-sm">
              <Zap className="w-3.5 h-3.5 text-[#9FE1CB]" />
              Nouveau · Import CSV &amp; portail copropriétaire
            </div>

            <h1 className="text-5xl lg:text-[3.6rem] xl:text-6xl font-bold text-white leading-[1.08] mb-6 tracking-tight">
              La gestion de<br />
              copropriété,{' '}
              <span className="text-[#9FE1CB]">enfin simple</span>
            </h1>

            <p className="text-lg text-white/68 leading-relaxed mb-10 max-w-[480px]">
              Coplio centralise copropriétés, copropriétaires, charges, sinistres et assemblées générales dans une seule plateforme pensée pour les syndics indépendants.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link href="/register"
                className="flex items-center justify-center gap-2 bg-white text-[#0F6E56] font-bold px-7 py-4 rounded-2xl hover:bg-[#E1F5EE] transition-all text-base shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-black/25 hover:-translate-y-0.5">
                Démarrer gratuitement <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#tarifs"
                className="flex items-center justify-center gap-2 border border-white/25 bg-white/8 text-white font-medium px-7 py-4 rounded-2xl hover:bg-white/15 transition-all text-base backdrop-blur-sm">
                Voir les tarifs
              </a>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-white/50 text-sm">
              {['14 jours gratuits', 'Sans carte bancaire', 'Sans engagement'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#9FE1CB]" /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* ── Right column — browser + floating cards ── */}
          <div className="hidden lg:block relative fade-up-2">

            {/* Floating card 1 — Recouvrement */}
            <div className="float-a absolute -left-14 top-6 z-20 bg-white rounded-2xl shadow-2xl shadow-black/15 p-4 w-48 border border-gray-100/50">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 bg-[#E1F5EE] rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-[#0F6E56]" />
                </div>
                <span className="text-xs font-bold text-gray-700">Recouvrement</span>
              </div>
              <div className="text-3xl font-bold text-[#0F6E56] mb-0.5">94%</div>
              <div className="text-xs text-gray-400">Ce mois-ci</div>
              <div className="mt-2.5 flex gap-0.5 items-end h-6">
                {[60, 72, 68, 85, 79, 94].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm" style={{
                    height: `${h}%`,
                    background: i === 5 ? '#0F6E56' : i >= 4 ? '#6DC5A8' : '#E1F5EE',
                  }} />
                ))}
              </div>
            </div>

            {/* Floating card 2 — AG */}
            <div className="float-b absolute -right-10 top-12 z-20 bg-white rounded-2xl shadow-2xl shadow-black/15 p-4 w-52 border border-gray-100/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
                  <CalendarDays className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <span className="text-xs font-bold text-gray-700">Prochaine AG</span>
              </div>
              <div className="text-sm font-semibold text-[#1C1C1A] mb-0.5">Résidence Bellevue</div>
              <div className="text-xs text-gray-400 mb-2">Convocations envoyées ✓</div>
              <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 text-[10px] font-bold px-2.5 py-1 rounded-full">
                <Bell className="w-2.5 h-2.5" /> J-12
              </div>
            </div>

            {/* Floating card 3 — Lots */}
            <div className="float-c absolute -right-6 bottom-10 z-20 bg-[#0F6E56] rounded-2xl shadow-2xl shadow-[#0F6E56]/30 p-4 w-40">
              <div className="text-[#9FE1CB] text-xs font-semibold mb-1.5">Lots gérés</div>
              <div className="text-4xl font-bold text-white leading-none mb-0.5">87</div>
              <div className="text-white/50 text-xs">5 copropriétés</div>
            </div>

            {/* Browser window */}
            <div className="relative bg-white/12 backdrop-blur-sm border border-white/20 rounded-2xl p-2 shadow-2xl shadow-black/25">
              <div className="bg-[#F4F2EB] rounded-xl overflow-hidden">
                {/* Browser chrome */}
                <div className="bg-white px-4 py-2.5 flex items-center gap-3 border-b border-gray-100">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-md px-3 py-1 text-[11px] text-gray-400 text-center max-w-[200px] mx-auto">
                    app.coplio.fr/dashboard
                  </div>
                </div>

                {/* App UI */}
                <div className="flex h-[280px]">
                  {/* Sidebar */}
                  <div className="w-[168px] bg-[#0F6E56] p-3 flex flex-col gap-0.5 flex-shrink-0">
                    <div className="flex items-center gap-2 px-2 py-2 mb-2">
                      <div className="w-5 h-5 bg-white rounded-md flex items-center justify-center">
                        <Home className="w-3 h-3 text-[#0F6E56]" />
                      </div>
                      <span className="text-white font-bold text-sm">Coplio</span>
                    </div>
                    {[
                      { icon: BarChart3,    label: 'Tableau de bord', active: true },
                      { icon: Building2,   label: 'Copropriétés' },
                      { icon: Users,       label: 'Copropriétaires' },
                      { icon: Receipt,     label: 'Appels de charges' },
                      { icon: FileText,    label: 'Documents' },
                      { icon: AlertTriangle, label: 'Sinistres' },
                    ].map(({ icon: Icon, label, active }) => (
                      <div key={label} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${active ? 'bg-white/20' : ''}`}>
                        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? 'text-white' : 'text-white/40'}`} />
                        <span className={`text-[11px] ${active ? 'text-white font-semibold' : 'text-white/40'}`}>{label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 p-4 space-y-3 overflow-hidden">
                    <div className="text-xs font-bold text-[#1C1C1A]">Bonjour, Jean 👋</div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { v: '12',   l: 'Copropriétés', c: 'text-[#0F6E56]', bg: 'bg-[#E1F5EE]' },
                        { v: '284',  l: 'Lots',          c: 'text-blue-600',  bg: 'bg-blue-50' },
                        { v: '2',    l: 'Impayés',       c: 'text-red-500',   bg: 'bg-red-50' },
                      ].map(({ v, l, c, bg }) => (
                        <div key={l} className={`${bg} rounded-xl p-2.5`}>
                          <div className={`text-lg font-bold ${c}`}>{v}</div>
                          <div className="text-[9px] text-gray-500">{l}</div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white rounded-xl p-2.5 border border-gray-100">
                      <div className="text-[10px] font-semibold text-gray-500 mb-2">Recouvrement — 6 mois</div>
                      <div className="flex items-end gap-1 h-12">
                        {[62, 74, 69, 83, 77, 94].map((h, i) => (
                          <div key={i} className="flex-1 rounded-sm" style={{
                            height: `${h}%`,
                            background: i === 5 ? '#0F6E56' : i >= 4 ? '#6DC5A8' : '#E1F5EE',
                          }} />
                        ))}
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-2.5 border border-gray-100">
                      <div className="text-[10px] font-semibold text-gray-500 mb-1.5">Activité récente</div>
                      {['AG planifiée · Résidence Bellevue', 'Charge réglée · M. Martin', 'Sinistre clôturé · Dégât eaux'].map((t) => (
                        <div key={t} className="flex items-center gap-1.5 mb-1">
                          <div className="w-1 h-1 rounded-full bg-[#0F6E56] flex-shrink-0" />
                          <span className="text-[9px] text-gray-400">{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave SVG */}
      <div className="absolute bottom-0 left-0 right-0 leading-[0]">
        <svg viewBox="0 0 1440 64" xmlns="http://www.w3.org/2000/svg" className="w-full block fill-white">
          <path d="M0,64 C480,0 960,0 1440,64 L1440,64 L0,64 Z" />
        </svg>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   TRUST BAR — honest early adopter
───────────────────────────────────────────── */
function TrustBar() {
  return (
    <section className="py-14 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-center text-[11px] font-bold text-gray-400 uppercase tracking-[0.18em] mb-8">
          Rejoignez les premiers syndics à moderniser leur gestion
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { emoji: '🚀', label: 'En phase de lancement',       sub: 'Soyez parmi les premiers adoptants' },
            { emoji: '💰', label: 'Prix bloqué à vie',            sub: 'Tarif early adopter garanti' },
            { emoji: '🎯', label: 'Conçu avec des syndics',       sub: 'Chaque fonction validée terrain' },
            { emoji: '🇫🇷', label: '100 % français',             sub: 'Données hébergées en Europe · RGPD' },
          ].map(({ emoji, label, sub }) => (
            <div key={label} className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#F4F2EB] hover:bg-[#ECEAE2] transition-colors">
              <span className="text-2xl leading-none flex-shrink-0 mt-0.5">{emoji}</span>
              <div>
                <div className="text-sm font-bold text-[#1C1C1A] leading-tight">{label}</div>
                <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   BENTO GRID — fonctionnalités style Apple/Linear
───────────────────────────────────────────── */
function BentoFeatures() {
  return (
    <section id="solutions" className="py-24 bg-[#F4F2EB]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-[11px] font-bold text-[#0F6E56] uppercase tracking-[0.18em]">Fonctionnalités</span>
          <h2 className="text-4xl font-bold text-[#1C1C1A] mt-3 mb-4 tracking-tight">
            Tout ce dont un syndic a besoin
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Une plateforme complète pensée pour l&apos;efficacité au quotidien — de la gestion courante aux situations d&apos;urgence.
          </p>
        </div>

        {/* Bento grid — 3 cols */}
        <div className="grid md:grid-cols-3 gap-4">

          {/* ① Dashboard — wide (col-span-2) */}
          <div className="md:col-span-2 bg-white rounded-3xl border border-gray-100 overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="p-7 pb-4">
              <div className="w-11 h-11 bg-[#E1F5EE] rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#0F6E56] transition-colors">
                <BarChart3 className="w-5 h-5 text-[#0F6E56] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-[#1C1C1A] mb-2">Tableau de bord & rapports PDF</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-lg">
                Visualisez l&apos;état de tout votre portefeuille en un coup d&apos;œil. KPIs, graphiques de recouvrement, alertes prioritaires — et générez vos rapports en un clic.
              </p>
            </div>
            {/* Mini dashboard preview */}
            <div className="mx-6 bg-[#F4F2EB] rounded-t-2xl p-4 overflow-hidden border-t-0">
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[
                  { v: '12',    l: 'Copropriétés', c: 'text-[#0F6E56]' },
                  { v: '284',   l: 'Lots',          c: 'text-blue-600' },
                  { v: '3',     l: 'AG à venir',    c: 'text-amber-600' },
                  { v: '1.4k€', l: 'Impayés',       c: 'text-red-500' },
                ].map(({ v, l, c }) => (
                  <div key={l} className="bg-white rounded-xl p-3 border border-gray-50 shadow-sm">
                    <div className={`text-lg font-bold ${c}`}>{v}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{l}</div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl p-3 border border-gray-50 shadow-sm">
                <div className="text-[11px] font-semibold text-gray-500 mb-2">Taux de recouvrement — 6 mois</div>
                <div className="flex items-end gap-1.5 h-14">
                  {[62, 71, 78, 74, 88, 94].map((h, i) => (
                    <div key={i} className="flex-1 rounded-md transition-all duration-300" style={{
                      height: `${h}%`,
                      background: i === 5 ? '#0F6E56' : i >= 4 ? '#6DC5A8' : '#E1F5EE',
                    }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ② Portail copropriétaire — green card */}
          <div className="bg-[#0F6E56] rounded-3xl p-7 flex flex-col group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center mb-5">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Portail copropriétaire</h3>
            <p className="text-white/65 text-sm leading-relaxed flex-1">
              Offrez à vos copropriétaires un espace dédié pour consulter charges, documents et sinistres — accessible 24h/24, sans mot de passe à retenir.
            </p>
            <div className="mt-6 bg-white/10 rounded-2xl p-4 space-y-2">
              {[
                { label: 'Q1 2025 · 420 €', badge: 'Payé ✓',    badgeColor: 'bg-[#9FE1CB] text-[#0F6E56]' },
                { label: 'Q2 2025 · 435 €', badge: 'À venir',   badgeColor: 'bg-white/20 text-white/70' },
              ].map(({ label, badge, badgeColor }) => (
                <div key={label} className="flex items-center justify-between bg-white/10 rounded-xl px-3.5 py-2.5">
                  <span className="text-white/70 text-xs">{label}</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ③ Appels de charges */}
          <div className="bg-white rounded-3xl border border-gray-100 p-7 group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-11 h-11 bg-[#E1F5EE] rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#0F6E56] transition-colors">
              <Receipt className="w-5 h-5 text-[#0F6E56] group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-[#1C1C1A] mb-2">Appels de charges & impayés</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-5">
              Émettez vos appels de fonds, suivez les paiements et relancez automatiquement les copropriétaires en retard.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-400">Recouvrement</span>
                <span className="font-bold text-[#0F6E56]">78 %</span>
              </div>
              <div className="w-full bg-[#E1F5EE] rounded-full h-2">
                <div className="bg-[#0F6E56] h-2 rounded-full transition-all" style={{ width: '78%' }} />
              </div>
              <p className="text-[10px] text-gray-400">Taux moyen sur le portefeuille</p>
            </div>
          </div>

          {/* ④ AG */}
          <div className="bg-white rounded-3xl border border-gray-100 p-7 group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-11 h-11 bg-amber-50 rounded-2xl flex items-center justify-center mb-5">
              <CalendarDays className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-[#1C1C1A] mb-2">Assemblées générales</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-5">
              Préparez ordres du jour, envoyez les convocations, archivez les PV — tout dans Coplio, rien à jongler.
            </p>
            <div className="space-y-2">
              {[
                { step: '01 · Planification',  done: true },
                { step: '02 · Convocations',   done: true },
                { step: '03 · Votes',          done: true },
                { step: '04 · PV archivé',     done: false },
              ].map(({ step, done }) => (
                <div key={step} className="flex items-center gap-2.5">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-[#E1F5EE]' : 'bg-gray-100'}`}>
                    {done && <Check className="w-2.5 h-2.5 text-[#0F6E56]" />}
                  </div>
                  <span className={`text-xs ${done ? 'text-gray-600' : 'text-gray-300'}`}>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ⑤ Sinistres */}
          <div className="bg-white rounded-3xl border border-gray-100 p-7 group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-11 h-11 bg-red-50 rounded-2xl flex items-center justify-center mb-5">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-[#1C1C1A] mb-2">Sinistres & travaux</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-5">
              Déclarez, suivez et clôturez chaque sinistre étape par étape — des premières constatations jusqu&apos;à la résolution.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Signalé',  color: 'bg-amber-50 text-amber-700' },
                { label: 'En cours', color: 'bg-blue-50 text-blue-700' },
                { label: 'Clôturé', color: 'bg-[#E1F5EE] text-[#0F6E56]' },
              ].map(({ label, color }) => (
                <div key={label} className={`${color} rounded-xl px-2 py-2 text-center`}>
                  <span className="text-[10px] font-bold">{label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   HOW IT WORKS — 3 étapes
───────────────────────────────────────────── */
function HowItWorks() {
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

  return (
    <section id="comment-ca-marche" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-[11px] font-bold text-[#0F6E56] uppercase tracking-[0.18em]">Comment ça marche</span>
          <h2 className="text-4xl font-bold text-[#1C1C1A] mt-3 mb-4 tracking-tight">
            Opérationnel en moins d&apos;une journée
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Pas de migration compliquée, pas de formation. Vous êtes prêt en quelques clics.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10 relative">
          {/* Connecting dots */}
          <div className="hidden md:block absolute top-[52px] left-[calc(16.6%+32px)] right-[calc(16.6%+32px)] h-px bg-gradient-to-r from-[#E1F5EE] via-[#0F6E56]/40 to-[#E1F5EE]" />

          {steps.map(({ n, icon: Icon, title, desc }) => (
            <div key={n} className="flex flex-col items-center text-center relative">
              <div className="relative mb-6">
                <div className="w-[104px] h-[104px] bg-[#F4F2EB] rounded-3xl flex items-center justify-center">
                  <Icon className="w-10 h-10 text-[#0F6E56]" />
                </div>
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-[#0F6E56] rounded-full flex items-center justify-center shadow-lg shadow-[#0F6E56]/30">
                  <span className="text-white text-[11px] font-bold">{n.slice(1)}</span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-[#1C1C1A] mb-3">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   PROBLEM / SOLUTION — before & after
───────────────────────────────────────────── */
function ProblemSolution() {
  const items = [
    {
      before: 'Des documents éparpillés dans des dizaines de dossiers',
      after:  'Tous vos documents centralisés, accessibles en un clic, partagés avec les bons copropriétaires.',
    },
    {
      before: 'Des relances manuelles qui prennent des heures chaque mois',
      after:  'Coplio détecte les impayés et déclenche des relances au bon moment — zéro intervention de votre part.',
    },
    {
      before: 'Des copropriétaires qui vous appellent pour tout et n\'importe quoi',
      after:  'Le portail leur donne un accès autonome à leurs charges, travaux, documents et messagerie.',
    },
    {
      before: 'Des AG laborieuses à préparer, animer et archiver',
      after:  'Préparez l\'ordre du jour, envoyez les convocations et archivez les PV — directement depuis Coplio.',
    },
  ]

  return (
    <section id="besoins" className="py-24 bg-[#F4F2EB]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-[11px] font-bold text-[#0F6E56] uppercase tracking-[0.18em]">Vos besoins</span>
          <h2 className="text-4xl font-bold text-[#1C1C1A] mt-3 mb-4 tracking-tight">
            On connaît vos problèmes
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Coplio a été conçu main dans la main avec des syndics indépendants.
          </p>
        </div>

        <div className="space-y-3">
          {items.map(({ before, after }, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-[#0F6E56]/20 transition-all hover:shadow-md">
              <div className="grid md:grid-cols-2 gap-4 items-center">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="w-3.5 h-3.5 text-red-500" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">{before}</p>
                </div>
                <div className="flex items-start gap-3 bg-[#F4F2EB] rounded-xl p-4">
                  <div className="w-6 h-6 bg-[#E1F5EE] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-[#0F6E56]" />
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{after}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   TARIFS — avec toggle mensuel / annuel
───────────────────────────────────────────── */
function Tarifs() {
  const [annual, setAnnual] = useState(false)

  const plans = [
    {
      name: 'Starter',
      priceM: 99,
      priceA: 79,
      desc: 'Parfait pour démarrer et gérer un petit portefeuille.',
      highlight: false,
      badge: null,
      features: [
        "Jusqu'à 5 copropriétés",
        "Jusqu'à 75 lots",
        'Portail copropriétaire inclus',
        'Gestion des documents',
        'Appels de charges & impayés',
        'Messagerie intégrée',
        'Support par email',
      ],
      cta: 'Démarrer gratuitement',
      href: '/register',
    },
    {
      name: 'Pro',
      priceM: 189,
      priceA: 149,
      desc: 'Pour les syndics actifs avec un portefeuille croissant.',
      highlight: true,
      badge: '⭐ Le plus populaire',
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
      priceM: 279,
      priceA: 219,
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
        <div className="text-center mb-12">
          <span className="text-[11px] font-bold text-[#0F6E56] uppercase tracking-[0.18em]">Tarifs</span>
          <h2 className="text-4xl font-bold text-[#1C1C1A] mt-3 mb-4 tracking-tight">
            Simple, transparent, sans surprise
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto mb-8">
            14 jours d&apos;essai gratuit sur tous les plans. Aucune carte bancaire requise.
          </p>

          {/* Toggle mensuel / annuel */}
          <div className="inline-flex items-center gap-1 bg-[#F4F2EB] p-1 rounded-2xl border border-gray-100">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                !annual ? 'bg-white text-[#1C1C1A] shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                annual ? 'bg-white text-[#1C1C1A] shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Annuel
              <span className="text-[10px] font-bold text-[#0F6E56] bg-[#E1F5EE] px-2 py-0.5 rounded-full">
                −20 %
              </span>
            </button>
          </div>
        </div>

        {/* Early adopter banner */}
        <div className="flex items-center justify-center gap-3 bg-gradient-to-r from-[#E1F5EE] to-[#F4F2EB] border border-[#0F6E56]/15 rounded-2xl p-4 mb-10">
          <Zap className="w-4 h-4 text-[#0F6E56] flex-shrink-0" />
          <p className="text-sm text-[#0F6E56]">
            <strong>Offre de lancement</strong> — Les premiers abonnés bénéficient du tarif actuel{' '}
            <strong>bloqué à vie</strong>, même si les prix augmentent.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map(({ name, priceM, priceA, desc, highlight, badge, features, cta, href }) => {
            const price = annual ? priceA : priceM
            return (
              <div
                key={name}
                className={`relative rounded-3xl p-8 border-2 flex flex-col transition-all duration-300 ${
                  highlight
                    ? 'border-[#0F6E56] bg-[#0F6E56] shadow-2xl shadow-[#0F6E56]/25 md:-mt-5 md:-mb-5'
                    : 'border-gray-100 bg-white hover:border-[#0F6E56]/30 hover:shadow-lg'
                }`}
              >
                {badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="bg-white text-[#0F6E56] text-xs font-bold px-5 py-1.5 rounded-full shadow-lg border border-[#0F6E56]/10">
                      {badge}
                    </span>
                  </div>
                )}

                <div className="mb-7">
                  <h3 className={`font-bold text-xl mb-1.5 ${highlight ? 'text-white' : 'text-[#1C1C1A]'}`}>{name}</h3>
                  <p className={`text-sm mb-5 ${highlight ? 'text-white/65' : 'text-gray-500'}`}>{desc}</p>
                  <div className="flex items-end gap-2">
                    <span className={`text-5xl font-bold tracking-tight ${highlight ? 'text-white' : 'text-[#1C1C1A]'}`}>
                      {price}€
                    </span>
                    <span className={`text-sm mb-2 ${highlight ? 'text-white/55' : 'text-gray-400'}`}>/mois HT</span>
                  </div>
                  {annual && (
                    <p className={`text-xs mt-1.5 ${highlight ? 'text-white/45' : 'text-gray-400'}`}>
                      Facturé {price * 12} € / an · économisez {(priceM - priceA) * 12} €
                    </p>
                  )}
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        highlight ? 'bg-white/20' : 'bg-[#E1F5EE]'
                      }`}>
                        <Check className={`w-2.5 h-2.5 ${highlight ? 'text-white' : 'text-[#0F6E56]'}`} />
                      </div>
                      <span className={highlight ? 'text-white/80' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={href}
                  className={`w-full py-3.5 rounded-2xl font-bold text-sm text-center transition-all block ${
                    highlight
                      ? 'bg-white text-[#0F6E56] hover:bg-[#E1F5EE] shadow-md'
                      : 'bg-[#0F6E56] text-white hover:bg-[#0d5e49] shadow-md shadow-[#0F6E56]/20'
                  }`}
                >
                  {cta}
                </a>
              </div>
            )
          })}
        </div>

        <p className="text-center text-sm text-gray-400 mt-10">
          Tous les prix sont HT · TVA applicable selon votre situation ·{' '}
          <a href="mailto:contact@coplio.fr" className="text-[#0F6E56] hover:underline font-medium">
            Tarif sur mesure pour grands portefeuilles
          </a>
        </p>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   QUI SOMMES-NOUS
───────────────────────────────────────────── */
function QuiSommesNous() {
  return (
    <section id="qui-sommes-nous" className="py-24 bg-[#F4F2EB]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-[11px] font-bold text-[#0F6E56] uppercase tracking-[0.18em]">Qui sommes-nous</span>
            <h2 className="text-4xl font-bold text-[#1C1C1A] mt-3 mb-6 tracking-tight">
              Nés de la frustration<br />des syndics indépendants
            </h2>
            <p className="text-gray-500 leading-relaxed mb-5">
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
              ].map((item) => (
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
            <div className="bg-[#E1F5EE] rounded-3xl p-6 col-span-2 border border-[#0F6E56]/10">
              <Heart className="w-8 h-8 text-[#0F6E56] mb-3" />
              <h3 className="font-bold text-[#0F6E56] text-lg mb-2">Notre mission</h3>
              <p className="text-[#0F6E56]/75 text-sm leading-relaxed">
                Permettre à chaque syndic indépendant de se concentrer sur ce qui compte vraiment :
                le service à ses copropriétaires, pas l&apos;administration.
              </p>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-[#0F6E56] mb-1">2025</div>
              <div className="text-sm text-gray-500">Année de création</div>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-[#0F6E56] mb-1">100 %</div>
              <div className="text-sm text-gray-500">Indépendant & français</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   FAQ — accordéon interactif (6 questions)
───────────────────────────────────────────── */
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
        <div className="text-center mb-14">
          <span className="text-[11px] font-bold text-[#0F6E56] uppercase tracking-[0.18em]">FAQ</span>
          <h2 className="text-4xl font-bold text-[#1C1C1A] mt-3 mb-4 tracking-tight">Questions fréquentes</h2>
          <p className="text-gray-500 text-lg">
            Vous ne trouvez pas votre réponse ?{' '}
            <a href="mailto:contact@coplio.fr" className="text-[#0F6E56] hover:underline font-semibold">
              Écrivez-nous
            </a>
          </p>
        </div>
        <div className="space-y-2">
          {items.map(({ q, a }) => <FAQItem key={q} question={q} answer={a} />)}
        </div>
      </div>
    </section>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
      open ? 'border-[#0F6E56]/30 bg-[#F4F2EB]' : 'border-gray-100 bg-white hover:border-gray-200'
    }`}>
      <button
        className="w-full flex items-center justify-between p-5 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold text-[#1C1C1A] text-sm pr-6 leading-relaxed">{question}</span>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
          open ? 'bg-[#0F6E56]' : 'bg-[#E1F5EE]'
        }`}>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
            open ? 'rotate-180 text-white' : 'text-[#0F6E56]'
          }`} />
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-0">
          <p className="text-gray-500 text-sm leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   CTA FINAL
───────────────────────────────────────────── */
function CtaFinal() {
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

/* ─────────────────────────────────────────────
   FOOTER
───────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="bg-[#1C1C1A] text-white">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-[#0F6E56] rounded-xl flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight">Coplio</span>
            </div>
            <p className="text-white/45 text-sm leading-relaxed max-w-xs mb-5">
              Le logiciel de gestion de copropriété pour syndics indépendants. Simple, moderne, efficace.
            </p>
            <a href="mailto:contact@coplio.fr" className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm">
              <Mail className="w-4 h-4" /> contact@coplio.fr
            </a>
          </div>

          {/* Produit */}
          <div>
            <h4 className="font-bold text-sm mb-5 text-white/80">Produit</h4>
            <ul className="space-y-3 text-sm text-white/40">
              <li><a href="#solutions" className="hover:text-white/75 transition-colors">Fonctionnalités</a></li>
              <li><a href="#tarifs"    className="hover:text-white/75 transition-colors">Tarifs</a></li>
              <li><a href="#faq"      className="hover:text-white/75 transition-colors">FAQ</a></li>
              <li><Link href="/login"    className="hover:text-white/75 transition-colors">Se connecter</Link></li>
              <li><Link href="/register" className="hover:text-white/75 transition-colors">Créer un compte</Link></li>
            </ul>
          </div>

          {/* Informations */}
          <div>
            <h4 className="font-bold text-sm mb-5 text-white/80">Informations</h4>
            <ul className="space-y-3 text-sm text-white/40">
              <li><Link href="/portail"         className="hover:text-white/75 transition-colors">Espace copropriétaire</Link></li>
              <li><a href="#qui-sommes-nous"     className="hover:text-white/75 transition-colors">Qui sommes-nous</a></li>
              <li><Link href="/cgu"             className="hover:text-white/75 transition-colors">CGU</Link></li>
              <li><Link href="/confidentialite" className="hover:text-white/75 transition-colors">Confidentialité</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/25 text-xs">© {new Date().getFullYear()} Coplio. Tous droits réservés.</p>
          <p className="text-white/25 text-xs">Fait avec ❤️ en France · Données hébergées en Europe · RGPD</p>
        </div>
      </div>
    </footer>
  )
}
