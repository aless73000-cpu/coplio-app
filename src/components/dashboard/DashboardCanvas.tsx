'use client'

import Link from 'next/link'
import { useState, useCallback, useEffect, useRef } from 'react'
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
  X,
} from 'lucide-react'
import { Reorder, motion } from 'framer-motion'
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

// ─── Widget metadata ──────────────────────────────────────────

const WIDGET_LABELS: Record<string, string> = {
  kpi_group:           'Indicateurs clés (KPIs)',
  kpi_coproprietes:    'Copropriétés',
  kpi_lots:            'Lots gérés',
  kpi_sinistres:       'Sinistres',
  kpi_impayes:         'Impayés',
  kpi_coproprietaires: 'Copropriétaires',
  kpi_portail:         'Portail actif',
  kpi_ag:              'AG à venir',
  kpi_recouvrement:    'Recouvrement',
  alertes_intelligentes:'Alertes intelligentes',
  graphiques_finances: 'Graphiques financiers',
  graphiques_copros:   'Graphiques copropriétés',
  performance:         'Performance cabinet',
  alertes_coproprietes:'Alertes copropriétés',
  sinistres:           'Sinistres en cours',
  ag:                  'AG à venir',
  actions_rapides:     'Actions rapides',
}

const WIDGET_ICONS: Record<string, React.ElementType> = {
  kpi_group: BarChart2,
  kpi_coproprietes: Building2, kpi_lots: Home,
  kpi_sinistres: AlertTriangle, kpi_impayes: CreditCard,
  kpi_coproprietaires: Users, kpi_portail: TrendingUp,
  kpi_ag: CalendarDays, kpi_recouvrement: BarChart2,
  alertes_intelligentes: AlertTriangle, graphiques_finances: TrendingUp,
  graphiques_copros: PieChart, performance: BarChart2,
  alertes_coproprietes: Building2, sinistres: AlertTriangle,
  ag: CalendarDays, actions_rapides: Zap,
}

// KPIs individuels → regroupement automatique en grille dans le rendu normal
const KPI_IDS = new Set([
  'kpi_coproprietes','kpi_lots','kpi_sinistres','kpi_impayes',
  'kpi_coproprietaires','kpi_portail','kpi_ag','kpi_recouvrement',
])

// ─── DashboardCanvas ──────────────────────────────────────────

