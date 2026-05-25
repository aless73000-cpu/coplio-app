'use client'

import Link from 'next/link'
import { useState, useCallback } from 'react'
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
  GripHorizontal,
  SlidersHorizontal,
} from 'lucide-react'
import { Reorder, useDragControls, motion } from 'framer-motion'
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
  id: string; label: string; description: string; href: string; done: boolean
}
interface SmartAlert {
  id: string; severity: 'warning' | 'info'; message: string; href: string; cta: string
}

export interface DashboardData {
  userId: string
  prenom: string
  cabinetNom: string
  trialEndsAt: string | null
  plan: string | null
  onboardingSteps: OnboardingStep[]
  kpis: {
    nb_coproprietes: number; nb_lots: number; nb_sinistres_ouverts: number
    montant_total_impayes: number; nb_ag_a_preparer: number
    nb_coproprietaires: number; nb_portail_actif: number
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

// ─── Widget labels ────────────────────────────────────────────

const WIDGET_LABELS: Record<string, string> = {
  kpis_1:               'KPIs principaux',
  kpis_2:               'KPIs secondaires',
  alertes_intelligentes:'Alertes intelligentes',
  graphiques_finances:  'Graphiques financiers',
  graphiques_copros:    'Graphiques copropriétés',
  performance:          'Performance cabinet',
  alertes_coproprietes: 'Alertes copropriétés',
  sinistres:            'Sinistres en cours',
  ag:                   'AG à venir',
  actions_rapides:      'Actions rapides',
}

const WIDGET_ICONS: Record<string, React.ElementType> = {
  kpis_1: BarChart2, kpis_2: Users,
  alertes_intelligentes: AlertTriangle, graphiques_finances: TrendingUp,
  graphiques_copros: PieChart, performance: BarChart2,
  alertes_coproprietes: Building2, sinistres: AlertTriangle,
  ag: CalendarDays, actions_rapides: Zap,
}

// ─── DashboardCanvas ──────────────────────────────────────────

export function DashboardCanvas({ data }: { data: DashboardData }) {
  const { widgets, saveWidgets, hydrated } = useDashboardPrefs(data.userId)
  const [editMode, setEditMode] = useState(false)
  const [editOrder, setEditOrder] = useState<string[]>([])
  const [editVisible, setEditVisible] = useState<Record<string, boolean>>({})

  const DEFAULT_ORDER = [
    'kpis_1', 'kpis_2', 'alertes_intelligentes', 'graphiques_finances',
    'graphiques_copros', 'performance', 'alertes_coproprietes',
    'sinistres', 'ag', 'actions_rapides',
  ]

  const orderedIds = hydrated ? widgets.map((w) => w.id) : DEFAULT_ORDER
  const isVisible  = useCallback((id: string) => {
    if (!hydrated) return true
    return widgets.find((w) => w.id === id)?.visible ?? true
  }, [widgets, hydrated])

  function enterEdit() {
    const order = hydrated ? widgets.map((w) => w.id) : DEFAULT_ORDER
    const vis = Object.fromEntries(
      order.map((id) => [id, hydrated ? (widgets.find((w) => w.id === id)?.visible ?? true) : true])
    )
    setEditOrder(order)
    setEditVisible(vis)
    setEditMode(true)
  }

  function cancelEdit() { setEditMode(false) }

  function saveEdit() {
    const newPrefs: WidgetPref[] = editOrder.map((id) => ({ id, visible: editVisible[id] ?? true }))
    saveWidgets(newPrefs)
    setEditMode(false)
    toast.success('Tableau de bord enregistré ✓')
  }

  function toggleVisibility(id: string) {
    setEditVisible((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // ─── Contenu de chaque widget ──────────────────────────────

  function getWidgetContent(id: string) {
    switch (id) {
      case 'kpis_1':
        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Copropriétés"   value={data.kpis.nb_coproprietes}            icon={Building2}     href="/coproprietes"    color="green" />
            <KpiCard title="Lots gérés"     value={data.kpis.nb_lots}                    icon={Home}          href="/coproprietes"    color="blue" />
            <KpiCard title="Sinistres"       value={data.kpis.nb_sinistres_ouverts}       icon={AlertTriangle} href="/sinistres"       color={data.kpis.nb_sinistres_ouverts > 0 ? 'amber' : 'green'} />
            <KpiCard title="Impayés totaux"  value={formatEuro(data.kpis.montant_total_impayes)} icon={CreditCard} href="/impayes" color={data.kpis.montant_total_impayes > 0 ? 'red' : 'green'} isAmount />
          </div>
        )
      case 'kpis_2':
        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Copropriétaires" value={data.kpis.nb_coproprietaires} icon={Users}        href="/coproprietaires" color="blue" />
            <KpiCard title="Portail actif"   value={data.kpis.nb_portail_actif}   icon={TrendingUp}   href="/coproprietaires"
              color={data.kpis.nb_portail_actif > 0 ? 'green' : 'amber'}
              sub={data.kpis.nb_coproprietaires > 0 ? `${Math.round((data.kpis.nb_portail_actif / data.kpis.nb_coproprietaires) * 100)}% avec accès` : undefined} />
            <KpiCard title="AG à venir"     value={data.kpis.nb_ag_a_preparer}  icon={CalendarDays} href="/assemblees"      color={data.kpis.nb_ag_a_preparer > 0 ? 'amber' : 'green'} />
            <KpiCard title="Recouvrement"   value={`${data.tauxGlobal}%`}       icon={BarChart2}    href="/appels-charges"  color={data.tauxGlobal >= 90 ? 'green' : data.tauxGlobal >= 70 ? 'amber' : 'red'} />
          </div>
        )
      case 'alertes_intelligentes':
        if (!editMode && data.smartAlerts.length === 0) return null
        return data.smartAlerts.length === 0 ? (
          <div className="coplio-card">
            <p className="text-sm text-slate-400 text-center py-4">Aucune alerte intelligente pour le moment</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.smartAlerts.map((alert) => (
              <div key={alert.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${alert.severity === 'warning' ? 'bg-amber-50 border border-amber-100' : 'bg-blue-50 border border-blue-100'}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${alert.severity === 'warning' ? 'bg-amber-100' : 'bg-blue-100'}`}>
                  <AlertTriangle className={`w-3.5 h-3.5 ${alert.severity === 'warning' ? 'text-amber-600' : 'text-blue-600'}`} />
                </div>
                <p className={`flex-1 font-medium ${alert.severity === 'warning' ? 'text-amber-900' : 'text-blue-900'}`}>{alert.message}</p>
                <Link href={alert.href} className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors ${alert.severity === 'warning' ? 'bg-amber-200 hover:bg-amber-300 text-amber-900' : 'bg-blue-200 hover:bg-blue-300 text-blue-900'}`}>{alert.cta}</Link>
              </div>
            ))}
          </div>
        )
      case 'graphiques_finances':
        if (!editMode && !data.hasAppels) return null
        return !data.hasAppels ? (
          <div className="coplio-card"><p className="text-sm text-slate-400 text-center py-4">Aucun appel de charges pour le moment</p></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2"><EvolutionChart data={data.evolutionData} /></div>
            <TauxGlobalCard taux={data.tauxGlobal} montantRecouvre={data.totalRecouvre} montantTotal={data.totalEmis} />
          </div>
        )
      case 'graphiques_copros': {
        const hasData = data.tauxData.length > 0 || (data.statutData.aJour + data.statutData.attention + data.statutData.urgent) > 0
        if (!editMode && !hasData) return null
        return !hasData ? (
          <div className="coplio-card"><p className="text-sm text-slate-400 text-center py-4">Aucune donnée de copropriété pour le moment</p></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RecouvrementChart data={data.tauxData} />
            <StatutChart {...data.statutData} />
          </div>
        )
      }
      case 'performance':
        return <PerformanceSection tauxGlobal={data.tauxGlobal} nbCoproprietes={data.kpis.nb_coproprietes} nbLots={data.kpis.nb_lots} />
      case 'alertes_coproprietes':
        if (!editMode && data.coproprietesCritiques.length === 0) return null
        return (
          <div className="coplio-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#374151]">Alertes copropriétés</h2>
              <Link href="/coproprietes" className="text-xs text-slate-400 hover:text-[#374151] transition-colors flex items-center gap-1">Voir tout <ArrowRight className="w-3 h-3" /></Link>
            </div>
            {data.coproprietesCritiques.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Aucune alerte en cours</p>
            ) : (
              <div className="space-y-0.5">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {data.coproprietesCritiques.map((c) => <CoproprieteAlertRow key={c.id} copropriete={c as any} />)}
              </div>
            )}
          </div>
        )
      case 'sinistres':
        if (!editMode && (!data.sinistres || data.sinistres.length === 0)) return null
        return (
          <div className="coplio-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#374151]">Sinistres en cours</h2>
              <Link href="/sinistres" className="text-xs text-slate-400 hover:text-[#374151] transition-colors flex items-center gap-1">Voir tout <ArrowRight className="w-3 h-3" /></Link>
            </div>
            {(!data.sinistres || data.sinistres.length === 0) ? (
              <p className="text-sm text-slate-400 text-center py-4">Aucun sinistre en cours</p>
            ) : (
              <div className="space-y-0.5">{data.sinistres.map((s) => <SinistreRow key={s.id} sinistre={s} />)}</div>
            )}
          </div>
        )
      case 'ag':
        if (!editMode && (!data.agProchaines || data.agProchaines.length === 0)) return null
        return (
          <div className="coplio-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#374151]">AG à venir</h2>
              <Link href="/assemblees/new" className="text-xs text-slate-400 hover:text-[#374151] transition-colors">+ Planifier</Link>
            </div>
            {(!data.agProchaines || data.agProchaines.length === 0) ? (
              <p className="text-sm text-slate-400 text-center py-4">Aucune AG planifiée</p>
            ) : (
              <div className="space-y-0.5">{data.agProchaines.map((ag) => <AgRow key={ag.id} ag={ag} />)}</div>
            )}
          </div>
        )
      case 'actions_rapides':
        return (
          <div className="coplio-card">
            <h2 className="text-sm font-semibold text-[#374151] mb-3">Actions rapides</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { href: '/coproprietes/new',   label: 'Nouvelle copropriété', icon: Building2 },
                { href: '/appels-charges/new', label: 'Appel de charges',     icon: Receipt },
                { href: '/sinistres/new',       label: 'Déclarer sinistre',    icon: AlertTriangle },
                { href: '/assemblees/new',      label: 'Planifier une AG',     icon: CalendarDays },
                { href: '/impayes',             label: 'Gérer les impayés',    icon: CreditCard },
              ].map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}
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

  // ─── Mode édition iOS ─────────────────────────────────────────

  if (editMode) {
    return (
      <div className="space-y-4">

        {/* Barre sticky en haut */}
        <div className="sticky top-0 z-40 bg-white rounded-2xl border border-slate-100 px-5 py-3.5 flex items-center justify-between"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
        >
          <div>
            <p className="text-sm font-semibold text-[#374151]" style={{ letterSpacing: '-0.01em' }}>
              Personnaliser
            </p>
            <p className="text-xs text-slate-400">Maintenez ≡ pour déplacer un bloc</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={cancelEdit}
              className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
            <button onClick={saveEdit}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#374151] text-white hover:bg-[#4B5563] transition-colors"
            >
              Terminé
            </button>
          </div>
        </div>

        {/* Dashboard draggable */}
        <Reorder.Group axis="y" values={editOrder} onReorder={setEditOrder} as="div" className="space-y-4">
          {editOrder.map((id) => {
            const content = getWidgetContent(id)
            const visible = editVisible[id] ?? true
            const Icon = WIDGET_ICONS[id] ?? BarChart2

            return (
              <DragItem key={id} id={id}>
                <div className={`transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-40'}`}>

                  {/* Handle bar */}
                  <DragHandle id={id} label={WIDGET_LABELS[id]} icon={Icon} visible={visible} onToggle={() => toggleVisibility(id)} />

                  {/* Contenu réel du widget */}
                  <div className={`pointer-events-none select-none ${!visible ? 'grayscale' : ''}`}>
                    {content ?? (
                      <div className="coplio-card">
                        <p className="text-sm text-slate-400 text-center py-3">Aucune donnée</p>
                      </div>
                    )}
                  </div>
                </div>
              </DragItem>
            )
          })}
        </Reorder.Group>

      </div>
    )
  }

  // ─── Mode normal ──────────────────────────────────────────────

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#374151]" style={{ letterSpacing: '-0.02em' }}>
            Bonjour, {data.prenom} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={enterEdit}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-[#374151] hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Personnaliser</span>
          </button>
          <div className="hidden md:block">
            <RapportMensuelButton data={{
              coproprietes: data.coproprietesCritiques as Copropriete[],
              totalEmis: data.totalEmis, totalRecouvre: data.totalRecouvre,
              tauxGlobal: data.tauxGlobal, cabinetNom: data.cabinetNom,
            }} />
          </div>
        </div>
      </div>

      <TrialBanner trialEndsAt={data.trialEndsAt} plan={data.plan} />
      <OnboardingChecklist steps={data.onboardingSteps} />

      {data.kpis.nb_coproprietes === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 text-center py-16 px-6"
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
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

      {orderedIds.map((id) => {
        if (!isVisible(id)) return null
        const content = getWidgetContent(id)
        if (!content) return null
        return <div key={id}>{content}</div>
      })}
    </div>
  )
}

// ─── Reorder.Item wrapper ─────────────────────────────────────

function DragItem({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <Reorder.Item
      value={id}
      whileDrag={{ scale: 1.015, boxShadow: '0 12px 40px rgba(0,0,0,0.14)', zIndex: 50, borderRadius: 16 }}
      transition={{ duration: 0.18 }}
      style={{ position: 'relative', listStyle: 'none' }}
    >
      {children}
    </Reorder.Item>
  )
}

// ─── Poignée de drag ──────────────────────────────────────────

function DragHandle({
  id, label, icon: Icon, visible, onToggle,
}: {
  id: string; label: string; icon: React.ElementType; visible: boolean; onToggle: () => void
}) {
  const controls = useDragControls()

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 mb-1.5 bg-white rounded-xl border border-slate-200 select-none"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      {/* Grip — zone de drag */}
      <div
        onPointerDown={(e) => {
          // Transmet l'événement au Reorder.Item parent
          const item = (e.currentTarget as HTMLElement).closest('[data-framer-name], [style]')
          if (item) {
            const event = new PointerEvent('pointerdown', e.nativeEvent)
            item.dispatchEvent(event)
          }
          controls.start(e)
        }}
        className="cursor-grab active:cursor-grabbing p-1.5 -ml-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 touch-none"
      >
        <GripHorizontal className="w-4 h-4" />
      </div>

      {/* Icône + label */}
      <Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
      <span className="text-xs font-semibold text-slate-500 flex-1">{label}</span>

      {/* Toggle visibilité */}
      <button
        onClick={onToggle}
        className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${visible ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'}`}
        title={visible ? 'Masquer ce bloc' : 'Afficher ce bloc'}
      >
        {visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
      </button>
    </div>
  )
}

// ─── DashboardPrefsEditor (Paramètres) ───────────────────────

export function DashboardPrefsEditor({ userId }: { userId: string }) {
  const { widgets, saveWidgets, hydrated } = useDashboardPrefs(userId)
  const [editOrder, setEditOrder] = useState<string[]>([])
  const [editVisible, setEditVisible] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState(false)
  const [initialized, setInitialized] = useState(false)

  if (hydrated && !initialized) {
    setEditOrder(widgets.map((w) => w.id))
    setEditVisible(Object.fromEntries(widgets.map((w) => [w.id, w.visible])))
    setInitialized(true)
  }

  function toggleVisibility(id: string) {
    setEditVisible((prev) => ({ ...prev, [id]: !prev[id] }))
    setSaved(false)
  }

  function handleSave() {
    const newPrefs: WidgetPref[] = editOrder.map((id) => ({ id, visible: editVisible[id] ?? true }))
    saveWidgets(newPrefs)
    setSaved(true)
    toast.success('Tableau de bord enregistré')
    setTimeout(() => setSaved(false), 3000)
  }

  if (!hydrated || !initialized) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
  }

  const getLabel = (id: string) => ALL_WIDGETS.find((w) => w.id === id)?.label ?? id
  const getDesc  = (id: string) => ALL_WIDGETS.find((w) => w.id === id)?.description ?? ''

  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-400">Maintenez ≡ pour réorganiser · cliquez sur l&apos;œil pour masquer</p>
      <Reorder.Group axis="y" values={editOrder} onReorder={(v) => { setEditOrder(v); setSaved(false) }} as="div" className="space-y-2">
        {editOrder.map((id) => {
          const Icon = WIDGET_ICONS[id] ?? BarChart2
          const visible = editVisible[id] ?? true
          return (
            <Reorder.Item
              key={id}
              value={id}
              whileDrag={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50 }}
              style={{ listStyle: 'none' }}
            >
              <div className={`bg-white rounded-xl border border-slate-100 px-4 py-3 flex items-center gap-3 select-none ${!visible ? 'opacity-50' : ''}`}
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <GripHorizontal className="w-4 h-4 text-slate-300 flex-shrink-0 cursor-grab" />
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${visible ? 'bg-slate-100' : 'bg-slate-50'}`}>
                  <Icon className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#374151]">{getLabel(id)}</p>
                  <p className="text-xs text-slate-400 truncate">{getDesc(id)}</p>
                </div>
                <button onClick={() => toggleVisibility(id)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
                  {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </Reorder.Item>
          )
        })}
      </Reorder.Group>

      <button onClick={handleSave}
        className="flex items-center gap-2 bg-[#374151] text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[#4B5563] transition-colors">
        {saved && <CheckCircle2 className="w-4 h-4" />}
        {saved ? 'Enregistré !' : 'Enregistrer les modifications'}
      </button>
    </div>
  )
}
