'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
}

export function NotificationHandler({ userId }: Props) {
  const permissionAsked = useRef(false)

  useEffect(() => {
    if (!('Notification' in window)) return

    // Demander la permission une seule fois
    if (!permissionAsked.current && Notification.permission === 'default') {
      permissionAsked.current = true
      Notification.requestPermission()
    }

    const supabase = createClient()

    // Écouter les nouvelles notifications en temps réel
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notif = payload.new as {
            titre: string
            message?: string
            type: string
            lien?: string
          }

          if (Notification.permission !== 'granted') return

          const icon = '/icons/icon-192x192.png'
          const badge = '/icons/icon-192x192.png'

          const browserNotif = new Notification(notif.titre, {
            body: notif.message ?? undefined,
            icon,
            badge,
            tag: `coplio-${payload.new.id}`,
            requireInteraction: notif.type === 'urgent',
          })

          browserNotif.onclick = () => {
            window.focus()
            if (notif.lien) {
              window.location.href = notif.lien
            }
            browserNotif.close()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // Invisible — pas de rendu
  return null
}
