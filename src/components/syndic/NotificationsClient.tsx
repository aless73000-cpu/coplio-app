'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, Check, CheckCheck } from 'lucide-react'
import Link from 'next/link'
import type { Notification } from '@/types'

const typeColors: Record<string, string> = {
  info: 'bg-blue-100 text-blue-600',
  alerte: 'bg-amber-100 text-amber-600',
  urgent: 'bg-red-100 text-red-600',
}

const dotColors: Record<string, string> = {
  info: 'bg-blue-500',
  alerte: 'bg-amber-500',
  urgent: 'bg-red-500',
}

export function NotificationsClient({ userId, initialNotifications }: { userId: string; initialNotifications: Notification[] }) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)

  const unread = notifications.filter(n => !n.lu).length

  async function markAllRead() {
    const supabase = createClient()
    await supabase.from('notifications').update({ lu: true, lu_at: new Date().toISOString() }).eq('user_id', userId).eq('lu', false)
    setNotifications(prev => prev.map(n => ({ ...n, lu: true })))
  }

  async function markRead(id: string) {
    const supabase = createClient()
    await supabase.from('notifications').update({ lu: true, lu_at: new Date().toISOString() }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {unread > 0 ? `${unread} non lue${unread > 1 ? 's' : ''}` : 'Tout est à jour'}
          </p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-2 text-sm text-[#374151] font-medium hover:underline">
            <CheckCheck className="w-4 h-4" />
            Tout marquer comme lu
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="coplio-card text-center py-16">
          <div className="w-14 h-14 bg-[#374151]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-7 h-7 text-[#374151]" />
          </div>
          <p className="font-semibold text-coplio-text">Aucune notification</p>
          <p className="text-muted-foreground text-sm mt-1">Vous êtes à jour !</p>
        </div>
      ) : (
        <div className="coplio-card p-0 overflow-hidden divide-y divide-border">
          {notifications.map(n => {
            const content = (
              <div
                onClick={() => !n.lu && markRead(n.id)}
                className={`flex items-start gap-4 px-5 py-4 hover:bg-coplio-bg transition-colors cursor-pointer ${!n.lu ? 'bg-slate-100/20' : ''}`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${typeColors[n.type] ?? 'bg-gray-100 text-gray-500'}`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium text-coplio-text ${!n.lu ? 'font-semibold' : ''}`}>{n.titre}</p>
                    {!n.lu && <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${dotColors[n.type] ?? 'bg-gray-400'}`} />}
                  </div>
                  {n.message && <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>}
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {new Date(n.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {n.lu && <Check className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />}
              </div>
            )
            return n.lien ? <Link key={n.id} href={n.lien}>{content}</Link> : <div key={n.id}>{content}</div>
          })}
        </div>
      )}
    </div>
  )
}
