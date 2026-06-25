'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  TrendingUp,
  CalendarDays,
  BarChart2,
  Users,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  Zap,
  PieChart,
  Building2,
  GripHorizontal,
} from 'lucide-react'
import { Reorder } from 'framer-motion'
import { useDashboardPrefs, ALL_WIDGETS } from '@/hooks/useDashboardPrefs'
import type { WidgetPref } from '@/hooks/useDashboardPrefs'
import { toast } from 'sonner'

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
