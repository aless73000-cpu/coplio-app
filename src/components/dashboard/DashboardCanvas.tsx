'use client'

import Link from 'next/link'
import { useState, useCallback, useEffect } from 'react'
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
import { useDashboardPrefs } from '@/hooks/useDashboardPrefs'
import type { WidgetPref } from '@/hooks/useDashboardPrefs'
import type { Copropriete } from '@/types'
import { ConformiteLegale } from '@/components/syndic/ConformiteLegale'
import { toast } from 'sonner'
import { type DashboardData, KPI_IDS, DEFAULT_ORDER } from './dashboard-widgets'
import { DashboardEditModal } from './DashboardEditModal'

export type { DashboardData }
export { DashboardPrefsEditor } from './DashboardPrefsEditor'

// ─── DashboardCanvas ──────────────────────────────────────────

export function DashboardCanvas({ data, autoEdit }: { data: DashboardData; autoEdit?: boolean }) {
  const { widgets, saveWidgets, hydrated } = useDashboardPrefs(data.userId)
  const [editMode, setEditMode] = useState(false)
  const [editOrder, setEditOrder] = useState<string[]>([])
  const [editKpiOrder, setEditKpiOrder] = useState<string[]>([])
  const [editVisible, setEditVisible] = useState<Record<string, boolean>>({})

  // Auto-ouverture si venu depuis Paramètres
  useEffect(() => {
    if (autoEdit && hydrated) enterEdit()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoEdit, hydrated])

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
    const kpiOrderFound: string[] = []
    for (const id of order) {
      if (KPI_IDS.has(id)) {
        kpiOrderFound.push(id)
        if (!kpiInserted) { groupedOrder.push('kpi_group'); kpiInserted = true }
      } else {
        groupedOrder.push(id)
      }
    }
    if (!kpiInserted) groupedOrder.unshift('kpi_group')
    // Ordre KPI = celui sauvegardé (ou DEFAULT_ORDER si aucun)
    setEditKpiOrder(kpiOrderFound.length > 0 ? kpiOrderFound : DEFAULT_ORDER.filter((id) => KPI_IDS.has(id)))
    setEditOrder(groupedOrder)
    setEditVisible(vis)
    setEditMode(true)
  }

  function cancelEdit() { setEditMode(false) }

  function saveEdit() {
    // Ré-expandre 'kpi_group' en IDs KPI individuels (dans l'ordre personnalisé)
    const expandedOrder = editOrder.flatMap((id) => id === 'kpi_group' ? editKpiOrder : [id])
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
      case 'conformite_legale': {
        if (!data.conformiteData) return null
        const copros = data.allCoproprietes ?? data.coproprietesCritiques
        return (
          <ConformiteLegale
            coproprietes={copros}
            agRecentes={data.conformiteData.agRecentes}
            fondsTravaux={data.conformiteData.fondsTravaux}
          />
        )
      }
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
      <DashboardEditModal
        editMode={editMode}
        editOrder={editOrder}
        setEditOrder={setEditOrder}
        editKpiOrder={editKpiOrder}
        setEditKpiOrder={setEditKpiOrder}
        editVisible={editVisible}
        toggleVisibility={toggleVisibility}
        onSave={saveEdit}
        onCancel={cancelEdit}
        renderWidget={getWidgetContent}
      />
    </>
  )
}
