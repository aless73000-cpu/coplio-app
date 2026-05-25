'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Menu,
  X,
  CreditCard,
  Settings,
  LogOut,
  ChevronDown,
  ChevronUp,
  Building2,
} from 'lucide-react'
import type { Profile, Cabinet } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { GlobalSearch } from '@/components/syndic/GlobalSearch'
import { ALL_NAV_ITEMS } from '@/lib/nav-items'
import { useSidebarPrefs } from '@/hooks/useSidebarPrefs'

const BOTTOM_ITEMS = [
  { label: 'Paramètres', href: '/parametres', icon: Settings },
  { label: 'Facturation', href: '/facturation', icon: CreditCard },
]

interface MobileSidebarProps {
  profile: Profile
  cabinet: Cabinet
  unreadMessages?: number
  urgentSinistres?: number
}

export function MobileSidebar({
  profile,
  cabinet,
  unreadMessages = 0,
  urgentSinistres = 0,
}: MobileSidebarProps) {
  const [open, setOpen] = useState(false)
  const [autresOpen, setAutresOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const { pinnedIds, hydrated } = useSidebarPrefs(profile.id)

  const pinnedItems = ALL_NAV_ITEMS.filter(
    (item) => item.alwaysPinned || pinnedIds.includes(item.id),
  )
  const autresItems = ALL_NAV_ITEMS.filter(
    (item) => !item.alwaysPinned && !pinnedIds.includes(item.id),
  )

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    const handler = () => setOpen(true)
    document.addEventListener('open-mobile-sidebar', handler)
    return () => document.removeEventListener('open-mobile-sidebar', handler)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  const planLabels: Record<string, string> = {
    trial: 'Essai',
    starter: 'Starter',
    pro: 'Pro',
    expert: 'Expert',
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 rounded-lg hover:bg-slate-50 transition-colors"
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-5 h-5 text-coplio-text" />
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={cn(
          'fixed top-0 left-0 h-full w-72 z-50 flex flex-col transition-transform duration-300 md:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ background: '#374151' }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
              <Building2 className="w-4 h-4 text-white/80" />
            </div>
            <span className="text-white font-bold text-xl">Coplio</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Cabinet */}
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-white font-medium text-sm truncate">{cabinet.nom}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-white/50 text-xs truncate">
              {cabinet.ville || 'Cabinet syndic'}
            </p>
            <span className="text-xs font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">
              {planLabels[cabinet.plan] || cabinet.plan}
            </span>
          </div>
        </div>

        {/* Recherche */}
        <div className="px-3 py-2 border-b border-white/10">
          <GlobalSearch />
        </div>

        {/* Nav */}
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

          {/* Autres — items non épinglés */}
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
        </nav>

        {/* Bas */}
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

          <div className="pt-3 border-t border-white/10">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold uppercase">
                  {profile.prenom?.[0]}
                  {profile.nom?.[0]}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {profile.prenom} {profile.nom}
                </p>
                <p className="text-white/50 text-xs truncate">{profile.email}</p>
              </div>
            </div>
            <button onClick={handleSignOut} className="sidebar-link w-full mt-1">
              <LogOut className="w-4 h-4 flex-shrink-0" />
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
