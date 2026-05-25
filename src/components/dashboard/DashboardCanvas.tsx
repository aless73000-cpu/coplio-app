'use client'

import Link from 'next/link'
import { useState } from 'react'
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
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  Zap,
  PieChart,
  GripVertical,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { Reorder, useDragControls, motion, AnimatePresence } from 'framer-motion'
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

// ─── Widget metadata ──────────────────────────────────────────

const WIDGET_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  kpis_1:               { icon: BarChart2,      color: 'text-slate-600',   bg: 'bg-slate-100' },
  kpis_2:               { icon: Users,          color: 'text-blue-600',    bg: 'bg-blue-50' },
  alertes_intelligentes:{ icon: AlertTriangle,  color: 'text-amber-600',   bg: 'bg-amber-50' },
  graphiques_finances:  { icon: TrendingUp,     color: 'text-purple-600',  bg: 'bg-purple-50' },
  graphiques_copros:    { icon: PieChart,       color: 'text-indigo-600',  bg: 'bg-indigo-50' },
  performance:          { icon: BarChart2,      color: 'text-slate-500',   bg: 'bg-slate-50' },
  alertes_coproprietes: { icon: Building2,      color: 'text-red-600',     bg: 'bg-red-50' },
  sinistres:            { icon: AlertTriangle,  color: 'text-orange-600',  bg: 'bg-orange-50' },
  ag:                   { icon: CalendarDays,   color: 'text-teal-600',    bg: 'bg-teal-50' },
  actions_rapides:      { icon: Zap,            color: 'text-[#374151]',   bg: 'bg-slate-100' },
}

// ─── DashboardCanvas ──────────────────────────────────────────

