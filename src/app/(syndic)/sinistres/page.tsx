import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Sinistre, SinistreStatus } from '@/types'
import { SINISTRE_STATUS_LABELS } from '@/types'


export const metadata = { title: 'Sinistres | Coplio' }

const STATUS_ORDER: SinistreStatus[] = [
  'signale',
  'assurance_declaree',
  'urgence',
  'expertise',
  'travaux',
  'cloture',
]

export default async function SinistresPage({
  searchParams,
}: {
  searchParams: { status?: string; copropriete?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()

  if (!profile?.cabinet_id) redirect('/onboarding')

  let query = supabase
    .from('sinistres')
    .select('*, copropriete:coproprietes(nom, ville)')
    .eq('cabinet_id', profile.cabinet_id)
    .order('created_at', { ascending: false })
    .limit(500)

  if (searchParams.status && searchParams.status !== 'all') {
    query = query.eq('status', searchParams.status as 'signale' | 'assurance_declaree' | 'urgence' | 'expertise' | 'travaux' | 'cloture')
  }
  if (searchParams.copropriete) {
    query = query.eq('copropriete_id', searchParams.copropriete)
  }

  const { data: sinistres } = await query

  const stats = {
    ouverts: (sinistres ?? []).filter((s) => s.status !== 'cloture').length,
    urgences: (sinistres ?? []).filter((s) => s.status === 'urgence').length,
    clotures: (sinistres ?? []).filter((s) => s.status === 'cloture').length,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-coplio-text">Sinistres</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {stats.ouverts} dossier{stats.ouverts > 1 ? 's' : ''} en cours
          </p>
        </div>
        <Link
          href="/sinistres/new"
          className="flex items-center gap-2 bg-[#374151] text-white px-3 py-2 rounded-lg
                     text-sm font-medium hover:bg-[#374151]/90 transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Déclarer un sinistre</span>
        </Link>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="coplio-card flex items-center gap-3">
          <div className="w-10 h-10 bg-coplio-amber-bg rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-coplio-amber" />
          </div>
          <div>
            <p className="text-2xl font-bold text-coplio-text">{stats.ouverts}</p>
            <p className="text-xs text-muted-foreground">En cours</p>
          </div>
        </div>
        <div className="coplio-card flex items-center gap-3">
          <div className="w-10 h-10 bg-coplio-red-bg rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-coplio-red" />
          </div>
          <div>
            <p className="text-2xl font-bold text-coplio-red">{stats.urgences}</p>
            <p className="text-xs text-muted-foreground">Urgences</p>
          </div>
        </div>
        <div className="coplio-card flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-[#374151]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-coplio-text">{stats.clotures}</p>
            <p className="text-xs text-muted-foreground">Clôturés</p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {[{ label: 'Tous', value: 'all' }, ...STATUS_ORDER.map((s) => ({
          label: SINISTRE_STATUS_LABELS[s],
          value: s,
        }))].map(({ label, value }) => (
          <Link
            key={value}
            href={`/sinistres?status=${value}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              (searchParams.status ?? 'all') === value
                ? 'bg-[#374151] text-white border-[#374151]'
                : 'bg-white text-coplio-text border-border hover:border-[#374151]/30'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Liste */}
      {(!sinistres || sinistres.length === 0) ? (
        <div className="coplio-card text-center py-12">
          <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-coplio-text">Aucun sinistre</p>
          <p className="text-sm text-muted-foreground mt-1">Déclarez un sinistre pour commencer le suivi.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sinistres.map((s) => (
            <SinistreCard key={s.id} sinistre={s} />
          ))}
        </div>
      )}
    </div>
  )
}

function SinistreCard({ sinistre }: { sinistre: Sinistre & { copropriete?: { nom: string } | null } }) {
  const statusColors: Record<string, string> = {
    signale: 'badge-attention',
    urgence: 'badge-urgent',
    assurance_declaree: 'bg-coplio-blue-bg text-coplio-blue',
    expertise: 'bg-purple-50 text-purple-700',
    travaux: 'bg-orange-50 text-orange-700',
    cloture: 'badge-a-jour',
  }

  // Calcul de la progression
  const stepIndex = STATUS_ORDER.indexOf((sinistre.status ?? 'signale') as SinistreStatus)
  const progress = Math.round(((stepIndex + 1) / STATUS_ORDER.length) * 100)

  return (
    <Link
      href={`/sinistres/${sinistre.id}`}
      className="coplio-card hover:shadow-md transition-all flex items-start gap-4"
    >
      <div className="w-10 h-10 bg-coplio-amber-bg rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
        <AlertTriangle className="w-5 h-5 text-coplio-amber" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-coplio-text truncate">{sinistre.titre}</h3>
              {sinistre.reference && (
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {sinistre.reference}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {sinistre.copropriete?.nom}
              {sinistre.date_sinistre && ` · Sinistre le ${formatDate(sinistre.date_sinistre)}`}
            </p>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${statusColors[sinistre.status ?? 'signale'] || 'badge-a-jour'}`}>
            {SINISTRE_STATUS_LABELS[(sinistre.status ?? 'signale') as SinistreStatus]}
          </span>
        </div>

        {/* Barre de progression */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progression</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-coplio-bg rounded-full overflow-hidden">
            <div
              className="h-full bg-[#374151] rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  )
}
