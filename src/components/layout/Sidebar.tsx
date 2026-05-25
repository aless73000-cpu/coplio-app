'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Settings,
  LogOut,
  CreditCard,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { Profile, Cabinet } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { GlobalSearch } from '@/components/syndic/GlobalSearch'
import { ALL_NAV_ITEMS } from '@/lib/nav-items'
import { useSidebarPrefs } from '@/hooks/useSidebarPrefs'

interface SidebarProps {
  profile: Profile
  cabinet: Cabinet
  unreadMessages?: number
  urgentSinistres?: number
}

const BOTTOM_ITEMS = [
  { label: 'Paramètres',  href: '/parametres', icon: Settings },
  { label: 'Facturation', href: '/facturation', icon: CreditCard },
]

export function Sidebar({
  profile,
  cabinet,
  unreadMessages: initialUnread = 0,
  urgentSinistres = 0,
}: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(initialUnread)
  const [autresOpen, setAutresOpen] = useState(false)

  const { pinnedIds, hydrated } = useSidebarPrefs(profile.id)

  // Split items based on prefs
  const pinnedItems = ALL_NAV_ITEMS.filter(
    (item) => item.alwaysPinned || pinnedIds.includes(item.id),
  )
  const autresItems = ALL_NAV_ITEMS.filter(
    (item) => !item.alwaysPinned && !pinnedIds.includes(item.id),
  )

  useEffect(() => {
    if (pathname === '/messages') setUnreadMessages(0)
  }, [pathname])

  useEffect(() => {
    const supabase = createClient()
    const ch = supabase
      .channel('sidebar-msgs-notifs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          if (payload.new.lien === '/messages' && !payload.new.lu) {
            setUnreadMessages((n) => n + 1)
          }
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [profile.id])

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  const planColors: Record<string, string> = {
    trial: 'bg-white/20 text-white',
    starter: 'bg-white/20 text-white',
    pro: 'bg-amber-400 text-amber-900',
    expert: 'bg-purple-400 text-purple-900',
  }

  const planLabels: Record<string, string> = {
    trial: 'Essai gratuit',
    starter: 'Starter',
    pro: 'Pro',
    expert: 'Expert',
  }

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col h-screen sticky top-0 overflow-y-auto" style={{ background: '#111827' }}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
            <span className="text-white text-sm font-bold">C</span>
          </div>
          <span className="text-white font-semibold text-xl tracking-tight" style={{ letterSpacing: '-0.02em' }}>Coplio</span>
        </Link>
      </div>

      {/* Cabinet info */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-white font-medium text-sm truncate">{cabinet.nom}</p>
            <p className="text-white/50 text-xs truncate">{cabinet.ville || 'Cabinet syndic'}</p>
          </div>
          <span
            className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2',
              planColors[cabinet.plan] || planColors.starter,
            )}
          >
            {planLabels[cabinet.plan] || cabinet.plan}
          </span>
        </div>
      </div>

      {/* Recherche globale */}
      <div className="px-3 py-2 border-b border-white/10">
        <GlobalSearch />
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Items épinglés */}
        {(hydrated ? pinnedItems : ALL_NAV_ITEMS.slice(0, 7)).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn('sidebar-link', isActive(item.href) && 'active')}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
            {item.href === '/messages' && unreadMessages > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </span>
            )}
            {item.href === '/sinistres' && urgentSinistres > 0 && (
              <span className="ml-auto bg-amber-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
                {urgentSinistres > 9 ? '9+' : urgentSinistres}
              </span>
            )}
          </Link>
        ))}

        {/* Section "Autres" — items non épinglés */}
        {hydrated && autresItems.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => setAutresOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors group"
            >
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider group-hover:text-white/60 transition-colors">
                Autres
              </p>
              {autresOpen ? (
                <ChevronUp className="w-3 h-3 text-white/40 group-hover:text-white/60 transition-colors" />
              ) : (
                <ChevronDown className="w-3 h-3 text-white/40 group-hover:text-white/60 transition-colors" />
              )}
            </button>

            {autresOpen && (
              <div className="mt-1 space-y-0.5">
                {autresItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'sidebar-link flex-col items-start gap-0 py-2.5',
                      isActive(item.href) && 'active',
                    )}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    <p className="text-white/40 text-[11px] pl-6 mt-0.5 leading-tight font-normal">
                      {item.description}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Fallback avant hydration : section "Autres" statique */}
        {!hydrated && (
          <div className="pt-3 pb-1">
            <p className="px-3 text-xs font-semibold text-white/30 uppercase tracking-wider">Autres</p>
          </div>
        )}
      </nav>

      {/* Navigation bas */}
      <div className="px-3 py-3 border-t border-white/10 space-y-1">
        {BOTTOM_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn('sidebar-link', isActive(item.href) && 'active')}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </Link>
        ))}

        {/* Profil utilisateur */}
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold uppercase">
                {profile.prenom?.[0]}
                {profile.nom?.[0]}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-medium truncate">
                {profile.prenom} {profile.nom}
              </p>
              <p className="text-white/50 text-xs truncate">{profile.email}</p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="sidebar-link w-full mt-1"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {signingOut ? 'Déconnexion...' : 'Se déconnecter'}
          </button>
        </div>
      </div>
    </aside>
  )
}
