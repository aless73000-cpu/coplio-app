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
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch h-[60px]">
        {BOTTOM_NAV.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center gap-[3px]"
          >
            <div className={cn(
              'flex items-center justify-center w-10 h-[26px] rounded-full transition-all duration-200 relative',
              isActive(href) ? 'bg-coplio-green-light' : ''
            )}>
              <Icon className={cn(
                'w-[19px] h-[19px] transition-colors duration-200',
                isActive(href) ? 'text-coplio-green stroke-[2.5px]' : 'text-muted-foreground'
              )} />
              {href === '/messages' && unreadMessages > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </div>
            <span className={cn(
              'text-[10px] font-medium leading-none transition-colors duration-200',
              isActive(href) ? 'text-coplio-green' : 'text-muted-foreground'
            )}>
              {label}
            </span>
          </Link>
        ))}
        <MoreButton />
      </div>
    </nav>
  )
}

function MoreButton() {
  return (
    <button
      className="flex-1 flex flex-col items-center justify-center gap-[3px]"
      onClick={() => document.dispatchEvent(new CustomEvent('open-mobile-sidebar'))}
    >
      <div className="flex items-center justify-center w-10 h-[26px]">
        <MoreHorizontal className="w-[19px] h-[19px] text-muted-foreground" />
      </div>
      <span className="text-[10px] font-medium leading-none text-muted-foreground">Plus</span>
    </button>
  )
}
