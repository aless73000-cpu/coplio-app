'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  Home, Building2, Users, FileText, MessageCircle,
  ArrowRight, BarChart3, Bell,
  Menu, X, ChevronDown, Receipt,
  AlertTriangle, CalendarDays,
} from 'lucide-react'

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

export default function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [featuresOpen, setFeaturesOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    // Throttle via rAF pour réduire l'INP (Interaction to Next Paint)
    let rafId = 0
    const onScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => setScrolled(window.scrollY > 20))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

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
