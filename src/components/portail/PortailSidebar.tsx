'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home, FileText, CreditCard, Building2,
  MessageCircle, User, LogOut, Bell,
  CalendarDays, Wrench, Vote, ChevronRight, Crown, BookUser, PenLine,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface PortailSidebarProps {
  prenom: string | null
  nom: string | null
  email: string | null
  lotNumero: string | null
  coproprieteNom: string | null
  unreadMessages?: number
  unreadNotifications?: number
  isConseil?: boolean
}

const NAV_ITEMS = [
  { href: '/accueil',        label: 'Accueil',       icon: Home,          matches: ['/accueil'] },
  { href: '/mes-charges',    label: 'Mes charges',   icon: CreditCard,    matches: ['/mes-charges'] },
  { href: '/mes-documents',  label: 'Documents',     icon: FileText,      matches: ['/mes-documents'] },
  { href: '/mes-assemblees', label: 'Assemblées',    icon: CalendarDays,  matches: ['/mes-assemblees'] },
  { href: '/mes-travaux',    label: 'Travaux',       icon: Wrench,        matches: ['/mes-travaux'] },
  { href: '/mes-votes',      label: 'Votes',         icon: Vote,          matches: ['/mes-votes'] },
  { href: '/mes-messages',   label: 'Messages',      icon: MessageCircle, matches: ['/mes-messages'] },
  { href: '/mes-contacts',      label: 'Annuaire',       icon: BookUser,      matches: ['/mes-contacts'] },
  { href: '/mon-calendrier',    label: 'Calendrier',     icon: CalendarDays,  matches: ['/mon-calendrier'] },
  { href: '/mes-notifications', label: 'Notifications',  icon: Bell,          matches: ['/mes-notifications'] },
  { href: '/mes-signatures',    label: 'Signatures',     icon: PenLine,       matches: ['/mes-signatures'] },
]

export function PortailSidebar({
  prenom, nom, email, lotNumero, coproprieteNom,
  unreadMessages = 0, unreadNotifications = 0, isConseil = false,
}: PortailSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/portail')
  }

  const isActive = (matches: string[]) =>
    matches.some((m) => pathname === m || pathname.startsWith(m + '/'))

  const isAccountActive = pathname === '/mon-compte' || pathname.startsWith('/mon-compte/')
  const initials = `${prenom?.[0] ?? ''}${nom?.[0] ?? ''}`.toUpperCase() || '?'

  return (
    <aside className="hidden md:flex w-56 flex-shrink-0 flex-col h-screen sticky top-0 overflow-y-auto"
      style={{ background: '#0f172a' }}>

      {/* Logo + notif */}
      <div className="px-4 py-5 flex items-center justify-between flex-shrink-0">
        <Link href="/accueil" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
            <Home className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base text-white tracking-tight">Coplio</span>
        </Link>
        <Link
          href="/mes-notifications"
          className="relative w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full" />
          )}
        </Link>
      </div>

      {/* Logement — cliquable */}
      <div className="px-3 pb-4 flex-shrink-0">
        <Link
          href="/mon-logement"
          className="group flex items-center gap-2.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-xl px-3 py-2.5 transition-all"
        >
          <Home className="w-3.5 h-3.5 text-white/40 group-hover:text-white/70 flex-shrink-0 transition-colors" />
          <div className="flex-1 min-w-0">
            <p className="text-[9px] text-white/40 uppercase tracking-widest font-semibold mb-0.5">Mon logement</p>
            <p className="text-sm font-semibold text-white/90 truncate">{coproprieteNom ?? '—'}</p>
            {lotNumero && (
              <p className="text-xs text-white/50 mt-0.5">Lot {lotNumero}</p>
            )}
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 flex-shrink-0 transition-colors" />
        </Link>
      </div>

      {/* Séparateur */}
      <div className="px-4 mb-2">
        <div className="border-t border-white/10" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon, matches }) => {
          const active = isActive(matches)
          const showBadge = label === 'Messages' && unreadMessages > 0
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative',
                active
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:bg-white/5 hover:text-white/80'
              )}
            >
              <Icon className={cn(
                'w-4 h-4 flex-shrink-0 transition-colors',
                active ? 'text-white' : 'text-white/40 group-hover:text-white/70'
              )} />
              <span className={cn(
                'flex-1 text-sm font-medium leading-tight',
                active ? 'text-white' : ''
              )}>
                {label}
              </span>
              {showBadge && (
                <span className="bg-red-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white/60 rounded-r-full" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Séparateur bas */}
      <div className="px-4 mt-2 mb-2 flex-shrink-0">
        <div className="border-t border-white/10" />
      </div>

      {/* Espace conseil — visible seulement si membre */}
      {isConseil && (
        <div className="px-3 mb-2 flex-shrink-0">
          <Link
            href="/espace-conseil"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group',
              isActive(['/espace-conseil'])
                ? 'bg-amber-400/20 text-amber-300'
                : 'text-amber-400/70 hover:bg-amber-400/10 hover:text-amber-300'
            )}
          >
            <Crown className={cn(
              'w-4 h-4 flex-shrink-0',
              isActive(['/espace-conseil']) ? 'text-amber-300' : 'text-amber-400/50 group-hover:text-amber-300'
            )} />
            <span className="text-sm font-semibold">Espace conseil</span>
          </Link>
        </div>
      )}

      {/* Compte + déconnexion */}
      <div className="px-3 pb-5 flex-shrink-0 space-y-0.5">
        <Link
          href="/mon-compte"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group',
            isAccountActive
              ? 'bg-white/10 text-white'
              : 'text-white/50 hover:bg-white/5 hover:text-white/80'
          )}
        >
          <div className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold',
            isAccountActive ? 'bg-white text-[#0f172a]' : 'bg-white/10 text-white/70'
          )}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/80 truncate leading-tight">
              {prenom} {nom}
            </p>
            <p className="text-[10px] text-white/40 truncate">{email}</p>
          </div>
        </Link>

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-white/30 hover:text-red-400 hover:bg-white/5 transition-all duration-150"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{signingOut ? 'Déconnexion...' : 'Se déconnecter'}</span>
        </button>
      </div>
    </aside>
  )
}
