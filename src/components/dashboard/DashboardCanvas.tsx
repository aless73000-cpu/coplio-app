'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import {
  Building2,
  Home,
  AlertTriangle,
  CreditCard,
  TrendingUp,
  CalendarDays,
  ArrowRight,
  BarChart2,
  Receipt,
  Users,
  GripVertical,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { formatEuro } from '@/lib/utils'
import {
  RecouvrementChartLazy as RecouvrementChart,
  StatutChartLazy as StatutChart,
  EvolutionChartLazy as EvolutionChart,
  TauxGlobalCardLazy as TauxGlobalCard,
} from '@/components/syndic/DashboardChartsLazy'
import { OnboardingChecklist } from '@/components/syndic/OnboardingChecklist'
import { RapportMensuelButton } from '@/components/syndic/RapportMensuelButton'
import { TrialBanner } from '@/components/syndic/TrialBanner'
import {
  KpiCard,
  PerformanceSection,
  CoproprieteAlertRow,
  SinistreRow,
  AgRow,
} from '@/components/dashboard/DashboardComponents'
import { useDashboardPrefs, ALL_WIDGETS } from '@/hooks/useDashboardPrefs'
import type { WidgetPref } from '@/hooks/useDashboardPrefs'
import type { Copropriete } from '@/types'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────

interface OnboardingStep {
  id: string
  label: string
  description: string
  href: string
  done: boolean
}

interface SmartAlert {
  id: string
  severity: 'warning' | 'info'
  message: string
  href: string
  cta: string
}

