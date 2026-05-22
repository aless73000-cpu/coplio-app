'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Building2, MessageSquare, AlertCircle, FileText } from 'lucide-react'

interface SyndicBottomNavProps {
  unreadMessages?: number
}

const NAV_ITEMS = [
  { href: '/dashboard',    label: 'Accueil',    icon: LayoutDashboard },
  { href: '/coproprietes', label: 'Résidences', icon: Building2 },
  { href: '/messages',     label: 'Messages',   icon: MessageSquare },
  { href: '/impayes',      label: 'Impayés',    icon: AlertCircle },
  { href: '/documents',    label: 'Documents',  icon: FileText },
]

export function SyndicBottomNav({ unreadMessages = 0 }: SyndicBottomNavProps) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border flex md:hidden safe-bottom">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        const showBadge = href === '/messages' && unreadMessages > 0 && pathname !== '/messages'
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors relative',
              active ? 'text-coplio-green' : 'text-muted-foreground'
            )}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {showBadge && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium leading-none">{label}</span>
            {active && (
              <span className="absolute bottom-0 w-8 h-0.5 bg-coplio-green rounded-full" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
