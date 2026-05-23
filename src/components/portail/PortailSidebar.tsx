'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home, Briefcase, Building2, MessageCircle,
  User, LogOut, ChevronRight, Bell,
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
}

// 5 main nav groups
const NAV_GROUPS = [
  {
    href: '/accueil',
    label: 'Accueil',
    sub: 'Tableau de bord',
    icon: Home,
    matches: ['/accueil'],
  },
  {
    href: '/mes-charges',
    label: 'Ma vie',
    sub: 'Charges · Documents · Agenda',
    icon: Briefcase,
    matches: ['/mes-charges', '/mes-documents', '/mon-calendrier'],
  },
  {
    href: '/mes-travaux',
    label: 'Ma copropriété',
    sub: 'Travaux · AG · Votes',
    icon: Building2,
    matches: ['/mes-travaux', '/mes-assemblees', '/mes-votes', '/mes-signatures'],
  },
  {
    href: '/mes-messages',
    label: 'Messages',
    sub: null,
    icon: MessageCircle,
    matches: ['/mes-messages'],
  },
]

export function PortailSidebar({ prenom, nom, email, lotNumero, coproprieteNom, unreadMessages = 0, unreadNotifications = 0 }: PortailSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/portail')
  }

  const isGroupActive = (matches: string[]) =>
    matches.some((m) => pathname === m || pathname.startsWith(m + '/'))

  const isAccountActive = pathname === '/mon-compte' || pathname.startsWith('/mon-compte/')

  const initials = `${prenom?.[0] ?? ''}${nom?.[0] ?? ''}`.toUpperCase() || '?'

  return (
    <aside className="hidden md:flex w-60 flex-shrink-0 bg-white border-r border-border flex-col h-screen sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center justify-between">
          <Link href="/accueil" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-coplio-green rounded-xl flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-coplio-text tracking-tight">Coplio</span>
          </Link>
          <Link href="/mes-notifications" className="relative w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-coplio-text hover:bg-coplio-bg transition-colors">
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-coplio-red rounded-full" />
            )}
          </Link>
        </div>
      </div>

      {/* Lot info card */}
      <div className="px-3 pt-4 pb-2">
        <div className="bg-coplio-bg rounded-xl px-3 py-2.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-0.5">Mon logement</p>
          <p className="text-sm font-semibold text-coplio-text truncate">{coproprieteNom ?? '—'}</p>
          {lotNumero && (
            <p className="text-xs text-muted-foreground mt-0.5">Lot {lotNumero}</p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {NAV_GROUPS.map(({ href, label, sub, icon: Icon, matches }) => {
          const active = isGroupActive(matches)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative',
                active
                  ? 'bg-coplio-green-light text-coplio-green'
                  : 'text-muted-foreground hover:bg-coplio-bg hover:text-coplio-text'
              )}
            >
              {/* Left active indicator */}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-coplio-green rounded-r-full" />
              )}
              <Icon className={cn(
                'w-4 h-4 flex-shrink-0 transition-colors',
                active ? 'text-coplio-green' : 'text-muted-foreground group-hover:text-coplio-text'
              )} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    'text-sm font-medium leading-tight',
                    active ? 'text-coplio-green' : 'text-coplio-text'
                  )}>
                    {label}
                  </span>
                  {label === 'Messages' && unreadMessages > 0 && (
                    <span className="bg-coplio-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </div>
                {sub && (
                  <p className={cn(
                    'text-[10px] leading-tight mt-0.5 truncate',
                    active ? 'text-coplio-green/70' : 'text-muted-foreground'
                  )}>
                    {sub}
                  </p>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Separator */}
      <div className="px-3 pb-1">
        <div className="border-t border-border" />
      </div>

      {/* Account section */}
      <div className="px-3 pb-4 pt-1">
        <Link
          href="/mon-compte"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150',
            isAccountActive
              ? 'bg-coplio-green-light text-coplio-green'
              : 'text-muted-foreground hover:bg-coplio-bg hover:text-coplio-text'
          )}
        >
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold',
            isAccountActive ? 'bg-coplio-green text-white' : 'bg-coplio-bg text-coplio-text'
          )}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn(
              'text-sm font-medium truncate',
              isAccountActive ? 'text-coplio-green' : 'text-coplio-text'
            )}>
              {prenom} {nom}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">{email}</p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        </Link>

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:text-coplio-red hover:bg-red-50 transition-all duration-150 mt-0.5"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{signingOut ? 'Déconnexion...' : 'Se déconnecter'}</span>
        </button>
      </div>
    </aside>
  )
}
