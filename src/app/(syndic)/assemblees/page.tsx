import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays, Plus, Clock, Video, MapPin, Vote } from 'lucide-react'
import { getDaysUntil } from '@/lib/utils'


export const metadata = { title: 'Assemblées générales' }

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  planifiee: { label: 'Planifiée', cls: 'bg-coplio-blue-bg text-coplio-blue' },
  convocations_envoyees: { label: 'Convoquée', cls: 'badge-attention' },
  en_cours: { label: 'En cours', cls: 'bg-purple-50 text-purple-700' },
  terminee: { label: 'Terminée', cls: 'badge-a-jour' },
  annulee: { label: 'Annulée', cls: 'bg-coplio-bg text-muted-foreground' },
}

export default async function AssembleesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()
  if (!profile?.cabinet_id) redirect('/onboarding')

  const { data: ags } = await supabase
    .from('assemblees_generales')
    .select('*, copropriete:coproprietes(nom), resolutions:ag_resolutions(count)')
    .eq('cabinet_id', profile.cabinet_id)
    .order('date_ag', { ascending: false })

  const aVenir = (ags ?? []).filter((ag) =>
    ['planifiee', 'convocations_envoyees'].includes(ag.status ?? '') &&
    new Date(ag.date_ag) >= new Date()
  )

  const passees = (ags ?? []).filter((ag) =>
    ag.status === 'terminee' || new Date(ag.date_ag) < new Date()
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Assemblées Générales</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {aVenir.length} AG à venir · {passees.length} terminée{passees.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/votes"
            className="flex items-center gap-2 border border-border text-coplio-text px-4 py-2.5 rounded-lg
                       text-sm font-medium hover:border-[#374151]/50 hover:text-[#374151] transition-colors"
          >
            <Vote className="w-4 h-4" />
            Votes en ligne
          </Link>
          <Link
            href="/assemblees/new"
            className="flex items-center gap-2 bg-[#374151] text-white px-4 py-2.5 rounded-lg
                       text-sm font-medium hover:bg-[#374151]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Planifier une AG
          </Link>
        </div>
      </div>

      {/* AG à venir */}
      {aVenir.length > 0 && (
        <div>
          <h2 className="font-semibold text-coplio-text mb-3">À venir</h2>
          <div className="space-y-3">
            {aVenir.map((ag) => (
              <AgCard key={ag.id} ag={ag as AgWithJoins} />
            ))}
          </div>
        </div>
      )}

      {/* AG passées */}
      {passees.length > 0 && (
        <div>
          <h2 className="font-semibold text-coplio-text mb-3">Historique</h2>
          <div className="space-y-3">
            {passees.slice(0, 10).map((ag) => (
              <AgCard key={ag.id} ag={ag as AgWithJoins} />
            ))}
          </div>
        </div>
      )}

      {(!ags || ags.length === 0) && (
        <div className="coplio-card text-center py-12">
          <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-coplio-text mb-2">Aucune AG planifiée</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Planifiez votre première assemblée générale pour envoyer les convocations et recueillir les votes en ligne.
          </p>
          <Link
            href="/assemblees/new"
            className="inline-flex items-center gap-2 bg-[#374151] text-white px-6 py-2.5 rounded-lg
                       text-sm font-medium hover:bg-[#374151]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Planifier une AG
          </Link>
        </div>
      )}
    </div>
  )
}

type AgWithJoins = { id: string; titre: string; date_ag: string; status: string | null; lieu?: string | null; heure?: string | null; est_visio?: boolean | null; copropriete?: { nom: string } | null; resolutions?: { count: number }[] | null }

function AgCard({ ag }: { ag: AgWithJoins }) {
  const date = new Date(ag.date_ag)
  const isUpcoming = date >= new Date() && ag.status !== 'annulee'
  const daysUntil = getDaysUntil(ag.date_ag)
  const { label: statusLabel, cls: statusCls } = STATUS_CONFIG[ag.status as string] ?? STATUS_CONFIG.planifiee

  return (
    <Link
      href={`/assemblees/${ag.id}`}
      className="coplio-card hover:shadow-md transition-all flex items-start gap-4"
    >
      {/* Date */}
      <div className="w-14 h-14 bg-slate-100 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
        <span className="text-[#374151] font-bold text-lg leading-none">{date.toLocaleString('fr-FR', { day: 'numeric', timeZone: 'Europe/Paris' })}</span>
        <span className="text-[#374151]/70 text-xs uppercase">
          {date.toLocaleDateString('fr-FR', { month: 'short', timeZone: 'Europe/Paris' })}
        </span>
        <span className="text-[#374151]/50 text-[10px]">{date.toLocaleString('fr-FR', { year: 'numeric', timeZone: 'Europe/Paris' })}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-coplio-text truncate">{ag.titre}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{ag.copropriete?.nom}</p>
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${statusCls}`}>
            {statusLabel}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })}
          </span>

          {ag.est_visio ? (
            <span className="flex items-center gap-1 text-xs text-coplio-blue">
              <Video className="w-3 h-3" />
              Visioconférence
            </span>
          ) : ag.lieu ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {ag.lieu}
            </span>
          ) : null}

          {isUpcoming && daysUntil >= 0 && (
            <span className={`text-xs font-medium ${daysUntil <= 7 ? 'text-coplio-red' : 'text-muted-foreground'}`}>
              {daysUntil === 0 ? "Aujourd'hui" : `Dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
