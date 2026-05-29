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
  Wrench,
  Vote,
  Settings2,
  Archive,
  PenLine,
  HardHat,
  UserCog,
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
    id: 'prestataires',
    label: 'Prestataires',
    href: '/prestataires',
    icon: Wrench,
    description: 'Artisans, entreprises et intervenants de vos copropriétés',
  },
  {
    id: 'ia',
    label: 'Assistant IA',
    href: '/ia',
    icon: Sparkles,
    description: 'Rédaction assistée par intelligence artificielle',
  },
  {
    id: 'votes',
    label: 'Votes en ligne',
    href: '/votes',
    icon: Vote,
    description: 'Scrutins en ligne pour les copropriétaires',
  },
  {
    id: 'relances-config',
    label: 'Config. relances',
    href: '/relances-config',
    icon: Settings2,
    description: 'Paramétrer les relances automatiques',
  },
  {
    id: 'archives',
    label: 'Archives',
    href: '/archives',
    icon: Archive,
    description: 'Accéder aux données archivées',
  },
  {
    id: 'signatures',
    label: 'Signatures',
    href: '/signatures',
    icon: PenLine,
    description: 'Signatures électroniques de documents',
  },
  {
    id: 'carnet-entretien',
    label: 'Carnet d\'entretien',
    href: '/carnet-entretien',
    icon: HardHat,
    description: 'Suivi de l\'entretien et des travaux',
  },
  {
    id: 'equipe',
    label: 'Équipe',
    href: '/equipe',
    icon: UserCog,
    description: 'Membres et collaborateurs du cabinet',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    href: '/notifications',
    icon: Bell,
    description: 'Centre de notifications et alertes',
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
  'assemblees',
  'impayes',
  'comptabilite',
]
