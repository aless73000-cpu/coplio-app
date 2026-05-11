'use client'

import { Bell, Search } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/types'

interface HeaderProps {
  title?: string
  notifications?: Notification[]
  userId: string
}

export function Header({ title, notifications: initial = [], userId }: HeaderProps) {
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
    <header className="h-14 bg-white border-b border-border flex items-center px-6 gap-4 sticky top-0 z-30">
      {title && (
        <h1 className="text-base font-semibold text-coplio-text">{title}</h1>
      )}

      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher une copropriété, un lot..."
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-coplio-bg border border-border rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-coplio-green focus:border-transparent
                       placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-coplio-bg transition-colors"
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
                  <button onClick={markAllRead} className="text-xs text-coplio-green hover:underline">
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
                  className="text-xs text-coplio-green font-medium hover:underline"
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
    info: 'bg-coplio-blue',
    alerte: 'bg-coplio-amber',
    urgent: 'bg-coplio-red',
  }

  function handleClick() {
    if (!notification.lu) onRead(notification.id)
  }

  const content = (
    <div
      onClick={handleClick}
      className={`px-4 py-3 border-b border-border hover:bg-coplio-bg transition-colors cursor-pointer ${!notification.lu ? 'bg-coplio-green-light/30' : ''}`}
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
        {!notification.lu && <span className="w-2 h-2 rounded-full bg-coplio-green flex-shrink-0 mt-1.5" />}
      </div>
    </div>
  )

  return notification.lien ? <Link href={notification.lien}>{content}</Link> : content
}
