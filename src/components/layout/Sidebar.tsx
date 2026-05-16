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
  AlertCircle,
  Settings,
  LogOut,
  Home,
  Receipt,
  MessageSquare,
  Calendar,
  UsersRound,
  Wrench,
  Sparkles,
  BookOpen,
  Bell,
  Vote,
} from 'lucide-react'
import type { Profile, Cabinet } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { GlobalSearch } from '@/components/syndic/GlobalSearch'

interface SidebarProps {
  profile: Profile
  cabinet: Cabinet
  unreadMessages?: number
  urgentSinistres?: number
}

const NAV_ITEMS = [
  { label: 'Tableau de bord',   href: '/dashboard',      icon: LayoutDashboard },
  { label: 'Copropriétés',      href: '/coproprietes',   icon: Building2 },
  { label: 'Copropriétaires',   href: '/coproprietaires',icon: Users },
  { label: 'Assemblées',        href: '/assemblees',     icon: CalendarDays },
  { label: 'Votes',             href: '/votes',          icon: Vote },
  { label: 'Appels de charges', href: '/appels-charges', icon: Receipt },
  { label: 'Impayés',           href: '/impayes',        icon: AlertCircle },
  { label: 'Sinistres',         href: '/sinistres',      icon: AlertTriangle },
  { label: 'Messages',          href: '/messages',       icon: MessageSquare },
  { label: 'Documents',         href: '/documents',      icon: FileText },
  { label: 'Assistant IA',      href: '/ia',             icon: Sparkles },
]

// Outils — accès secondaire, visible mais moins mis en avant
const OUTILS_ITEMS = [
  { label: 'Agenda',            href: '/agenda',          icon: Calendar },
  { label: 'Prestataires',      href: '/prestataires',    icon: Wrench },
  { label: "Carnet d'entretien",href: '/carnet-entretien', icon: BookOpen },
  { label: 'Relances auto',     href: '/relances-config', icon: Bell },
]

const BOTTOM_ITEMS = [
  { label: 'Équipe',      href: '/equipe',     icon: UsersRound },
  { label: 'Paramètres',  href: '/parametres', icon: Settings },
  { label: 'Facturation', href: '/facturation',icon: CreditCard },
]

export function Sidebar({ profile, cabinet, unreadMessages: initialUnread = 0, urgentSinistres = 0 }: SidebarProps) {
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

      {/* Recherche globale */}
      <div className="px-3 py-2 border-b border-white/10">
        <GlobalSearch />
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn('sidebar-link', isActive(item.href) && 'active')}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
            {item.href === '/messages' && unreadMessages > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </span>
            )}
            {item.href === '/sinistres' && urgentSinistres > 0 && (
              <span className="ml-auto bg-coplio-amber text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
                {urgentSinistres > 9 ? '9+' : urgentSinistres}
              </span>
            )}
          </Link>
        ))}

        {/* Séparateur Outils */}
        <div className="pt-3 pb-1">
          <p className="px-3 text-xs font-semibold text-white/30 uppercase tracking-wider">Outils</p>
        </div>
        {OUTILS_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn('sidebar-link', isActive(item.href) && 'active')}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
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
