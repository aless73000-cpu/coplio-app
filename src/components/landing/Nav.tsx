'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  Building2, Users, FileText, MessageCircle,
  ArrowRight, BarChart3, Bell,
  Menu, X, ChevronDown, Receipt,
  AlertTriangle, CalendarDays,
} from 'lucide-react'

const modules = [
  { icon: BarChart3,      label: 'Tableau de bord',      desc: 'KPIs, graphiques, rapports PDF' },
  { icon: Building2,      label: 'Copropriétés',          desc: 'Gérez tout votre portefeuille' },
  { icon: Users,          label: 'Copropriétaires',       desc: 'Portail & communication directe' },
  { icon: Receipt,        label: 'Appels de charges',     desc: 'Facturation et suivi des impayés' },
  { icon: FileText,       label: 'Documents',             desc: 'Archivage et partage sécurisé' },
  { icon: AlertTriangle,  label: 'Sinistres',             desc: 'Suivi dossiers de A à Z' },
  { icon: CalendarDays,   label: 'Assemblées générales',  desc: 'Convocations, votes, PV' },
  { icon: MessageCircle,  label: 'Messagerie',            desc: 'Syndic ↔ copropriétaires' },
]

export default function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [featuresOpen, setFeaturesOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let rafId = 0
    const onScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => setScrolled(window.scrollY > 20))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('scroll', onScroll) }
  }, [])

  function handleModuleClick(idx: number) {
    setFeaturesOpen(false)
    setMobileOpen(false)
    window.dispatchEvent(new CustomEvent('featureTabChange', { detail: idx }))
    setTimeout(() => {
      document.getElementById('fonctionnalites')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/95 backdrop-blur-xl border-b border-slate-100'
        : 'bg-[#0D1117]/70 backdrop-blur-md'
    }`}>
      <div className="max-w-7xl mx-auto px-5 h-[66px] flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${scrolled ? 'bg-[#374151]' : 'bg-white/10 border border-white/15'}`}>
            <Building2 className={`w-4 h-4 ${scrolled ? 'text-white' : 'text-white/70'}`} />
          </div>
          <span className={`font-bold text-xl ${scrolled ? 'text-[#374151]' : 'text-white/80'}`} style={{ letterSpacing: '-0.02em' }}>
            Coplio
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full tracking-wider leading-none ${scrolled ? 'bg-amber-50 text-amber-500 border border-amber-200' : 'bg-amber-400/20 text-amber-300'}`}>BETA</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          <div
            className="relative"
            onMouseEnter={() => setFeaturesOpen(true)}
            onMouseLeave={() => setFeaturesOpen(false)}
          >
            <button className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              scrolled ? 'text-slate-500 hover:text-[#374151] hover:bg-slate-50' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}>
              Fonctionnalités
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${featuresOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[560px] bg-white rounded-2xl shadow-2xl shadow-black/10 border border-slate-100 p-5 transition-all duration-200 origin-top ${
              featuresOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
            }`}>
              <div className="grid grid-cols-2 gap-1 mb-4">
                {modules.map(({ icon: Icon, label, desc }, idx) => (
                  <button key={label} onClick={() => handleModuleClick(idx)}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left group">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#374151] transition-colors">
                      <Icon className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#374151] leading-tight">{label}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">Toutes les fonctionnalités incluses dès le 1er plan</span>
                <Link href="/register" className="flex items-center gap-1 text-xs font-bold text-[#374151] hover:underline">
                  Essai gratuit 14j <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {['#tarifs:Tarifs', '#besoins:Vos besoins', '#faq:FAQ', '#qui-sommes-nous:À propos'].map(item => {
            const [href, label] = item.split(':')
            return (
              <a key={href} href={href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  scrolled ? 'text-slate-500 hover:text-[#374151] hover:bg-slate-50' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}>
                {label}
              </a>
            )
          })}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className={`text-sm transition-colors ${scrolled ? 'text-slate-400 hover:text-[#374151]' : 'text-white/35 hover:text-white/60'}`}>
            Se connecter
          </Link>
          <Link
            href="/register"
            className={`flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-full transition-all hover:-translate-y-0.5 ${
              scrolled
                ? 'bg-[#374151] text-white hover:bg-[#4B5563] shadow-lg shadow-[#374151]/20'
                : 'bg-white text-[#374151] hover:bg-slate-100 shadow-lg shadow-black/30'
            }`}
            style={{ letterSpacing: '-0.01em' }}
          >
            Essayer gratuitement <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile burger */}
        <button
          className={`md:hidden p-2 rounded-xl transition-colors ${scrolled ? 'hover:bg-slate-100' : 'hover:bg-white/5'}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen
            ? <X className={`w-5 h-5 ${scrolled ? 'text-[#374151]' : 'text-white/70'}`} />
            : <Menu className={`w-5 h-5 ${scrolled ? 'text-[#374151]' : 'text-white/70'}`} />
          }
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-5 py-5">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-3 px-2">Fonctionnalités</p>
          <div className="space-y-0.5 mb-4">
            {modules.map(({ icon: Icon, label }, idx) => (
              <button key={label} onClick={() => handleModuleClick(idx)}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm text-slate-600">
                <Icon className="w-4 h-4 text-slate-400" /> {label}
              </button>
            ))}
          </div>
          <div className="space-y-0.5 border-t border-slate-100 pt-4 mb-4">
            <a href="#tarifs"     onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm text-slate-500 hover:text-[#374151] rounded-xl hover:bg-slate-50">Tarifs</a>
            <a href="#faq"        onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm text-slate-500 hover:text-[#374151] rounded-xl hover:bg-slate-50">FAQ</a>
            <Link href="/portail" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm text-slate-500 hover:text-[#374151] rounded-xl hover:bg-slate-50">Espace copropriétaire</Link>
            <Link href="/login"   onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm text-slate-500 hover:text-[#374151] rounded-xl hover:bg-slate-50">Se connecter</Link>
          </div>
          <Link href="/register" onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center gap-2 bg-[#374151] text-white px-4 py-3.5 rounded-xl font-semibold text-sm hover:bg-[#4B5563] transition-colors">
            Démarrer — essai gratuit 14 jours <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </header>
  )
}
