'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, CreditCard, Wrench, PenLine, MessageCircle } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/accueil',        label: 'Accueil',     icon: Home },
  { href: '/mes-charges',    label: 'Charges',     icon: CreditCard },
  { href: '/mes-travaux',    label: 'Travaux',     icon: Wrench },
  { href: '/mes-signatures', label: 'Signatures',  icon: PenLine },
  { href: '/mes-messages',   label: 'Messages',    icon: MessageCircle },
]

export function PortailBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-sm border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch h-[60px]">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-[3px]"
            >
              <div className={cn(
                'flex items-center justify-center w-10 h-[26px] rounded-full transition-all duration-200',
                active ? 'bg-coplio-green-light' : ''
              )}>
                <Icon className={cn(
                  'w-[19px] h-[19px] transition-colors duration-200',
                  active ? 'text-coplio-green stroke-[2.5px]' : 'text-muted-foreground'
                )} />
              </div>
              <span className={cn(
                'text-[10px] font-medium leading-none transition-colors duration-200',
                active ? 'text-coplio-green' : 'text-muted-foreground'
              )}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
