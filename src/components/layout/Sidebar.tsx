'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  AlertTriangle,
  CalendarDays,
  CreditCard,
  Settings,
  LogOut,
  Home,
  Receipt,
  MessageSquare,
  Calendar,
  Upload,
  FileStack,
  UsersRound,
  Wrench,
  BookOpen,
  BellRing,
} from 'lucide-react'
import type { Profile, Cabinet } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface SidebarProps {
  profile: Profile
  cabinet: Cabinet
  unreadMessages?: number
}

const NAV_ITEMS = [
  {
    label: 'Tableau de bord',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Copropriétés',
    href: '/coproprietes',
    icon: Building2,
  },
  {
    label: 'Copropriétaires',
    href: '/coproprietaires',
    icon: Users,
  },
  {
    label: 'Documents',
    href: '/documents',
    icon: FileText,
  },
  {
    label: 'Sinistres',
    href: '/sinistres',
    icon: AlertTriangle,
  },
  {
    label: 'Assemblées',
    href: '/assemblees',
    icon: CalendarDays,
  },
  {
    label: 'Appels de charges',
    href: '/appels-charges',
    icon: Receipt,
  },
  {
    label: 'Impayés',
    href: '/impayes',
    icon: CreditCard,
  },
  {
    label: 'Agenda',
    href: '/agenda',
    icon: Calendar,
  },
  {
    label: 'Messages',
    href: '/messages',
    icon: MessageSquare,
  },
  {
    label: 'Modèles',
    href: '/modeles',
    icon: FileStack,
  },
  {
    label: 'Prestataires',
    href: '/prestataires',
    icon: Wrench,
  },
  {
    label: 'Carnet d\'entretien',
    href: '/carnet-entretien',
    icon: BookOpen,
  },
  {
    label: 'Relances auto',
    href: '/relances-config',
    icon: BellRing,
  },
]

const BOTTOM_ITEMS = [
  {
    label: 'Équipe',
    href: '/equipe',
    icon: UsersRound,
  },
  {
    label: 'Import CSV',
    href: '/importer',
    icon: Upload,
  },
  {
    label: 'Paramètres',
    href: '/parametres',
    icon: Settings,
  },
  {
    label: 'Facturation',
    href: '/facturation',
    icon: CreditCard,
  },
]

export function Sidebar({ profile, cabinet, unreadMessages: initialUnread = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(initialUnread)

  // Remettre à zéro quand on est sur la page messages
  useEffect(() => {
    if (pathname === '/messages') setUnreadMessages(0)
  }, [pathname])

  // Temps réel : écoute les nouvelles notifications de type message
  useEffect(() => {
    const supabase = createClient()
    const ch = supabase
      .channel('sidebar-msgs-notifs')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${profile.id}`,
      }, (payload) => {
        if (payload.new.lien === '/messages' && !payload.new.lu) {
          setUnreadMessages(n => n + 1)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [profile.id])

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  const planColors: Record<string, string> = {
    trial: 'bg-white/20 text-white',
    starter: 'bg-white/20 text-white',
    pro: 'bg-amber-400 text-amber-900',
    expert: 'bg-purple-400 text-purple-900',
  }

  const planLabels: Record<string, string> = {
    trial: 'Essai gratuit',
    starter: 'Starter',
    pro: 'Pro',
    expert: 'Expert',
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-coplio-green flex flex-col h-screen sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-coplio-green" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Coplio</span>
        </Link>
      </div>

      {/* Cabinet info */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-white font-medium text-sm truncate">{cabinet.nom}</p>
            <p className="text-white/50 text-xs truncate">{cabinet.ville || 'Cabinet syndic'}</p>
          </div>
          <span className={cn(
            'text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2',
            planColors[cabinet.plan] || planColors.starter
          )}>
            {planLabels[cabinet.plan] || cabinet.plan}
          </span>
        </div>
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'sidebar-link',
              isActive(item.href) && 'active'
            )}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
            {/* Badge impayés (exemple dynamique à brancher) */}
            {item.href === '/messages' && unreadMessages > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Navigation bas */}
      <div className="px-3 py-3 border-t border-white/10 space-y-1">
        {BOTTOM_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn('sidebar-link', isActive(item.href) && 'active')}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </Link>
        ))}

        {/* Profil utilisateur */}
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold uppercase">
                {profile.prenom?.[0]}{profile.nom?.[0]}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-medium truncate">
                {profile.prenom} {profile.nom}
              </p>
              <p className="text-white/50 text-xs truncate">{profile.email}</p>
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
