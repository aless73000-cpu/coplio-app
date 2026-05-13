'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, FileStack, PenLine, Archive } from 'lucide-react'

const TABS = [
  { href: '/documents',  label: 'Documents',       icon: FileText },
  { href: '/modeles',    label: 'Modèles',          icon: FileStack },
  { href: '/signatures', label: 'Signatures',       icon: PenLine },
  { href: '/archives',   label: 'Archives légales', icon: Archive },
]

export function DocTabs() {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 bg-coplio-bg p-1 rounded-xl">
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(tab.href + '/')
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'bg-white text-coplio-text shadow-sm'
                : 'text-muted-foreground hover:text-coplio-text'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
