'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, CreditCard, FileText, MessageCircle, User } from 'lucide-react'

interface PortailBottomNavProps {
  unreadMessages?: number
}

const NAV_ITEMS = [
  { href: '/accueil',       label: 'Accueil',    icon: Home,          matches: ['/accueil'] },
  { href: '/mes-charges',   label: 'Charges',    icon: CreditCard,    matches: ['/mes-charges'] },
  { href: '/mes-documents', label: 'Documents',  icon: FileText,      matches: ['/mes-documents', '/mes-assemblees', '/mes-travaux', '/mes-votes'] },
  { href: '/mes-messages',  label: 'Messages',   icon: MessageCircle, matches: ['/mes-messages'] },
  { href: '/mon-compte',    label: 'Compte',     icon: User,          matches: ['/mon-compte'] },
]

export function PortailBottomNav({ unreadMessages = 0 }: PortailBottomNavProps) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-slate-200"
      style={{ background: '#0f172a' }}>
      <div className="flex h-16">
        {NAV_ITEMS.map(({ href, label, icon: Icon, matches }) => {
          const active = matches.some((m) => pathname === m || pathname.startsWith(m + '/'))
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
                  className={cn(
                    'w-5 h-5 transition-colors',
                    active ? 'text-white' : 'text-white/40'
                  )}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                {showBadge && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-red-400 rounded-full flex items-center justify-center text-white text-[9px] font-bold leading-none">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </div>
              <span className={cn(
                'text-[10px] font-medium leading-none',
                active ? 'text-white' : 'text-white/40'
              )}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
      <div style={{ height: 'env(safe-area-inset-bottom, 0px)', background: '#0f172a' }} />
    </nav>
  )
}
