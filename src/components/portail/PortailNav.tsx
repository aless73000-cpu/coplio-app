'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CreditCard, FileText, Wrench, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/accueil', label: 'Accueil', icon: Home },
  { href: '/mes-charges', label: 'Charges', icon: CreditCard },
  { href: '/mes-documents', label: 'Documents', icon: FileText },
  { href: '/mes-travaux', label: 'Travaux', icon: Wrench },
  { href: '/mes-messages', label: 'Messages', icon: MessageCircle },
]

export function PortailNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-border
                    safe-area-pb z-50">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors"
            >
              <Icon
                className={cn(
                  'w-5 h-5 transition-colors',
                  active ? 'text-[#111827]' : 'text-muted-foreground'
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors',
                  active ? 'text-[#111827]' : 'text-muted-foreground'
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
