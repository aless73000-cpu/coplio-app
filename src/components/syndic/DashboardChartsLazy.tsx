'use client'

/**
 * Wrapper lazy pour DashboardCharts (recharts = ~150 kB)
 * Chargé dynamiquement pour ne pas alourdir le bundle initial du dashboard.
 */
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Hauteur identique aux charts réels → évite le CLS au chargement
const ChartSkeleton = () => (
  <div className="h-48 flex items-center justify-center text-muted-foreground" aria-hidden="true">
    <Loader2 className="w-5 h-5 animate-spin" />
  </div>
)

const TauxSkeleton = () => (
  <div className="h-32 flex items-center justify-center text-muted-foreground" aria-hidden="true">
    <Loader2 className="w-5 h-5 animate-spin" />
  </div>
)

export const RecouvrementChartLazy = dynamic(
  () => import('./DashboardCharts').then(m => ({ default: m.RecouvrementChart })),
  { ssr: false, loading: ChartSkeleton }
)

export const StatutChartLazy = dynamic(
  () => import('./DashboardCharts').then(m => ({ default: m.StatutChart })),
  { ssr: false, loading: ChartSkeleton }
)

export const EvolutionChartLazy = dynamic(
  () => import('./DashboardCharts').then(m => ({ default: m.EvolutionChart })),
  { ssr: false, loading: ChartSkeleton }
)

export const TauxGlobalCardLazy = dynamic(
  () => import('./DashboardCharts').then(m => ({ default: m.TauxGlobalCard })),
  { ssr: false, loading: TauxSkeleton }
)
