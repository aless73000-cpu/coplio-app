'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, CreditCard, FileText, Wrench, MessageCircle } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/accueil',       label: 'Accueil',    icon: Home },
  { href: '/mes-charges',   label: 'Charges',    icon: CreditCard },
  { href: '/mes-documents', label: 'Documents',  icon: FileText },
  { href: '/mes-travaux',   label: 'Travaux',    icon: Wrench },
  { href: '/mes-messages',  label: 'Messages',   icon: MessageCircle },
]

export function PortailBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border flex md:hidden safe-bottom">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors',
              active ? 'text-coplio-green' : 'text-muted-foreground'
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
            {active && (
              <span className="absolute bottom-0 w-8 h-0.5 bg-coplio-green rounded-full" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
