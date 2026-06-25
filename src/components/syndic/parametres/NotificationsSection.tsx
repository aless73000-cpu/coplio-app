'use client'

import { Bell, Loader2 } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export function NotificationsSection() {
  const push = usePushNotifications()

  return (
    <section className="coplio-card">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
          <Bell className="w-4 h-4 text-[#374151]" />
        </div>
        <h2 className="font-semibold text-coplio-text">Notifications</h2>
      </div>
      <div className="space-y-3">
        {push.state !== 'unsupported' && (
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-coplio-text">Notifications push</p>
              {push.state === 'denied' && (
                <p className="text-xs text-muted-foreground mt-0.5">Bloquées dans le navigateur</p>
              )}
            </div>
            {push.state === 'loading' ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : push.state === 'denied' ? (
              <span className="text-xs text-muted-foreground">Bloquées</span>
            ) : (
              <button
                onClick={push.state === 'subscribed' ? push.unsubscribe : push.subscribe}
                className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${push.state === 'subscribed' ? 'bg-[#374151]' : 'bg-border'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${push.state === 'subscribed' ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
