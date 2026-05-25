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
  const iconStyles: Record<string, { bg: string; fg: string }> = {
    green: { bg: 'bg-slate-100',  fg: 'text-[#111827]' },
    blue:  { bg: 'bg-blue-50',   fg: 'text-blue-600'  },
    amber: { bg: 'bg-amber-50',  fg: 'text-amber-600' },
    red:   { bg: 'bg-red-50',    fg: 'text-red-600'   },
  }
  const s = iconStyles[color]
  const valueColor = (isAmount && typeof value === 'string' && value.includes('-'))
    ? 'text-red-600'
    : 'text-[#111827]'

  return (
    <Link
      href={href}
      className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-4 hover:border-slate-200 hover:shadow-apple-md transition-all group"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.bg}`}>
          <Icon className={`w-4 h-4 ${s.fg}`} />
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-slate-400 transition-colors" />
      </div>
      <div>
        <p className={`text-2xl font-bold leading-none ${valueColor}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{sub}</p>}
        <p className="text-xs font-medium text-slate-400 mt-2">{title}</p>
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
  const tauxColor = tauxGlobal >= 90 ? 'text-[#111827]' : tauxGlobal >= 70 ? 'text-amber-600' : 'text-red-600'
  const tauxBg    = tauxGlobal >= 90 ? 'bg-[#111827]'   : tauxGlobal >= 70 ? 'bg-amber-500'   : 'bg-red-500'

  return (
    <div className="coplio-card">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 className="w-4 h-4 text-slate-400" />
        <h2 className="font-semibold text-[#111827] text-sm">Performance</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 bg-slate-50 rounded-xl">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Recouvrement</p>
          <p className={`text-3xl font-bold mb-3 ${tauxColor}`}>{tauxGlobal}%</p>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${tauxBg}`} style={{ width: `${Math.min(100, tauxGlobal)}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            {tauxGlobal >= 90
              ? 'Excellent · charges bien recouvrées'
              : tauxGlobal >= 70
              ? 'Correct · des relances restent à faire'
              : 'À améliorer · impayés importants en cours'}
          </p>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Lots / copropriété</p>
          <p className="text-3xl font-bold text-[#111827] mb-3">{lotsParCopro}</p>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#111827] rounded-full" style={{ width: `${Math.min(100, lotsParCopro * 2)}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            {nbLots} lot{nbLots > 1 ? 's' : ''} sur {nbCoproprietes} copropriété{nbCoproprietes > 1 ? 's' : ''}
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
      className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Building2 className="w-4 h-4 text-[#111827]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[#111827]">{copropriete.nom}</p>
          <p className="text-xs text-slate-400">
            {copropriete.nb_lots} lots · {copropriete.ville}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <span className={
          copropriete.statut === 'urgent'    ? 'badge-urgent' :
          copropriete.statut === 'attention' ? 'badge-attention' :
          'badge-a-jour'
        }>
          {copropriete.statut === 'urgent' ? 'Urgent' :
           copropriete.statut === 'attention' ? 'Attention' : 'À jour'}
        </span>
        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>
    </Link>
  )
}

// ─── Sinistre row ─────────────────────────────────────────────

type SinistreItem = { id: string; titre: string | null; reference: string | null; status: string | null; copropriete?: { nom: string } | null }

const STATUS_COLORS: Record<string, string> = {
  signale:             'bg-amber-50 text-amber-700',
  urgence:             'bg-red-50 text-red-700',
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
      className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[#111827] truncate">{sinistre.titre}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {sinistre.reference} · {sinistre.copropriete?.nom}
        </p>
      </div>
      <span className={`ml-3 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_COLORS[sinistre.status ?? ''] || 'bg-slate-100 text-slate-600'}`}>
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
  const isUrgent = jours <= 7

  return (
    <Link href={`/assemblees/${ag.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
      <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${isUrgent ? 'bg-amber-50' : 'bg-slate-100'}`}>
        <span className={`font-bold text-sm leading-none ${isUrgent ? 'text-amber-700' : 'text-[#111827]'}`}>{date.getDate()}</span>
        <span className={`text-[10px] uppercase mt-0.5 ${isUrgent ? 'text-amber-500' : 'text-slate-400'}`}>
          {date.toLocaleDateString('fr-FR', { month: 'short' })}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[#111827] truncate">{ag.titre}</p>
        <p className="text-xs text-slate-400">{ag.copropriete?.nom}</p>
      </div>
      <span className={`text-xs font-semibold flex-shrink-0 px-2 py-1 rounded-full ${isUrgent ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
        J-{jours}
      </span>
    </Link>
  )
}
