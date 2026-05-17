'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  CreditCard,
  MoreHorizontal,
} from 'lucide-react'

const BOTTOM_NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Copros',    href: '/coproprietes', icon: Building2 },
  { label: 'Messages',  href: '/messages', icon: MessageSquare },
  { label: 'Impayés',   href: '/impayes', icon: CreditCard },
]

interface MobileBottomNavProps {
  unreadMessages?: number
}

export function MobileBottomNav({ unreadMessages = 0 }: MobileBottomNavProps) {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-border safe-bottom">
      <div className="flex items-stretch h-16">
        {BOTTOM_NAV.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors relative',
              isActive(href)
                ? 'text-coplio-green'
                : 'text-muted-foreground hover:text-coplio-text'
            )}
          >
            <div className="relative">
              <Icon className={cn('w-5 h-5', isActive(href) && 'stroke-[2.5px]')} />
              {href === '/messages' && unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </div>
            <span>{label}</span>
            {isActive(href) && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-coplio-green rounded-b-full" />
            )}
          </Link>
        ))}

        {/* Bouton "Plus" — ouvre le drawer existant, géré via un événement custom */}
        <MoreButton />
      </div>
    </nav>
  )
}

function MoreButton() {
  return (
    <button
      className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground hover:text-coplio-text transition-colors"
      onClick={() => {
        document.dispatchEvent(new CustomEvent('open-mobile-sidebar'))
      }}
    >
      <MoreHorizontal className="w-5 h-5" />
      <span>Plus</span>
    </button>
  )
}
