import {
  Building2,
  Home,
  AlertTriangle,
  CreditCard,
  TrendingUp,
  CalendarDays,
  BarChart2,
  Users,
  CheckCircle2,
  Zap,
  PieChart,
} from 'lucide-react'
import type { Copropriete } from '@/types'

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
  allCoproprietes?: Copropriete[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sinistres: any[] | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  agProchaines: any[] | null
  hasAppels: boolean
  conformiteData?: {
    agRecentes: { copropriete_id: string; date_ag: string; status: string }[]
    fondsTravaux: { copropriete_id: string; annee: number | null }[]
  }
}

// ─── Widget metadata ──────────────────────────────────────────

export const WIDGET_LABELS: Record<string, string> = {
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
  conformite_legale:   'Conformité légale',
}

export const WIDGET_ICONS: Record<string, React.ElementType> = {
  kpi_group: BarChart2,
  kpi_coproprietes: Building2, kpi_lots: Home,
  kpi_sinistres: AlertTriangle, kpi_impayes: CreditCard,
  kpi_coproprietaires: Users, kpi_portail: TrendingUp,
  kpi_ag: CalendarDays, kpi_recouvrement: BarChart2,
  alertes_intelligentes: AlertTriangle, graphiques_finances: TrendingUp,
  graphiques_copros: PieChart, performance: BarChart2,
  alertes_coproprietes: Building2, sinistres: AlertTriangle,
  ag: CalendarDays, actions_rapides: Zap, conformite_legale: CheckCircle2,
}

// KPIs individuels → regroupement automatique en grille dans le rendu normal
export const KPI_IDS = new Set([
  'kpi_coproprietes','kpi_lots','kpi_sinistres','kpi_impayes',
  'kpi_coproprietaires','kpi_portail','kpi_ag','kpi_recouvrement',
])

export const DEFAULT_ORDER = [
  'kpi_coproprietes', 'kpi_lots', 'kpi_sinistres', 'kpi_impayes',
  'kpi_coproprietaires', 'kpi_portail', 'kpi_ag', 'kpi_recouvrement',
  'alertes_intelligentes', 'graphiques_finances',
  'graphiques_copros', 'performance', 'alertes_coproprietes',
  'sinistres', 'ag', 'conformite_legale', 'actions_rapides',
]
