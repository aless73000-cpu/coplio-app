import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  AlertTriangle,
  CalendarDays,
  Receipt,
  MessageSquare,
  Sparkles,
  Calendar,
  Bell,
  BookOpen,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  id: string
  label: string
  href: string
  icon: LucideIcon
  description: string
  /** Items marqués alwaysPinned apparaissent toujours dans la nav principale */
  alwaysPinned?: boolean
}

export const ALL_NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Vue d\'ensemble de votre activité',
    alwaysPinned: true,
  },
  {
    id: 'coproprietes',
    label: 'Copropriétés',
    href: '/coproprietes',
    icon: Building2,
    description: 'Gérer vos immeubles et leurs lots',
    alwaysPinned: true,
  },
  {
    id: 'coproprietaires',
    label: 'Copropriétaires',
    href: '/coproprietaires',
    icon: Users,
    description: 'Fiches copropriétaires et portail en ligne',
    alwaysPinned: true,
  },
  {
    id: 'appels-charges',
    label: 'Appels de charges',
    href: '/appels-charges',
    icon: Receipt,
    description: 'Émettre et suivre les appels de fonds',
  },
  {
    id: 'messages',
    label: 'Messages',
    href: '/messages',
    icon: MessageSquare,
    description: 'Messagerie avec les copropriétaires',
    alwaysPinned: true,
  },
  {
    id: 'sinistres',
    label: 'Sinistres',
    href: '/sinistres',
    icon: AlertTriangle,
    description: 'Déclarer et suivre les sinistres',
  },
  {
    id: 'documents',
    label: 'Documents',
    href: '/documents',
    icon: FileText,
    description: 'Bibliothèque de documents partagés',
  },
  {
    id: 'assemblees',
    label: 'Assemblées',
    href: '/assemblees',
    icon: CalendarDays,
    description: 'Préparer et conduire vos AG',
  },
  {
    id: 'impayes',
    label: 'Impayés',
    href: '/impayes',
    icon: Bell,
    description: 'Suivi des créances et relances automatiques',
  },
  {
    id: 'agenda',
    label: 'Agenda',
    href: '/agenda',
    icon: Calendar,
    description: 'Planning de vos interventions et réunions',
  },
  {
    id: 'comptabilite',
    label: 'Comptabilité',
    href: '/comptabilite',
    icon: BookOpen,
    description: 'Écritures, factures, grand livre et rapports comptables',
  },
  {
    id: 'ia',
    label: 'Assistant IA',
    href: '/ia',
    icon: Sparkles,
    description: 'Rédaction assistée par intelligence artificielle',
  },
]

/** IDs épinglés par défaut dans la nav principale */
export const DEFAULT_PINNED_IDS: string[] = [
  'dashboard',
  'coproprietes',
  'coproprietaires',
  'appels-charges',
  'messages',
  'sinistres',
  'documents',
]
