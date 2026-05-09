'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, CreditCard, FileText, Wrench, MessageCircle, User, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface PortailSidebarProps {
  prenom: string | null
  nom: string | null
  email: string | null
  lotNumero: string | null
  coproprieteNom: string | null
}

const NAV_ITEMS = [
  { href: '/accueil', label: 'Accueil', icon: Home },
  { href: '/mes-charges', label: 'Mes charges', icon: CreditCard },
  { href: '/mes-documents', label: 'Mes documents', icon: FileText },
  { href: '/mes-travaux', label: 'Travaux & sinistres', icon: Wrench },
  { href: '/mes-messages', label: 'Messagerie', icon: MessageCircle },
]

export function PortailSidebar({ prenom, nom, email, lotNumero, coproprieteNom }: PortailSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/portail')
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const initials = `${prenom?.[0] ?? ''}${nom?.[0] ?? ''}`.toUpperCase()

  return (
    <aside className="w-64 flex-shrink-0 bg-coplio-green flex flex-col h-screen sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <Link href="/accueil" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-coplio-green" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Coplio</span>
        </Link>
      </div>

      {/* Résidence + lot */}
      <div className="px-4 py-3 border-b border-white/10">
        <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Mon lot</p>
        <p className="text-white font-medium text-sm truncate">{coproprieteNom ?? '—'}</p>
        {lotNumero && (
          <p className="text-white/60 text-xs mt-0.5">Lot {lotNumero}</p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn('sidebar-link', isActive(href) && 'active')}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bas : compte + déconnexion */}
      <div className="px-3 py-3 border-t border-white/10 space-y-1">
        <Link
          href="/mon-compte"
          className={cn('sidebar-link', isActive('/mon-compte') && 'active')}
        >
          <User className="w-4 h-4 flex-shrink-0" />
          Mon compte
        </Link>

        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-medium truncate">{prenom} {nom}</p>
              <p className="text-white/50 text-xs truncate">{email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="sidebar-link w-full mt-1"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {signingOut ? 'Déconnexion...' : 'Se déconnecter'}
          </button>
        </div>
      </div>
    </aside>
  )
}
