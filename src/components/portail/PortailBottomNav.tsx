'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, Briefcase, Building2, MessageCircle, User } from 'lucide-react'

interface PortailBottomNavProps {
  unreadMessages?: number
}

const NAV_ITEMS = [
  { href: '/accueil',     label: 'Accueil',   icon: Home,          matches: ['/accueil'] },
  { href: '/mes-charges', label: 'Ma vie',    icon: Briefcase,     matches: ['/mes-charges', '/mes-documents', '/mon-calendrier', '/mes-contacts'] },
  { href: '/mes-travaux', label: 'Copro',     icon: Building2,     matches: ['/mes-travaux', '/mes-assemblees', '/mes-votes', '/mes-signatures'] },
  { href: '/mes-messages',label: 'Messages',  icon: MessageCircle, matches: ['/mes-messages'] },
  { href: '/mon-compte',  label: 'Compte',    icon: User,          matches: ['/mon-compte'] },
]

export function PortailBottomNav({ unreadMessages = 0 }: PortailBottomNavProps) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-border">
      {/* Touch targets — always 64px */}
      <div className="flex h-16">
        {NAV_ITEMS.map(({ href, label, icon: Icon, matches }) => {
          const active = matches.some((m) => pathname === m || pathname.startsWith(m + '/'))
          const showBadge = label === 'Messages' && unreadMessages > 0

          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative min-w-0"
            >
              <div className="relative">
                <Icon
                  className={cn(
                    'w-[22px] h-[22px] transition-colors',
                    active ? 'text-[#374151]' : 'text-gray-400'
                  )}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                {showBadge && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-coplio-red rounded-full flex items-center justify-center text-white text-[9px] font-bold leading-none">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </div>
              <span className={cn(
                'text-[10px] font-medium leading-none mt-0.5',
                active ? 'text-[#374151]' : 'text-gray-400'
              )}>
                {label}
              </span>
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#374151] rounded-b-full" />
              )}
            </Link>
          )
        })}
      </div>
      {/* Safe area spacer — fills iPhone home indicator zone */}
      <div style={{ height: 'env(safe-area-inset-bottom, 0px)', background: 'white' }} />
    </nav>
  )
}
