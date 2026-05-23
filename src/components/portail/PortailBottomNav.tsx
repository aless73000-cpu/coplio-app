'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, Briefcase, Building2, MessageCircle, User } from 'lucide-react'

interface PortailBottomNavProps {
  unreadMessages?: number
}

const NAV_ITEMS = [
  {
    href: '/accueil',
    label: 'Accueil',
    icon: Home,
    matches: ['/accueil'],
  },
  {
    href: '/mes-charges',
    label: 'Ma vie',
    icon: Briefcase,
    matches: ['/mes-charges', '/mes-documents', '/mon-calendrier'],
  },
  {
    href: '/mes-travaux',
    label: 'Copro',
    icon: Building2,
    matches: ['/mes-travaux', '/mes-assemblees', '/mes-votes', '/mes-signatures'],
  },
  {
    href: '/mes-messages',
    label: 'Messages',
    icon: MessageCircle,
    matches: ['/mes-messages'],
  },
  {
    href: '/mon-compte',
    label: 'Compte',
    icon: User,
    matches: ['/mon-compte'],
  },
]

export function PortailBottomNav({ unreadMessages = 0 }: PortailBottomNavProps) {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-sm border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map(({ href, label, icon: Icon, matches }) => {
          const active = matches.some((m) => pathname === m || pathname.startsWith(m + '/'))
          const showBadge = label === 'Messages' && unreadMessages > 0

          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 relative"
            >
              <div className="relative">
                <div className={cn(
                  'flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200',
                  active ? 'bg-coplio-green-light' : ''
                )}>
                  <Icon className={cn(
                    'w-5 h-5 transition-colors duration-200',
                    active ? 'text-coplio-green' : 'text-muted-foreground'
                  )} strokeWidth={active ? 2.5 : 2} />
                </div>
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-coplio-red rounded-full flex items-center justify-center text-white text-[8px] font-bold">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </div>
              <span className={cn(
                'text-[10px] font-medium leading-none transition-colors duration-200',
                active ? 'text-coplio-green' : 'text-muted-foreground'
              )}>
                {label}
              </span>
              {active && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-coplio-green rounded-t-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
