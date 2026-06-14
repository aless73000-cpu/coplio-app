'use client'

import Link from 'next/link'
import { Shield, CheckCircle2, ChevronRight, CalendarDays, FileText, Landmark, BookOpen } from 'lucide-react'

interface Copropriete {
  id: string
  nom: string
  created_at?: string | null
}

interface AssemblegGenerale {
  copropriete_id: string
  date_ag: string
  status: string
}

interface FondsTravaux {
  copropriete_id: string
  annee: number | null
}

interface ConformiteItem {
  id: string
  label: string
  description: string
  deadline: Date
  status: 'ok' | 'warning' | 'critical'
  icon: React.ElementType
  href: string
  coproNom: string
  coproId: string
  article: string
}

interface Props {
  coproprietes: Copropriete[]
  agRecentes: AssemblegGenerale[]
  fondsTravaux: FondsTravaux[]
}

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / 86400000)
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function getDeadlineStatus(days: number): 'ok' | 'warning' | 'critical' {
  if (days < 0)   return 'critical'
  if (days < 45)  return 'warning'
  return 'ok'
}

export function ConformiteLegale({ coproprietes, agRecentes, fondsTravaux }: Props) {
  const now = new Date()
  const items: ConformiteItem[] = []

  for (const copro of coproprietes) {
    const createdAt = copro.created_at ? new Date(copro.created_at) : new Date(now.getFullYear() - 2, 0, 1)

    // ── 1. AG annuelle obligatoire ────────────────────────────
    const agCopro = agRecentes
      .filter(ag => ag.copropriete_id === copro.id && ag.status === 'terminee')
      .sort((a, b) => new Date(b.date_ag).getTime() - new Date(a.date_ag).getTime())[0]

    const lastAgDate = agCopro ? new Date(agCopro.date_ag) : createdAt
    const nextAgDeadline = addMonths(lastAgDate, 12)
    const agDays = daysUntil(nextAgDeadline)

    if (agDays < 180) {
      items.push({
        id:          `ag-${copro.id}`,
        label:       'Assemblée générale annuelle',
        description: agCopro
          ? `Dernière AG : ${new Date(agCopro.date_ag).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
          : 'Aucune AG enregistrée',
        deadline:    nextAgDeadline,
        status:      getDeadlineStatus(agDays),
        icon:        CalendarDays,
        href:        '/assemblees/new',
        coproNom:    copro.nom,
        coproId:     copro.id,
        article:     'Art. 7 décret 1967',
      })
    }

    // ── 2. Fonds de travaux ALUR ──────────────────────────────
    const fondsCopro = fondsTravaux.find(f => f.copropriete_id === copro.id)
    const currentYear = now.getFullYear()
    const lastFondsYear = fondsCopro?.annee ?? (currentYear - 2)
    const fondsDue = new Date(currentYear, 11, 31) // 31 dec
    const fondsDays = daysUntil(fondsDue)

    if (!fondsCopro || (fondsCopro.annee ?? 0) < currentYear) {
      items.push({
        id:          `fonds-${copro.id}`,
        label:       'Mise à jour fonds de travaux',
        description: `Dernier enregistrement : ${lastFondsYear}`,
        deadline:    fondsDue,
        status:      getDeadlineStatus(fondsDays),
        icon:        Landmark,
        href:        `/coproprietes/${copro.id}/fonds-travaux`,
        coproNom:    copro.nom,
        coproId:     copro.id,
        article:     'Art. 14-2 loi 1965 (ALUR)',
      })
    }

    // ── 3. Arrêté des comptes (fin mars) ──────────────────────
    const comptesDue = new Date(currentYear, 2, 31) // 31 mars
    if (comptesDue > now) {
      const comptesDays = daysUntil(comptesDue)
      if (comptesDays < 90) {
        items.push({
          id:          `comptes-${copro.id}`,
          label:       'Approbation des comptes',
          description: `À faire voter en AG avant le 31 mars`,
          deadline:    comptesDue,
          status:      getDeadlineStatus(comptesDays),
          icon:        FileText,
          href:        `/assemblees/new`,
          coproNom:    copro.nom,
          coproId:     copro.id,
          article:     'Art. 24 loi 1965',
        })
      }
    }

    // ── 4. Carnet d'entretien ─────────────────────────────────
    const carnetDue = new Date(currentYear, 11, 31) // Dec 31 de l'année en cours
    const carnetDays = daysUntil(carnetDue)
    if (carnetDays < 180) { // visible à partir de ~juillet
      items.push({
        id:          `carnet-${copro.id}`,
        label:       'Carnet d\'entretien à jour',
        description: 'Mettre à jour les informations de maintenance avant la fin d\'année',
        deadline:    carnetDue,
        status:      getDeadlineStatus(carnetDays),
        icon:        BookOpen,
        href:        `/coproprietes/${copro.id}/entretien`,
        coproNom:    copro.nom,
        coproId:     copro.id,
        article:     'Art. 45-1 décret 1967',
      })
    }
  }

  // Sort by urgency then deadline
  items.sort((a, b) => {
    const urgencyOrder = { critical: 0, warning: 1, ok: 2 }
    const uA = urgencyOrder[a.status]
    const uB = urgencyOrder[b.status]
    if (uA !== uB) return uA - uB
    return a.deadline.getTime() - b.deadline.getTime()
  })

  const visibleItems = items.slice(0, 8)
  const criticalCount = items.filter(i => i.status === 'critical').length
  const warningCount  = items.filter(i => i.status === 'warning').length

  if (items.length === 0) {
    return (
      <div className="coplio-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-green-600" />
          </div>
          <h2 className="font-semibold text-coplio-text text-sm">Conformité légale</h2>
        </div>
        <div className="text-center py-6">
          <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-700">Tout est en ordre</p>
          <p className="text-xs text-muted-foreground mt-1">Aucune échéance légale imminente</p>
        </div>
      </div>
    )
  }

  return (
    <div className="coplio-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            criticalCount > 0 ? 'bg-red-50' : warningCount > 0 ? 'bg-amber-50' : 'bg-green-50'
          }`}>
            <Shield className={`w-4 h-4 ${
              criticalCount > 0 ? 'text-red-600' : warningCount > 0 ? 'text-amber-600' : 'text-green-600'
            }`} />
          </div>
          <div>
            <h2 className="font-semibold text-coplio-text text-sm">Conformité légale</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {criticalCount > 0 && <span className="text-red-600 font-medium">{criticalCount} en retard · </span>}
              {warningCount > 0 && <span className="text-amber-600 font-medium">{warningCount} à traiter · </span>}
              {items.length} échéance{items.length > 1 ? 's' : ''} au total
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {visibleItems.map((item) => {
          const days     = daysUntil(item.deadline)
          const ItemIcon = item.icon

          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center gap-3 p-3 rounded-xl border hover:bg-slate-50 transition-colors group"
              style={{
                borderColor: item.status === 'critical' ? '#fecaca' : item.status === 'warning' ? '#fde68a' : '#e2e8f0',
                background:  item.status === 'critical' ? '#fff5f5' : item.status === 'warning' ? '#fffbeb' : 'white',
              }}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                item.status === 'critical' ? 'bg-red-100' : item.status === 'warning' ? 'bg-amber-100' : 'bg-slate-100'
              }`}>
                <ItemIcon className={`w-3.5 h-3.5 ${
                  item.status === 'critical' ? 'text-red-600' : item.status === 'warning' ? 'text-amber-600' : 'text-slate-500'
                }`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-slate-800 truncate">{item.label}</p>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.coproNom} · {item.article}</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right">
                  <p className={`text-xs font-bold ${
                    item.status === 'critical' ? 'text-red-600' :
                    item.status === 'warning'  ? 'text-amber-600' :
                    'text-slate-500'
                  }`}>
                    {days < 0
                      ? `${Math.abs(days)}j retard`
                      : days === 0 ? "Aujourd'hui"
                      : `${days}j`}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {item.deadline.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
            </Link>
          )
        })}
      </div>

      {items.length > 8 && (
        <p className="text-xs text-center text-muted-foreground mt-3">
          + {items.length - 8} autres échéances
        </p>
      )}
    </div>
  )
}