export function DashboardCanvas({ data }: { data: DashboardData }) {
  const { widgets, saveWidgets, hydrated } = useDashboardPrefs(data.userId)
  const [editMode, setEditMode] = useState(false)

  // Edit mode state
  const [editOrder, setEditOrder] = useState<string[]>([])
  const [editVisible, setEditVisible] = useState<Record<string, boolean>>({})

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

  function enterEdit() {
    const order = hydrated ? widgets.map((w) => w.id) : DEFAULT_ORDER
    const visible = Object.fromEntries(
      order.map((id) => [id, hydrated ? (widgets.find((w) => w.id === id)?.visible ?? true) : true])
    )
    setEditOrder(order.filter((id) => visible[id]))
    setEditVisible(visible)
    setEditMode(true)
  }

  function cancelEdit() {
    setEditMode(false)
  }

  function saveEdit() {
    // Visible widgets in drag order, then hidden widgets at the end
    const hiddenIds = ALL_WIDGETS.map((w) => w.id).filter((id) => !editVisible[id])
    const newPrefs: WidgetPref[] = [
      ...editOrder.map((id) => ({ id, visible: true })),
      ...hiddenIds.map((id) => ({ id, visible: false })),
    ]
    saveWidgets(newPrefs)
    setEditMode(false)
    toast.success('Tableau de bord enregistré ✓')
  }

  function toggleVisibility(id: string) {
    const nowVisible = !editVisible[id]
    setEditVisible((prev) => ({ ...prev, [id]: nowVisible }))
    if (nowVisible) {
      // Re-add to ordered list at the end
      setEditOrder((prev) => [...prev, id])
    } else {
      // Remove from ordered list
      setEditOrder((prev) => prev.filter((x) => x !== id))
    }
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${
                  alert.severity === 'warning'
                    ? 'bg-amber-50 border border-amber-100'
                    : 'bg-blue-50 border border-blue-100'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  alert.severity === 'warning' ? 'bg-amber-100' : 'bg-blue-100'
                }`}>
                  <AlertTriangle className={`w-3.5 h-3.5 ${alert.severity === 'warning' ? 'text-amber-600' : 'text-blue-600'}`} />
                </div>
                <p className={`flex-1 font-medium ${alert.severity === 'warning' ? 'text-amber-900' : 'text-blue-900'}`}>{alert.message}</p>
                <Link
                  href={alert.href}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors ${
                    alert.severity === 'warning'
                      ? 'bg-amber-200 hover:bg-amber-300 text-amber-900'
                      : 'bg-blue-200 hover:bg-blue-300 text-blue-900'
                  }`}
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
        if (data.coproprietesCritiques.length === 0) return null
        return (
          <div key="alertes_coproprietes" className="coplio-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#374151]">Alertes copropriétés</h2>
              <Link href="/coproprietes" className="text-xs text-slate-400 hover:text-[#374151] transition-colors flex items-center gap-1">
                Voir tout <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-0.5">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {data.coproprietesCritiques.map((c) => <CoproprieteAlertRow key={c.id} copropriete={c as any} />)}
            </div>
          </div>
        )

      case 'sinistres':
        if (!data.sinistres || data.sinistres.length === 0) return null
        return (
          <div key="sinistres" className="coplio-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#374151]">Sinistres en cours</h2>
              <Link href="/sinistres" className="text-xs text-slate-400 hover:text-[#374151] transition-colors flex items-center gap-1">
                Voir tout <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-0.5">
              {data.sinistres.map((s) => <SinistreRow key={s.id} sinistre={s} />)}
            </div>
          </div>
        )

      case 'ag':
        if (!data.agProchaines || data.agProchaines.length === 0) return null
        return (
          <div key="ag" className="coplio-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#374151]">AG à venir</h2>
              <Link href="/assemblees/new" className="text-xs text-slate-400 hover:text-[#374151] transition-colors">
                + Planifier
              </Link>
            </div>
            <div className="space-y-0.5">
              {data.agProchaines.map((ag) => <AgRow key={ag.id} ag={ag} />)}
            </div>
          </div>
        )

      case 'actions_rapides':
        return (
          <div key="actions_rapides" className="coplio-card">
            <h2 className="text-sm font-semibold text-[#374151] mb-3">Actions rapides</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { href: '/coproprietes/new',   label: 'Nouvelle copropriété',   icon: Building2 },
                { href: '/appels-charges/new', label: 'Appel de charges',       icon: Receipt },
                { href: '/sinistres/new',       label: 'Déclarer sinistre',      icon: AlertTriangle },
                { href: '/assemblees/new',      label: 'Planifier une AG',       icon: CalendarDays },
                { href: '/impayes',             label: 'Gérer les impayés',      icon: CreditCard },
              ].map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center gap-2 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-center group"
                >
                  <div className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center group-hover:border-slate-300 transition-colors shadow-sm">
                    <Icon className="w-4 h-4 text-[#374151]" />
                  </div>
                  <span className="text-xs font-medium text-[#374151] leading-tight">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // ─── Edit mode ────────────────────────────────────────────────
  if (editMode) {
    const hiddenIds = ALL_WIDGETS.map((w) => w.id).filter((id) => !editVisible[id])
    const getLabel = (id: string) => ALL_WIDGETS.find((w) => w.id === id)?.label ?? id
    const getDesc  = (id: string) => ALL_WIDGETS.find((w) => w.id === id)?.description ?? ''

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.2 }}
        className="space-y-6"
      >
        {/* Header barre édition */}
        <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4 flex items-center justify-between"
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)' }}
        >
          <div>
            <h2 className="font-semibold text-[#374151] text-sm" style={{ letterSpacing: '-0.01em' }}>
              Personnaliser le tableau de bord
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Maintenez et glissez pour réorganiser</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={cancelEdit}
              className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={saveEdit}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#374151] text-white hover:bg-[#4B5563] transition-colors"
            >
              Terminé
            </button>
          </div>
        </div>

        {/* Zone drag & drop — blocs visibles */}
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3 px-1">
            Affichés · {editOrder.length} bloc{editOrder.length > 1 ? 's' : ''}
          </p>
          <Reorder.Group
            axis="y"
            values={editOrder}
            onReorder={setEditOrder}
            className="space-y-2"
          >
            {editOrder.map((id) => (
              <DraggableWidgetCard
                key={id}
                id={id}
                label={getLabel(id)}
                description={getDesc(id)}
                onHide={() => toggleVisibility(id)}
              />
            ))}
          </Reorder.Group>
        </div>

        {/* Blocs masqués */}
        {hiddenIds.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3 px-1">
              Masqués
            </p>
            <div className="space-y-2">
              {hiddenIds.map((id) => {
                const meta = WIDGET_META[id]
                const Icon = meta?.icon ?? BarChart2
                return (
                  <div
                    key={id}
                    className="bg-white rounded-2xl border border-slate-100 px-4 py-3.5 flex items-center gap-3 opacity-50"
                    style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${meta?.bg ?? 'bg-slate-100'}`}>
                      <Icon className={`w-4 h-4 ${meta?.color ?? 'text-slate-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#374151]">{getLabel(id)}</p>
                      <p className="text-xs text-slate-400 truncate">{getDesc(id)}</p>
                    </div>
                    <button
                      onClick={() => toggleVisibility(id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex-shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Afficher
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </motion.div>
    )
  }

  // ─── Mode normal ──────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-fade-in">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#374151]" style={{ letterSpacing: '-0.02em' }}>
            Bonjour, {data.prenom} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long', day: 'numeric', month: 'long',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={enterEdit}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-[#374151] hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Personnaliser</span>
          </button>
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
      </div>

      <TrialBanner trialEndsAt={data.trialEndsAt} plan={data.plan} />
      <OnboardingChecklist steps={data.onboardingSteps} />

      {/* Empty state */}
      {data.kpis.nb_coproprietes === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 text-center py-16 px-6"
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
        >
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7 text-[#374151]" />
          </div>
          <h2 className="text-lg font-bold text-[#374151] mb-2" style={{ letterSpacing: '-0.02em' }}>
            Ajoutez votre première copropriété
          </h2>
          <p className="text-slate-400 text-sm max-w-xs mx-auto mb-8 leading-relaxed">
            Votre tableau de bord s&apos;animera une fois votre première copropriété créée.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/coproprietes/new" className="inline-flex items-center gap-2 bg-[#374151] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#4B5563] transition-colors">
              <Building2 className="w-4 h-4" /> Créer une copropriété
            </Link>
            <Link href="/importer" className="inline-flex items-center gap-2 bg-slate-50 text-[#374151] px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-100 border border-slate-200 transition-colors">
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

// ─── Carte draggable (mode édition) ──────────────────────────

function DraggableWidgetCard({
  id,
  label,
  description,
  onHide,
}: {
  id: string
  label: string
  description: string
  onHide: () => void
}) {
  const controls = useDragControls()
  const meta = WIDGET_META[id]
  const Icon = meta?.icon ?? BarChart2

  return (
    <Reorder.Item
      value={id}
      dragListener={false}
      dragControls={controls}
      whileDrag={{
        scale: 1.02,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        zIndex: 50,
      }}
      transition={{ duration: 0.15 }}
      className="bg-white rounded-2xl border border-slate-100 flex items-center gap-3 px-4 py-3.5 select-none relative"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)', cursor: 'default' }}
    >
      {/* Icône */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${meta?.bg ?? 'bg-slate-100'}`}>
        <Icon className={`w-4 h-4 ${meta?.color ?? 'text-slate-600'}`} />
      </div>

      {/* Texte */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#374151]">{label}</p>
        <p className="text-xs text-slate-400 truncate">{description}</p>
      </div>

      {/* Masquer */}
      <button
        onClick={onHide}
        className="p-2 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0 text-slate-400 hover:text-slate-600"
        title="Masquer ce bloc"
      >
        <EyeOff className="w-4 h-4" />
      </button>

      {/* Poignée drag — zone active */}
      <div
        onPointerDown={(e) => controls.start(e)}
        className="p-2 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500"
        title="Déplacer"
      >
        <GripVertical className="w-4 h-4" />
      </div>
    </Reorder.Item>
  )
}

// ─── DashboardPrefsEditor (compatibilité Paramètres) ─────────

export function DashboardPrefsEditor({ userId }: { userId: string }) {
  const { widgets, saveWidgets, hydrated } = useDashboardPrefs(userId)
  const [editOrder, setEditOrder] = useState<string[]>([])
  const [editVisible, setEditVisible] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState(false)
  const [initialized, setInitialized] = useState(false)

  if (hydrated && !initialized) {
    setEditOrder(widgets.filter((w) => w.visible).map((w) => w.id))
    setEditVisible(Object.fromEntries(widgets.map((w) => [w.id, w.visible])))
    setInitialized(true)
  }

  function toggleVisibility(id: string) {
    const nowVisible = !editVisible[id]
    setEditVisible((prev) => ({ ...prev, [id]: nowVisible }))
    if (nowVisible) {
      setEditOrder((prev) => [...prev, id])
    } else {
      setEditOrder((prev) => prev.filter((x) => x !== id))
    }
    setSaved(false)
  }

  function handleSave() {
    const hiddenIds = ALL_WIDGETS.map((w) => w.id).filter((id) => !editVisible[id])
    const newPrefs: WidgetPref[] = [
      ...editOrder.map((id) => ({ id, visible: true })),
      ...hiddenIds.map((id) => ({ id, visible: false })),
    ]
    saveWidgets(newPrefs)
    setSaved(true)
    toast.success('Tableau de bord enregistré')
    setTimeout(() => setSaved(false), 3000)
  }

  if (!hydrated || !initialized) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
  }

  const hiddenIds = ALL_WIDGETS.map((w) => w.id).filter((id) => !editVisible[id])
  const getLabel = (id: string) => ALL_WIDGETS.find((w) => w.id === id)?.label ?? id
  const getDesc  = (id: string) => ALL_WIDGETS.find((w) => w.id === id)?.description ?? ''

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Affichés · {editOrder.length} bloc{editOrder.length > 1 ? 's' : ''}
        </p>
        <Reorder.Group axis="y" values={editOrder} onReorder={(v) => { setEditOrder(v); setSaved(false) }} className="space-y-2">
          {editOrder.map((id) => (
            <DraggableWidgetCard
              key={id}
              id={id}
              label={getLabel(id)}
              description={getDesc(id)}
              onHide={() => toggleVisibility(id)}
            />
          ))}
        </Reorder.Group>
      </div>

      {hiddenIds.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Masqués</p>
          <div className="space-y-2">
            {hiddenIds.map((id) => {
              const meta = WIDGET_META[id]
              const Icon = meta?.icon ?? BarChart2
              return (
                <div key={id} className="bg-white rounded-2xl border border-slate-100 px-4 py-3.5 flex items-center gap-3 opacity-50">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${meta?.bg ?? 'bg-slate-100'}`}>
                    <Icon className={`w-4 h-4 ${meta?.color ?? 'text-slate-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#374151]">{getLabel(id)}</p>
                    <p className="text-xs text-slate-400 truncate">{getDesc(id)}</p>
                  </div>
                  <button
                    onClick={() => toggleVisibility(id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex-shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Afficher
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        className="flex items-center gap-2 bg-[#374151] text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[#4B5563] transition-colors"
      >
        {saved && <CheckCircle2 className="w-4 h-4" />}
        {saved ? 'Enregistré !' : 'Enregistrer les modifications'}
      </button>
    </div>
  )
}
