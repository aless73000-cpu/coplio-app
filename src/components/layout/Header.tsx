'use client'

import { Bell, Search, Building2, Home, Users, AlertTriangle, CalendarDays, Loader2 } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/types'
import { cn } from '@/lib/utils'

// ─── Recherche globale ──────────────────────────────────────────────

interface SearchResult {
  type: 'copropriete' | 'lot' | 'coproprietaire' | 'sinistre' | 'assemblee'
  id: string
  label: string
  sub: string
  href: string
}

const ICONS = {
  copropriete: Building2,
  lot: Home,
  coproprietaire: Users,
  sinistre: AlertTriangle,
  assemblee: CalendarDays,
}

function GlobalSearch({ className }: { className?: string }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.results ?? [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => search(query), 250)
    return () => clearTimeout(t)
  }, [query, search])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const input = ref.current?.querySelector('input')
        input?.focus()
        setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  function handleSelect(href: string) {
    setOpen(false)
    setQuery('')
    router.push(href)
  }

  return (
    <div className={cn('relative flex-1 max-w-md', className)} ref={ref}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Rechercher… (⌘K)"
        className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl
                   focus:outline-none focus:ring-2 focus:ring-[#374151]/15 focus:border-[#374151] focus:bg-white
                   placeholder:text-slate-400 transition-all"
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground animate-spin" />
      )}

      {open && query.length >= 2 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl border border-border shadow-lg z-50 overflow-hidden">
          {results.length === 0 && !loading ? (
            <p className="text-sm text-muted-foreground px-4 py-3">Aucun résultat pour &ldquo;{query}&rdquo;</p>
          ) : (
            <ul>
              {results.map((r) => {
                const Icon = ICONS[r.type]
                return (
                  <li key={`${r.type}-${r.id}`}>
                    <button
                      onClick={() => handleSelect(r.href)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-[#374151]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-coplio-text truncate">{r.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{r.sub}</p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

interface HeaderProps {
  title?: string
  notifications?: Notification[]
  userId: string
  mobileSidebar?: React.ReactNode
}

export function Header({ title, notifications: initial = [], userId, mobileSidebar }: HeaderProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initial)
  const [showNotifications, setShowNotifications] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const unreadCount = notifications.filter((n) => !n.lu).length

  // Temps réel : écoute les nouvelles notifications
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('notifications-live')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  // Fermer en cliquant dehors
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function markAllRead() {
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ lu: true, lu_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('lu', false)
    setNotifications(prev => prev.map(n => ({ ...n, lu: true })))
  }

  async function markRead(id: string) {
    const supabase = createClient()
    await supabase.from('notifications').update({ lu: true, lu_at: new Date().toISOString() }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n))
  }

  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center px-4 md:px-6 gap-3 sticky top-0 z-30" style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.04)' }}>
      {mobileSidebar}

      {title && (
        <h1 className="text-base font-semibold text-coplio-text hidden md:block">{title}</h1>
      )}

      <GlobalSearch className="hidden md:flex flex-1" />

      <div className="flex items-center gap-2 ml-auto">
        <ThemeToggle />
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} non lues` : 'Notifications'}
            aria-expanded={showNotifications}
            className="relative p-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Bell className="w-5 h-5 text-coplio-text" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-border shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Notifications</p>
                  {unreadCount > 0 && (
                    <p className="text-xs text-muted-foreground">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-[#374151] hover:underline">
                    Tout marquer lu
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-6">
                    Aucune notification
                  </p>
                ) : (
                  notifications.slice(0, 15).map((notif) => (
                    <NotificationItem key={notif.id} notification={notif} onRead={markRead} />
                  ))
                )}
              </div>

              <div className="px-4 py-2 border-t border-border">
                <Link
                  href="/notifications"
                  className="text-xs text-[#374151] font-medium hover:underline"
                  onClick={() => setShowNotifications(false)}
                >
                  Voir toutes les notifications
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function NotificationItem({ notification, onRead }: { notification: Notification; onRead: (id: string) => void }) {
  const dot: Record<string, string> = {
    info: 'bg-blue-500',
    alerte: 'bg-amber-500',
    urgent: 'bg-red-500',
  }

  function handleClick() {
    if (!notification.lu) onRead(notification.id)
  }

  const content = (
    <div
      onClick={handleClick}
      className={`px-4 py-3 border-b border-border hover:bg-slate-50 transition-colors cursor-pointer ${!notification.lu ? 'bg-slate-50' : ''}`}
    >
      <div className="flex items-start gap-3">
        <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${dot[notification.type] ?? 'bg-gray-400'}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-coplio-text">{notification.titre}</p>
          {notification.message && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(notification.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            })}
          </p>
        </div>
        {!notification.lu && <span className="w-2 h-2 rounded-full bg-[#374151] flex-shrink-0 mt-1.5" />}
      </div>
    </div>
  )

  return notification.lien ? <Link href={notification.lien}>{content}</Link> : content
}
