import Link from 'next/link'
import {
  Building2, AlertTriangle, ArrowRight, BarChart2,
} from 'lucide-react'

// ─── KPI Card ─────────────────────────────────────────────────

interface KpiCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  href: string
  color: 'green' | 'blue' | 'amber' | 'red'
  isAmount?: boolean
  sub?: string
}

export function KpiCard({ title, value, icon: Icon, href, color, isAmount, sub }: KpiCardProps) {
  const colors = {
    green: 'bg-coplio-green-light text-coplio-green',
    blue:  'bg-coplio-blue-bg text-coplio-blue',
    amber: 'bg-coplio-amber-bg text-coplio-amber',
    red:   'bg-coplio-red-bg text-coplio-red',
  }

  return (
    <Link href={href} className="coplio-card !p-4 md:!p-6 hover:shadow-md transition-shadow group relative">
      <div className={`absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center ${colors[color]}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="pr-10">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
        <p className={`text-xl font-bold mt-1 ${isAmount && typeof value === 'string' && value.includes('-') ? 'text-coplio-red' : 'text-coplio-text'}`}>
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground group-hover:text-coplio-green transition-colors">
        Voir le détail <ArrowRight className="w-3 h-3" />
      </div>
    </Link>
  )
}

// ─── Performance cabinet ──────────────────────────────────────

interface PerformanceSectionProps {
  tauxGlobal: number
  nbCoproprietes: number
  nbLots: number
}

export function PerformanceSection({ tauxGlobal, nbCoproprietes, nbLots }: PerformanceSectionProps) {
  const lotsParCopro = nbCoproprietes > 0 ? Math.round(nbLots / nbCoproprietes) : 0
  const tauxColor = tauxGlobal >= 90 ? 'text-coplio-green' : tauxGlobal >= 70 ? 'text-coplio-amber' : 'text-coplio-red'
  const tauxBg    = tauxGlobal >= 90 ? 'bg-coplio-green'   : tauxGlobal >= 70 ? 'bg-coplio-amber'   : 'bg-coplio-red'

  return (
    <div className="coplio-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-coplio-text flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-coplio-green" />Performance du cabinet
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-coplio-bg rounded-xl">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Taux de recouvrement</p>
          <p className={`text-3xl font-bold mb-2 ${tauxColor}`}>{tauxGlobal}%</p>
          <div className="h-2 bg-white rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${tauxBg}`} style={{ width: `${Math.min(100, tauxGlobal)}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {tauxGlobal >= 90
              ? 'Excellent — charges bien recouvrées'
              : tauxGlobal >= 70
              ? 'Correct — des relances restent à faire'
              : 'À améliorer — des impayés importants en cours'}
          </p>
        </div>
        <div className="p-4 bg-coplio-bg rounded-xl">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Lots par copropriété</p>
          <p className="text-3xl font-bold text-coplio-text mb-2">{lotsParCopro}</p>
          <div className="h-2 bg-white rounded-full overflow-hidden">
            <div className="h-full bg-coplio-green rounded-full" style={{ width: `${Math.min(100, lotsParCopro * 2)}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {nbLots} lot{nbLots > 1 ? 's' : ''} réparti{nbLots > 1 ? 's' : ''} sur {nbCoproprietes} copropriété{nbCoproprietes > 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Copropriété alert row ────────────────────────────────────

type CoproprieteAlert = { id: string; nom: string; nb_lots: number | null; ville: string | null; statut: string | null }

export function CoproprieteAlertRow({ copropriete }: { copropriete: CoproprieteAlert }) {
  return (
    <Link
      href={`/coproprietes/${copropriete.id}`}
      className="flex items-center justify-between p-3 rounded-lg hover:bg-coplio-bg transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-coplio-green-light rounded-lg flex items-center justify-center">
          <Building2 className="w-4 h-4 text-coplio-green" />
        </div>
        <div>
          <p className="text-sm font-medium text-coplio-text">{copropriete.nom}</p>
          <p className="text-xs text-muted-foreground">
            {copropriete.nb_lots} lots · {copropriete.ville}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={
          copropriete.statut === 'urgent'    ? 'badge-urgent' :
          copropriete.statut === 'attention' ? 'badge-attention' :
          'badge-a-jour'
        }>
          {copropriete.statut === 'urgent' ? 'Urgent' :
           copropriete.statut === 'attention' ? 'Attention' : 'À jour'}
        </span>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-coplio-green transition-colors" />
      </div>
    </Link>
  )
}

// ─── Sinistre row ─────────────────────────────────────────────

type SinistreItem = { id: string; titre: string | null; reference: string | null; status: string | null; copropriete?: { nom: string } | null }

const STATUS_COLORS: Record<string, string> = {
  signale:             'badge-attention',
  urgence:             'badge-urgent',
  assurance_declaree:  'bg-blue-50 text-blue-700',
  expertise:           'bg-purple-50 text-purple-700',
  travaux:             'bg-orange-50 text-orange-700',
}

const STATUS_LABELS: Record<string, string> = {
  signale:             'Signalé',
  urgence:             'Urgence',
  assurance_declaree:  'Assurance',
  expertise:           'Expertise',
  travaux:             'Travaux',
}

export function SinistreRow({ sinistre }: { sinistre: SinistreItem }) {
  return (
    <Link
      href={`/sinistres/${sinistre.id}`}
      className="flex items-center justify-between p-3 rounded-lg hover:bg-coplio-bg transition-colors group"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-coplio-text truncate">{sinistre.titre}</p>
        <p className="text-xs text-muted-foreground">
          {sinistre.reference} · {sinistre.copropriete?.nom}
        </p>
      </div>
      <span className={`ml-3 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[sinistre.status ?? ''] || 'badge-a-jour'}`}>
        {STATUS_LABELS[sinistre.status ?? ''] || sinistre.status}
      </span>
    </Link>
  )
}

// ─── AG row ───────────────────────────────────────────────────

type AgItem = { id: string; titre: string; date_ag: string; copropriete?: { nom: string } }

export function AgRow({ ag }: { ag: AgItem }) {
  const date = new Date(ag.date_ag)
  const jours = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <Link href={`/assemblees/${ag.id}`} className="block group">
      <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-coplio-bg transition-colors">
        <div className="w-10 h-10 bg-coplio-green-light rounded-xl flex flex-col items-center justify-center flex-shrink-0">
          <span className="text-coplio-green font-bold text-sm leading-none">{date.getDate()}</span>
          <span className="text-coplio-green/70 text-[10px] uppercase">
            {date.toLocaleDateString('fr-FR', { month: 'short' })}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-coplio-text truncate">{ag.titre}</p>
          <p className="text-xs text-muted-foreground">{ag.copropriete?.nom}</p>
        </div>
        <span className={`text-xs font-medium flex-shrink-0 ${jours <= 7 ? 'text-coplio-red' : 'text-muted-foreground'}`}>
          J-{jours}
        </span>
      </div>
    </Link>
  )
}