export function DashboardCanvas({ data, autoEdit }: { data: DashboardData; autoEdit?: boolean }) {
  const { widgets, saveWidgets, hydrated } = useDashboardPrefs(data.userId)
  const [editMode, setEditMode] = useState(false)
  const [editOrder, setEditOrder] = useState<string[]>([])
  const [editVisible, setEditVisible] = useState<Record<string, boolean>>({})
  const dialogRef = useRef<HTMLDialogElement>(null)

  // Ouvre/ferme le <dialog> natif en sync avec editMode
  useEffect(() => {
    const dlg = dialogRef.current
    if (!dlg) return
    if (editMode) {
      if (!dlg.open) dlg.showModal()
    } else {
      if (dlg.open) dlg.close()
    }
  }, [editMode])

  // Auto-ouverture si venu depuis Paramètres
  useEffect(() => {
    if (autoEdit && hydrated) enterEdit()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoEdit, hydrated])

  const DEFAULT_ORDER = [
    'kpi_coproprietes', 'kpi_lots', 'kpi_sinistres', 'kpi_impayes',
    'kpi_coproprietaires', 'kpi_portail', 'kpi_ag', 'kpi_recouvrement',
    'alertes_intelligentes', 'graphiques_finances',
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
    // Regrouper les 8 KPIs en un seul bloc 'kpi_group' à la position du premier KPI
    let kpiInserted = false
    const groupedOrder: string[] = []
    for (const id of order) {
      if (KPI_IDS.has(id)) {
        if (!kpiInserted) { groupedOrder.push('kpi_group'); kpiInserted = true }
      } else {
        groupedOrder.push(id)
      }
    }
    if (!kpiInserted) groupedOrder.unshift('kpi_group')
    setEditOrder(groupedOrder)
    setEditVisible(vis)
    setEditMode(true)
  }

  function cancelEdit() { setEditMode(false) }

  function saveEdit() {
    // Ré-expandre 'kpi_group' en IDs KPI individuels (dans l'ordre DEFAULT_ORDER)
    const kpiIds = DEFAULT_ORDER.filter((id) => KPI_IDS.has(id))
    const expandedOrder = editOrder.flatMap((id) => id === 'kpi_group' ? kpiIds : [id])
    const newPrefs: WidgetPref[] = expandedOrder.map((id) => ({ id, visible: editVisible[id] ?? true }))
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
      // ── KPIs individuels ────────────────────────────────────
      case 'kpi_coproprietes':
        return <KpiCard title="Copropriétés" value={data.kpis.nb_coproprietes} icon={Building2} href="/coproprietes" color="green" />
      case 'kpi_lots':
        return <KpiCard title="Lots gérés" value={data.kpis.nb_lots} icon={Home} href="/coproprietes" color="blue" />
      case 'kpi_sinistres':
        return <KpiCard title="Sinistres" value={data.kpis.nb_sinistres_ouverts} icon={AlertTriangle} href="/sinistres" color={data.kpis.nb_sinistres_ouverts > 0 ? 'amber' : 'green'} />
      case 'kpi_impayes':
        return <KpiCard title="Impayés totaux" value={formatEuro(data.kpis.montant_total_impayes)} icon={CreditCard} href="/impayes" color={data.kpis.montant_total_impayes > 0 ? 'red' : 'green'} isAmount />
      case 'kpi_coproprietaires':
        return <KpiCard title="Copropriétaires" value={data.kpis.nb_coproprietaires} icon={Users} href="/coproprietaires" color="blue" />
      case 'kpi_portail':
        return <KpiCard title="Portail actif" value={data.kpis.nb_portail_actif} icon={TrendingUp} href="/coproprietaires"
          color={data.kpis.nb_portail_actif > 0 ? 'green' : 'amber'}
          sub={data.kpis.nb_coproprietaires > 0 ? `${Math.round((data.kpis.nb_portail_actif / data.kpis.nb_coproprietaires) * 100)}% avec accès` : undefined} />
      case 'kpi_ag':
        return <KpiCard title="AG à venir" value={data.kpis.nb_ag_a_preparer} icon={CalendarDays} href="/assemblees" color={data.kpis.nb_ag_a_preparer > 0 ? 'amber' : 'green'} />
      case 'kpi_recouvrement':
        return <KpiCard title="Recouvrement" value={`${data.tauxGlobal}%`} icon={BarChart2} href="/appels-charges" color={data.tauxGlobal >= 90 ? 'green' : data.tauxGlobal >= 70 ? 'amber' : 'red'} />
      case 'alertes_intelligentes':
        if (data.smartAlerts.length === 0) return null
        return (
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
        if (!data.hasAppels) return null
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2"><EvolutionChart data={data.evolutionData} /></div>
            <TauxGlobalCard taux={data.tauxGlobal} montantRecouvre={data.totalRecouvre} montantTotal={data.totalEmis} />
          </div>
        )
      case 'graphiques_copros': {
        const hasData = data.tauxData.length > 0 || (data.statutData.aJour + data.statutData.attention + data.statutData.urgent) > 0
        if (!hasData) return null
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RecouvrementChart data={data.tauxData} />
            <StatutChart {...data.statutData} />
          </div>
        )
      }
      case 'performance':
        return <PerformanceSection tauxGlobal={data.tauxGlobal} nbCoproprietes={data.kpis.nb_coproprietes} nbLots={data.kpis.nb_lots} />
      case 'alertes_coproprietes':
        if (data.coproprietesCritiques.length === 0) return null
        return (
          <div className="coplio-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#374151]">Alertes copropriétés</h2>
              <Link href="/coproprietes" className="text-xs text-slate-400 hover:text-[#374151] transition-colors flex items-center gap-1">Voir tout <ArrowRight className="w-3 h-3" /></Link>
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
          <div className="coplio-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#374151]">Sinistres en cours</h2>
              <Link href="/sinistres" className="text-xs text-slate-400 hover:text-[#374151] transition-colors flex items-center gap-1">Voir tout <ArrowRight className="w-3 h-3" /></Link>
            </div>
            <div className="space-y-0.5">{data.sinistres.map((s) => <SinistreRow key={s.id} sinistre={s} />)}</div>
          </div>
        )
      case 'ag':
        if (!data.agProchaines || data.agProchaines.length === 0) return null
        return (
          <div className="coplio-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#374151]">AG à venir</h2>
              <Link href="/assemblees/new" className="text-xs text-slate-400 hover:text-[#374151] transition-colors">+ Planifier</Link>
            </div>
            <div className="space-y-0.5">{data.agProchaines.map((ag) => <AgRow key={ag.id} ag={ag} />)}</div>
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

  // ─── Rendu principal ──────────────────────────────────────────

  return (
    <>
      {/* ── Dashboard normal (toujours visible) ── */}
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

        {/* Bloc KPIs — 4 colonnes côte à côte, toujours groupés */}
        {(() => {
          const visibleKpis = orderedIds.filter((id) => KPI_IDS.has(id) && isVisible(id))
          if (visibleKpis.length === 0) return null
          return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {visibleKpis.map((id) => (
                <div key={id} className="min-w-0">{getWidgetContent(id)}</div>
              ))}
            </div>
          )
        })()}

        {/* Autres blocs dans l'ordre personnalisé */}
        {orderedIds.filter((id) => !KPI_IDS.has(id)).map((id) => {
          if (!isVisible(id)) return null
          const content = getWidgetContent(id)
          if (!content) return null
          return <div key={id}>{content}</div>
        })}
      </div>

      {/* ── Modal <dialog> natif — grand écran, vrais widgets glissables ── */}
      <dialog
        ref={dialogRef}
        onClose={cancelEdit}
        style={{
          margin: 'auto',
          padding: 0,
          width: 'min(82vw, 1000px)',
          height: '90vh',
          border: 'none',
          borderRadius: 20,
          boxShadow: '0 24px 80px rgba(0,0,0,0.28)',
          overflow: 'hidden',
          background: '#f8fafc',
          /* PAS de display:flex ici — le navigateur gère show/hide via display:none */
        }}
      >
        <style>{`
          dialog::backdrop { background: rgba(0,0,0,0.55); backdrop-filter: blur(6px); }
          dialog[open] { display: flex; flex-direction: column; }
        `}</style>

        {/* Barre du haut */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', background: '#fff',
          borderBottom: '1px solid #e2e8f0', flexShrink: 0,
        }}>
          <button onClick={cancelEdit} style={{ fontSize: 14, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 10 }}>
            Annuler
          </button>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#374151', margin: 0, letterSpacing: '-0.3px' }}>
              Personnaliser le tableau de bord
            </p>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>
              Maintenez un bloc et glissez-le pour le déplacer
            </p>
          </div>
          <button onClick={saveEdit} style={{
            fontSize: 14, fontWeight: 700, color: '#fff',
            background: '#374151', border: 'none', cursor: 'pointer',
            padding: '7px 16px', borderRadius: 10,
          }}>
            Enregistrer
          </button>
        </div>

        {/* Corps — vrais widgets glissables */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>
          <Reorder.Group axis="y" values={editOrder} onReorder={setEditOrder} as="div" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {editOrder.map((id) => {
              const Icon = WIDGET_ICONS[id] ?? BarChart2

              // ── Bloc spécial : groupe KPIs en grille 4 colonnes ──
              if (id === 'kpi_group') {
                const kpiIds = DEFAULT_ORDER.filter((k) => KPI_IDS.has(k))
                return (
                  <Reorder.Item
                    key="kpi_group" value="kpi_group"
                    style={{ listStyle: 'none', cursor: 'grab' }}
                    whileDrag={{ scale: 1.01, boxShadow: '0 16px 48px rgba(0,0,0,0.18)', zIndex: 50, borderRadius: 16 }}
                    transition={{ duration: 0.15 }}
                  >
                    {/* Barre de drag du groupe */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '7px 14px 7px 10px', background: '#fff',
                      borderRadius: '14px 14px 0 0',
                      border: '1px solid #e2e8f0', borderBottom: 'none',
                      userSelect: 'none',
                    }}>
                      <GripHorizontal style={{ width: 16, height: 16, color: '#cbd5e1', flexShrink: 0 }} />
                      <div style={{ width: 24, height: 24, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <BarChart2 style={{ width: 13, height: 13, color: '#64748b' }} />
                      </div>
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                        Indicateurs clés — glissez ce bloc pour le déplacer
                      </span>
                    </div>

                    {/* Grille 4 colonnes des KPIs avec œil individuel */}
                    <div style={{
                      border: '1px solid #e2e8f0', borderTop: 'none',
                      borderRadius: '0 0 14px 14px',
                      background: '#f8fafc', overflow: 'hidden',
                      padding: 14,
                    }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 10,
                      }}>
                        {kpiIds.map((kpiId) => {
                          const kpiVisible = editVisible[kpiId] ?? true
                          const KpiIcon = WIDGET_ICONS[kpiId] ?? BarChart2
                          return (
                            <div key={kpiId} style={{ position: 'relative' }}>
                              {/* Aperçu mini du KPI */}
                              <div style={{
                                pointerEvents: 'none', userSelect: 'none',
                                opacity: kpiVisible ? 1 : 0.3,
                                transition: 'opacity 0.2s',
                                background: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: 12,
                                overflow: 'hidden',
                              }}>
                                {getWidgetContent(kpiId)}
                              </div>
                              {/* Bouton œil positionné en absolu sur la carte */}
                              <button
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); toggleVisibility(kpiId) }}
                                title={kpiVisible ? 'Masquer' : 'Afficher'}
                                style={{
                                  position: 'absolute', top: 6, right: 6,
                                  width: 24, height: 24,
                                  borderRadius: 8,
                                  border: 'none',
                                  background: kpiVisible ? 'rgba(241,245,249,0.9)' : 'rgba(254,226,226,0.9)',
                                  backdropFilter: 'blur(4px)',
                                  cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  zIndex: 10,
                                }}>
                                {kpiVisible
                                  ? <Eye style={{ width: 12, height: 12, color: '#64748b' }} />
                                  : <EyeOff style={{ width: 12, height: 12, color: '#dc2626' }} />
                                }
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </Reorder.Item>
                )
              }

              // ── Bloc standard ──
              const visible = editVisible[id] ?? true
              const content = getWidgetContent(id)
              return (
                <Reorder.Item
                  key={id} value={id} style={{ listStyle: 'none', cursor: 'grab' }}
                  whileDrag={{ scale: 1.01, boxShadow: '0 16px 48px rgba(0,0,0,0.18)', zIndex: 50, borderRadius: 16 }}
                  transition={{ duration: 0.15 }}
                >
                  <div style={{ opacity: visible ? 1 : 0.35, transition: 'opacity 0.2s' }}>
                    {/* Barre de drag au-dessus du widget */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '7px 14px 7px 10px',
                      background: '#fff',
                      borderRadius: '14px 14px 0 0',
                      border: '1px solid #e2e8f0', borderBottom: 'none',
                      userSelect: 'none',
                    }}>
                      <GripHorizontal style={{ width: 16, height: 16, color: '#cbd5e1', flexShrink: 0 }} />
                      <div style={{ width: 24, height: 24, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon style={{ width: 13, height: 13, color: '#64748b' }} />
                      </div>
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                        {WIDGET_LABELS[id]}
                      </span>
                      <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); toggleVisibility(id) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '4px 10px', borderRadius: 8, border: 'none',
                          background: visible ? '#f1f5f9' : '#fee2e2',
                          cursor: 'pointer', fontSize: 11, fontWeight: 600,
                          color: visible ? '#64748b' : '#dc2626',
                        }}>
                        {visible
                          ? <><Eye style={{ width: 13, height: 13 }} /> Visible</>
                          : <><EyeOff style={{ width: 13, height: 13 }} /> Masqué</>
                        }
                      </button>
                    </div>

                    {/* Contenu réel du widget — pointer-events-none pour éviter les clics accidentels */}
                    <div style={{
                      pointerEvents: 'none', userSelect: 'none',
                      border: '1px solid #e2e8f0', borderTop: 'none',
                      borderRadius: '0 0 14px 14px',
                      background: '#fff', overflow: 'hidden',
                      padding: content ? 0 : '20px 16px',
                    }}>
                      {content
                        ? <div style={{ padding: 14 }}>{content}</div>
                        : <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', margin: 0 }}>
                            Aucune donnée pour l&apos;instant
                          </p>
                      }
                    </div>
                  </div>
                </Reorder.Item>
              )
            })}
          </Reorder.Group>
        </div>
      </dialog>
    </>
  )
}

// ─── DashboardPrefsEditor (page Paramètres) ───────────────────

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

  const ICONS: Record<string, React.ElementType> = {
    kpis_1: BarChart2, kpis_2: Users,
    alertes_intelligentes: AlertTriangle, graphiques_finances: TrendingUp,
    graphiques_copros: PieChart, performance: BarChart2,
    alertes_coproprietes: Building2, sinistres: AlertTriangle,
    ag: CalendarDays, actions_rapides: Zap,
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-400">Maintenez ≡ pour réorganiser · cliquez sur l&apos;œil pour masquer</p>
      <Reorder.Group axis="y" values={editOrder} onReorder={(v) => { setEditOrder(v); setSaved(false) }} as="div" className="space-y-2">
        {editOrder.map((id) => {
          const Icon = ICONS[id] ?? BarChart2
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
