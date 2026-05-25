import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Bell, Info, AlertTriangle, CheckCircle2, ChevronRight, BellOff } from 'lucide-react'
import Link from 'next/link'
import { MarkAllReadButton } from './MarkAllReadButton'
import type { Notification, NotificationType } from '@/types'

const TYPE_CONFIG: Record<NotificationType, { icon: typeof Info; bg: string; iconColor: string; border: string }> = {
  info:   { icon: Info,          bg: 'bg-blue-50',             iconColor: 'text-blue-500',      border: 'border-blue-100' },
  alerte: { icon: AlertTriangle, bg: 'bg-coplio-amber-bg',     iconColor: 'text-coplio-amber',  border: 'border-coplio-amber/20' },
  urgent: { icon: AlertTriangle, bg: 'bg-coplio-red-bg',       iconColor: 'text-coplio-red',    border: 'border-coplio-red/20' },
}

function groupByDate(notifications: Notification[]): { label: string; items: Notification[] }[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const weekAgo = new Date(today.getTime() - 7 * 86400000)

  const groups: Record<string, Notification[]> = {
    today: [],
    yesterday: [],
    week: [],
    older: [],
  }

  for (const n of notifications) {
    const d = new Date(n.created_at)
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    if (day.getTime() === today.getTime()) {
      groups.today.push(n)
    } else if (day.getTime() === yesterday.getTime()) {
      groups.yesterday.push(n)
    } else if (day >= weekAgo) {
      groups.week.push(n)
    } else {
      groups.older.push(n)
    }
  }

  const result = []
  if (groups.today.length)     result.push({ label: "Aujourd'hui",   items: groups.today })
  if (groups.yesterday.length) result.push({ label: 'Hier',          items: groups.yesterday })
  if (groups.week.length)      result.push({ label: 'Cette semaine', items: groups.week })
  if (groups.older.length)     result.push({ label: 'Plus ancien',   items: groups.older })
  return result
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return "à l'instant"
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  if (diff < 7 * 86400) return `il y a ${Math.floor(diff / 86400)} j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default async function MesNotifications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portail')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const all = (notifications ?? []) as Notification[]
  const unreadCount = all.filter((n) => !n.lu).length
  const groups = groupByDate(all)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {unreadCount > 0
              ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`
              : 'Tout est à jour'}
          </p>
        </div>
        {unreadCount > 0 && (
          <MarkAllReadButton userId={user.id} />
        )}
      </div>

      {/* Empty state */}
      {all.length === 0 && (
        <div className="coplio-card text-center py-16">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <BellOff className="w-7 h-7 text-[#111827]" />
          </div>
          <p className="font-medium text-coplio-text">Aucune notification</p>
          <p className="text-sm text-muted-foreground mt-1">Vous serez informé des actualités de votre copropriété ici.</p>
        </div>
      )}

      {/* Grouped timeline */}
      {groups.map((group) => (
        <div key={group.label}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{group.label}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="space-y-2">
            {group.items.map((n) => {
              const config = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.info
              const Icon = config.icon
              const isUnread = !n.lu

              const inner = (
                <div className={`coplio-card transition-all duration-150 ${
                  isUnread
                    ? `${config.border} hover:shadow-sm`
                    : 'border-transparent hover:border-border opacity-70 hover:opacity-100'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isUnread ? config.bg : 'bg-coplio-bg'
                    }`}>
                      {isUnread
                        ? <Icon className={`w-4 h-4 ${config.iconColor}`} />
                        : <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium leading-snug ${isUnread ? 'text-coplio-text' : 'text-muted-foreground'}`}>
                          {n.titre}
                        </p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {isUnread && (
                            <span className="w-2 h-2 bg-[#111827] rounded-full" />
                          )}
                          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                            {timeAgo(n.created_at)}
                          </span>
                        </div>
                      </div>
                      {n.message && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      )}
                    </div>
                    {n.lien && (
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                </div>
              )

              return n.lien ? (
                <Link key={n.id} href={n.lien} className="block">
                  {inner}
                </Link>
              ) : (
                <div key={n.id}>{inner}</div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