export interface DashboardData {
  userId: string
  prenom: string
  cabinetNom: string
  trialEndsAt: string | null
  plan: string | null
  onboardingSteps: OnboardingStep[]
  kpis: {
    nb_coproprietes: number
    nb_lots: number
    nb_sinistres_ouverts: number
    montant_total_impayes: number
    nb_ag_a_preparer: number
    nb_coproprietaires: number
    nb_portail_actif: number
  }
  tauxGlobal: number
  totalEmis: number
  totalRecouvre: number
  smartAlerts: SmartAlert[]
  evolutionData: { mois: string; emis: number; recouvre: number }[]
  tauxData: { nom: string; taux: number; impayes: number }[]
  statutData: { aJour: number; attention: number; urgent: number }
  coproprietesCritiques: Copropriete[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sinistres: any[] | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  agProchaines: any[] | null
  hasAppels: boolean
}

// ─── DashboardCanvas ──────────────────────────────────────────

export function DashboardCanvas({ data }: { data: DashboardData }) {
  const { widgets, hydrated } = useDashboardPrefs(data.userId)

  const DEFAULT_ORDER = [
    'kpis_1', 'kpis_2', 'alertes_intelligentes', 'graphiques_finances',
    'graphiques_copros', 'performance', 'alertes_coproprietes',
    'sinistres', 'ag', 'actions_rapides',
  ]

  const orderedIds = hydrated ? widgets.map((w) => w.id) : DEFAULT_ORDER

  function isVisible(id: string) {
    if (!hydrated) return true
    const w = widgets.find((w) => w.id === id)
    return w ? w.visible : true
  }

  function renderWidget(id: string) {
    if (!isVisible(id)) return null

    switch (id) {
      case 'kpis_1':
        return (
          <div key="kpis_1" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Copropriétés" value={data.kpis.nb_coproprietes} icon={Building2} href="/coproprietes" color="green" />
            <KpiCard title="Lots gérés" value={data.kpis.nb_lots} icon={Home} href="/coproprietes" color="blue" />
            <KpiCard title="Sinistres ouverts" value={data.kpis.nb_sinistres_ouverts} icon={AlertTriangle} href="/sinistres" color={data.kpis.nb_sinistres_ouverts > 0 ? 'amber' : 'green'} />
            <KpiCard title="Impayés totaux" value={formatEuro(data.kpis.montant_total_impayes)} icon={CreditCard} href="/impayes" color={data.kpis.montant_total_impayes > 0 ? 'red' : 'green'} isAmount />
          </div>
        )

      case 'kpis_2':
        return (
          <div key="kpis_2" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Copropriétaires" value={data.kpis.nb_coproprietaires} icon={Users} href="/coproprietaires" color="blue" />
            <KpiCard
              title="Portail actif"
              value={data.kpis.nb_portail_actif}
              icon={TrendingUp}
              href="/coproprietaires"
              color={data.kpis.nb_portail_actif > 0 ? 'green' : 'amber'}
              sub={data.kpis.nb_coproprietaires > 0
                ? `${Math.round((data.kpis.nb_portail_actif / data.kpis.nb_coproprietaires) * 100)}% avec accès`
                : undefined}
            />
            <KpiCard title="AG à venir" value={data.kpis.nb_ag_a_preparer} icon={CalendarDays} href="/assemblees" color={data.kpis.nb_ag_a_preparer > 0 ? 'amber' : 'green'} />
            <KpiCard
              title="Taux recouvrement"
              value={`${data.tauxGlobal}%`}
              icon={BarChart2}
              href="/appels-charges"
              color={data.tauxGlobal >= 90 ? 'green' : data.tauxGlobal >= 70 ? 'amber' : 'red'}
            />
          </div>
        )

      case 'alertes_intelligentes':
        if (data.smartAlerts.length === 0) return null
        return (
          <div key="alertes_intelligentes" className="space-y-2">
            {data.smartAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
                  alert.severity === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}
              >
                <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${alert.severity === 'warning' ? 'text-amber-500' : 'text-blue-500'}`} />
                <p className="flex-1">{alert.message}</p>
                <Link
                  href={alert.href}
                  className={`text-xs font-medium px-3 py-1 rounded-lg flex-shrink-0 ${
                    alert.severity === 'warning'
                      ? 'bg-amber-200 hover:bg-amber-300 text-amber-900'
                      : 'bg-blue-200 hover:bg-blue-300 text-blue-900'
                  } transition-colors`}
                >
                  {alert.cta}
                </Link>
              </div>
            ))}
          </div>
        )

      case 'graphiques_finances':
        if (!data.hasAppels) return null
        return (
          <div key="graphiques_finances" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <EvolutionChart data={data.evolutionData} />
            </div>
            <TauxGlobalCard taux={data.tauxGlobal} montantRecouvre={data.totalRecouvre} montantTotal={data.totalEmis} />
          </div>
        )

      case 'graphiques_copros': {
        const hasData = data.tauxData.length > 0 || data.statutData.aJour + data.statutData.attention + data.statutData.urgent > 0
        if (!hasData) return null
        return (
          <div key="graphiques_copros" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RecouvrementChart data={data.tauxData} />
            <StatutChart {...data.statutData} />
          </div>
        )
      }

      case 'performance':
        return (
          <PerformanceSection key="performance" tauxGlobal={data.tauxGlobal} nbCoproprietes={data.kpis.nb_coproprietes} nbLots={data.kpis.nb_lots} />
        )

      case 'alertes_coproprietes':
        return (
          <div key="alertes_coproprietes" className="coplio-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-coplio-text">Alertes copropriétés</h2>
              <Link href="/coproprietes" className="text-xs text-coplio-green hover:underline flex items-center gap-1">
                Voir tout <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {data.coproprietesCritiques.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-coplio-green-light rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-coplio-green" />
                </div>
                <p className="text-sm font-medium text-coplio-text">Tout est à jour !</p>
                <p className="text-xs text-muted-foreground mt-1">Aucune copropriété ne nécessite votre attention</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {data.coproprietesCritiques.map((c) => <CoproprieteAlertRow key={c.id} copropriete={c as any} />)}
              </div>
            )}
          </div>
        )

      case 'sinistres':
        return (
          <div key="sinistres" className="coplio-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-coplio-text">Sinistres en cours</h2>
              <Link href="/sinistres" className="text-xs text-coplio-green hover:underline flex items-center gap-1">
                Voir tout <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {(!data.sinistres || data.sinistres.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun sinistre en cours</p>
            ) : (
              <div className="space-y-2">
                {data.sinistres.map((s) => <SinistreRow key={s.id} sinistre={s} />)}
              </div>
            )}
          </div>
        )

      case 'ag':
        return (
          <div key="ag" className="coplio-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-coplio-text">AG à venir</h2>
              <Link href="/assemblees" className="text-xs text-coplio-green hover:underline">Gérer</Link>
            </div>
            {(!data.agProchaines || data.agProchaines.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune AG planifiée</p>
            ) : (
              <div className="space-y-3">
                {data.agProchaines.map((ag) => <AgRow key={ag.id} ag={ag} />)}
              </div>
            )}
            <Link
              href="/assemblees/new"
              className="mt-4 block text-center text-sm text-coplio-green font-medium border border-coplio-green/30 rounded-lg py-2 hover:bg-coplio-green-light transition-colors"
            >
              + Planifier une AG
            </Link>
          </div>
        )

      case 'actions_rapides':
        return (
          <div key="actions_rapides" className="coplio-card">
            <h2 className="font-semibold text-coplio-text mb-3">Actions rapides</h2>
            <div className="space-y-2">
              {[
                { href: '/coproprietes/new',   label: 'Ajouter une copropriété',    icon: Building2 },
                { href: '/appels-charges/new', label: 'Créer un appel de charges',  icon: Receipt },
                { href: '/sinistres/new',       label: 'Déclarer un sinistre',       icon: AlertTriangle },
                { href: '/assemblees/new',      label: 'Planifier une AG',           icon: CalendarDays },
                { href: '/impayes',             label: 'Gérer les impayés',          icon: CreditCard },
              ].map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-coplio-bg transition-colors text-sm">
                  <div className="w-7 h-7 bg-coplio-green-light rounded-md flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-coplio-green" />
                  </div>
                  <span className="text-coplio-text">{label}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground ml-auto" />
                </Link>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">
            Bonjour, {data.prenom} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Voici un résumé de votre activité au{' '}
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>
        <div className="hidden md:block">
          <RapportMensuelButton data={{
            coproprietes: data.coproprietesCritiques as Copropriete[],
            totalEmis: data.totalEmis,
            totalRecouvre: data.totalRecouvre,
            tauxGlobal: data.tauxGlobal,
            cabinetNom: data.cabinetNom,
          }} />
        </div>
      </div>

      <TrialBanner trialEndsAt={data.trialEndsAt} plan={data.plan} />
      <OnboardingChecklist steps={data.onboardingSteps} />

      {/* Empty state */}
      {data.kpis.nb_coproprietes === 0 && (
        <div className="coplio-card text-center py-16 border-dashed">
          <div className="w-16 h-16 bg-coplio-green-light rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Building2 className="w-8 h-8 text-coplio-green" />
          </div>
          <h2 className="text-xl font-bold text-coplio-text mb-2">
            Ajoutez votre première copropriété
          </h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-8 leading-relaxed">
            Votre tableau de bord s&apos;animera une fois votre première copropriété créée.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/coproprietes/new" className="inline-flex items-center gap-2 bg-coplio-green text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-coplio-green/90 transition-colors">
              <Building2 className="w-4 h-4" /> Créer une copropriété
            </Link>
            <Link href="/importer" className="inline-flex items-center gap-2 bg-coplio-bg text-coplio-text px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-border transition-colors">
              Importer depuis un fichier
            </Link>
          </div>
        </div>
      )}

      {/* Widgets */}
      {orderedIds.map((id) => renderWidget(id))}
    </div>
  )
}

// ─── DashboardPrefsEditor (used in Paramètres) ────────────────

const WIDGET_COLORS: Record<string, string> = {
  kpis_1:               'bg-coplio-green-light',
  kpis_2:               'bg-blue-50',
  alertes_intelligentes:'bg-amber-50',
  graphiques_finances:  'bg-purple-50',
  graphiques_copros:    'bg-indigo-50',
  performance:          'bg-gray-50',
  alertes_coproprietes: 'bg-red-50',
  sinistres:            'bg-orange-50',
  ag:                   'bg-teal-50',
  actions_rapides:      'bg-coplio-green-light',
}

export function DashboardPrefsEditor({ userId }: { userId: string }) {
  const { widgets, saveWidgets, hydrated } = useDashboardPrefs(userId)
  const [local, setLocal] = useState<WidgetPref[]>([])
  const [saved, setSaved] = useState(false)
  const dragIdx = useRef<number | null>(null)
  const dragOverIdx = useRef<number | null>(null)

  useEffect(() => {
    if (hydrated) setLocal(widgets)
  }, [hydrated]) // eslint-disable-line react-hooks/exhaustive-deps

  const getLabel = (id: string) => ALL_WIDGETS.find((w) => w.id === id)?.label ?? id
  const getDesc  = (id: string) => ALL_WIDGETS.find((w) => w.id === id)?.description ?? ''

  function toggle(id: string) {
    setLocal((prev) => prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)))
    setSaved(false)
  }

  function onDragStart(i: number) { dragIdx.current = i }
  function onDragOver(e: React.DragEvent, i: number) { e.preventDefault(); dragOverIdx.current = i }
  function onDrop() {
    const from = dragIdx.current
    const to   = dragOverIdx.current
    if (from === null || to === null || from === to) return
    const arr = [...local]
    const [item] = arr.splice(from, 1)
    arr.splice(to, 0, item)
    setLocal(arr)
    setSaved(false)
    dragIdx.current = null
    dragOverIdx.current = null
  }

  function handleSave() {
    saveWidgets(local)
    setSaved(true)
    toast.success('Tableau de bord enregistré')
    setTimeout(() => setSaved(false), 3000)
  }

  if (!hydrated || local.length === 0) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
  }

  const visibleCount = local.filter((w) => w.visible).length

  return (
    <div className="space-y-5">
      {/* Mini aperçu */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
          Aperçu — {visibleCount} bloc{visibleCount > 1 ? 's' : ''} visible{visibleCount > 1 ? 's' : ''}
        </p>
        <div className="border border-border rounded-xl p-3 bg-coplio-bg space-y-1.5">
          {local.map((w) => (
            <div
              key={w.id}
              className={`h-7 rounded-md flex items-center px-2.5 text-[11px] font-medium transition-opacity ${
                WIDGET_COLORS[w.id] ?? 'bg-white'
              } ${w.visible ? 'opacity-100' : 'opacity-25 line-through'}`}
            >
              {getLabel(w.id)}
            </div>
          ))}
        </div>
      </div>

      {/* Liste drag & drop */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">
          Glissez <GripVertical className="w-3 h-3 inline" /> pour réorganiser · cliquez sur l&apos;œil pour masquer/afficher
        </p>
        <div className="space-y-2">
          {local.map((w, idx) => (
            <div
              key={w.id}
              draggable
              onDragStart={() => onDragStart(idx)}
              onDragOver={(e) => onDragOver(e, idx)}
              onDrop={onDrop}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-white select-none cursor-grab active:cursor-grabbing transition-all ${
                w.visible ? 'border-border shadow-sm' : 'border-border/40 opacity-50'
              }`}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${WIDGET_COLORS[w.id] ?? 'bg-gray-200'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${w.visible ? 'text-coplio-text' : 'text-muted-foreground'}`}>
                  {getLabel(w.id)}
                </p>
                <p className="text-xs text-muted-foreground truncate">{getDesc(w.id)}</p>
              </div>
              <button
                onClick={() => toggle(w.id)}
                className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                  w.visible ? 'text-coplio-green hover:bg-coplio-green-light' : 'text-muted-foreground hover:bg-coplio-bg'
                }`}
                title={w.visible ? 'Masquer ce bloc' : 'Afficher ce bloc'}
              >
                {w.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        className="flex items-center gap-2 bg-coplio-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-coplio-green/90 transition-colors"
      >
        {saved && <CheckCircle2 className="w-4 h-4" />}
        {saved ? 'Enregistré !' : 'Enregistrer les modifications'}
      </button>
    </div>
  )
}
