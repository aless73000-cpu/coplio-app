'use client'

import { Bell, BellOff, Loader2, CheckCircle2, X } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export function PushNotifToggle() {
  const { state, subscribe, unsubscribe } = usePushNotifications()

  if (state === 'unsupported') return null

  if (state === 'loading') {
    return (
      <div className="p-5 flex items-center gap-3">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Vérification…</span>
      </div>
    )
  }

  return (
    <div className="p-5">
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          state === 'subscribed' ? 'bg-[#374151]' : 'bg-slate-100'
        }`}>
          {state === 'subscribed'
            ? <Bell className="w-5 h-5 text-white" />
            : <BellOff className="w-5 h-5 text-slate-400" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-coplio-text">
            {state === 'subscribed' ? 'Notifications activées' : 'Notifications désactivées'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {state === 'subscribed'
              ? 'Vous recevez des alertes pour les messages, documents et assemblées générales.'
              : state === 'denied'
              ? 'Notifications bloquées dans votre navigateur. Modifiez les permissions pour les réactiver.'
              : 'Recevez des alertes instantanées de votre syndic directement sur cet appareil.'}
          </p>
          {state !== 'denied' && (
            <button
              onClick={state === 'subscribed' ? unsubscribe : subscribe}
              className={`mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                state === 'subscribed'
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-[#374151] text-white hover:bg-[#374151]/90'
              }`}
            >
              {state === 'subscribed' ? (
                <><X className="w-4 h-4" /> Désactiver</>
              ) : (
                <><Bell className="w-4 h-4" /> Activer les notifications</>
              )}
            </button>
          )}
        </div>

        {state === 'subscribed' && (
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
        )}
      </div>
    </div>
  )
}
