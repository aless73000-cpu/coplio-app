'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home, CreditCard, FileText, MessageCircle, User,
  Wrench, Vote, CalendarDays, MoreHorizontal, Crown, X,
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface PortailBottomNavProps {
  unreadMessages?: number
  isConseil?: boolean
}

const MAIN_ITEMS = [
  { href: '/accueil',       label: 'Accueil',    icon: Home,          matches: ['/accueil'] },
  { href: '/mes-charges',   label: 'Charges',    icon: CreditCard,    matches: ['/mes-charges'] },
  { href: '/mes-documents', label: 'Documents',  icon: FileText,      matches: ['/mes-documents'] },
  { href: '/mes-messages',  label: 'Messages',   icon: MessageCircle, matches: ['/mes-messages'] },
]

const MORE_ITEMS = [
  { href: '/mes-assemblees', label: 'Assemblées', icon: CalendarDays, matches: ['/mes-assemblees'] },
  { href: '/mes-travaux',    label: 'Travaux',    icon: Wrench,       matches: ['/mes-travaux'] },
  { href: '/mes-votes',      label: 'Votes',      icon: Vote,         matches: ['/mes-votes'] },
  { href: '/mon-compte',     label: 'Mon compte', icon: User,         matches: ['/mon-compte'] },
]

export function PortailBottomNav({ unreadMessages = 0, isConseil = false }: PortailBottomNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Fermer le drawer quand on navigue
  useEffect(() => { setOpen(false) }, [pathname])

  const isActive = (matches: string[]) =>
    matches.some((m) => pathname === m || pathname.startsWith(m + '/'))

  // Les items "Plus" incluent aussi Espace conseil si membre
  const moreItems = isConseil
    ? [
        ...MORE_ITEMS.slice(0, 3),
        { href: '/espace-conseil', label: 'Espace conseil', icon: Crown, matches: ['/espace-conseil'] },
        MORE_ITEMS[3],
      ]
    : MORE_ITEMS

  // Détecter si le pathname actuel est dans "Plus"
  const isMoreActive = moreItems.some((item) => isActive(item.matches))

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer "Plus" */}
      <div
        className={cn(
          'fixed left-0 right-0 z-50 md:hidden transition-transform duration-300 ease-out',
          open ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{ bottom: '64px' }}
      >
        <div className="mx-3 mb-2 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
          style={{ background: '#0f172a' }}>
          {/* Header drawer */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Navigation</span>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Items */}
          <div className="grid grid-cols-2 gap-px p-3">
            {moreItems.map(({ href, label, icon: Icon, matches }) => {
              const active = isActive(matches)
              const isEspaceConseil = href === '/espace-conseil'
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all',
                    active
                      ? isEspaceConseil
                        ? 'bg-amber-400/20 text-amber-300'
                        : 'bg-white/10 text-white'
                      : isEspaceConseil
                        ? 'text-amber-400/80 hover:bg-amber-400/10'
                        : 'text-white/60 hover:bg-white/10 hover:text-white/90'
                  )}
                >
                  <Icon className={cn(
                    'w-4.5 h-4.5 flex-shrink-0',
                    active
                      ? isEspaceConseil ? 'text-amber-300' : 'text-white'
                      : isEspaceConseil ? 'text-amber-400/70' : 'text-white/40'
                  )} strokeWidth={active ? 2.5 : 1.8} />
                  <span className={cn(
                    'text-sm font-medium',
                    isEspaceConseil && !active ? 'text-amber-400/80' : ''
                  )}>
                    {label}
                  </span>
                  {isEspaceConseil && (
                    <span className="ml-auto text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded-md font-semibold">CS</span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-slate-200"
        style={{ background: '#0f172a' }}>
        <div className="flex h-16">
          {MAIN_ITEMS.map(({ href, label, icon: Icon, matches }) => {
            const active = isActive(matches)
            const showBadge = label === 'Messages' && unreadMessages > 0
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center gap-1 relative min-w-0"
              >
                {active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-white rounded-b-full" />
                )}
                <div className="relative">
                  <Icon
                    className={cn('w-5 h-5 transition-colors', active ? 'text-white' : 'text-white/40')}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-red-400 rounded-full flex items-center justify-center text-white text-[9px] font-bold leading-none">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </div>
                <span className={cn('text-[10px] font-medium leading-none', active ? 'text-white' : 'text-white/40')}>
                  {label}
                </span>
              </Link>
            )
          })}

          {/* Bouton Plus */}
          <button
            onClick={() => setOpen(!open)}
            className="flex-1 flex flex-col items-center justify-center gap-1 relative min-w-0"
          >
            {isMoreActive && !open && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-white rounded-b-full" />
            )}
            <div className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center transition-all',
              open ? 'bg-white/15' : isMoreActive ? 'bg-white/10' : ''
            )}>
              <MoreHorizontal
                className={cn('w-5 h-5 transition-colors', open || isMoreActive ? 'text-white' : 'text-white/40')}
                strokeWidth={open ? 2.5 : 1.8}
              />
            </div>
            <span className={cn('text-[10px] font-medium leading-none', open || isMoreActive ? 'text-white' : 'text-white/40')}>
              Plus
            </span>
          </button>
        </div>
        <div style={{ height: 'env(safe-area-inset-bottom, 0px)', background: '#0f172a' }} />
      </nav>
    </>
  )
}
