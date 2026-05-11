// ═══════════════════════════════════════════════════════════════
// COPLIO — Types TypeScript centraux
// ═══════════════════════════════════════════════════════════════

export type UserRole = 'owner' | 'manager' | 'owner_resident'
export type SubscriptionPlan = 'trial' | 'starter' | 'pro' | 'expert'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'

export type LotType = 'appartement' | 'maison' | 'local_commercial' | 'parking' | 'cave' | 'autre'
export type SinistreStatus = 'signale' | 'assurance_declaree' | 'urgence' | 'expertise' | 'travaux' | 'cloture'
export type DocumentCategory = 'pv_ag' | 'budget' | 'contrat' | 'sinistre' | 'appel_fonds' | 'reglement' | 'autre'
export type AgStatus = 'planifiee' | 'convocations_envoyees' | 'en_cours' | 'terminee' | 'annulee'
export type AgType = 'ordinaire' | 'extraordinaire'
export type VoteType = 'art_24' | 'art_25' | 'art_26' | 'unanimite'
export type VoteValue = 'pour' | 'contre' | 'abstention'
export type RelanceType = 'email' | 'sms' | 'mise_en_demeure' | 'manuel'
export type DevisStatus = 'en_attente' | 'accepte' | 'refuse'
export type NotificationType = 'info' | 'alerte' | 'urgent'
export type CoproprieteStatut = 'a_jour' | 'attention' | 'urgent'

// ─── CABINET ──────────────────────────────────────────────────

export interface Cabinet {
  id: string
  nom: string
  siret?: string
  adresse?: string
  code_postal?: string
  ville?: string
  telephone?: string
  email_contact?: string
  logo_url?: string
  couleur_primaire: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  plan: SubscriptionPlan
  subscription_status: SubscriptionStatus
  trial_ends_at?: string
  current_period_end?: string
  addon_portail_actif: boolean
  max_gestionnaires: number
  max_lots: number
  created_at: string
  updated_at: string
}

// ─── PROFILE ──────────────────────────────────────────────────

export interface Profile {
  id: string
  cabinet_id?: string
  role: UserRole
  prenom?: string
  nom?: string
  email: string
  telephone?: string
  avatar_url?: string
  lot_id?: string
  langue: string
  notifications_push: boolean
  push_subscription?: object
  onboarding_complete: boolean
  created_at: string
  updated_at: string
}

export interface ProfileWithCabinet extends Profile {
  cabinet?: Cabinet
}

// ─── COPROPRIÉTÉ ──────────────────────────────────────────────

export interface Copropriete {
  id: string
  cabinet_id: string
  gestionnaire_id?: string
  nom: string
  adresse: string
  code_postal?: string
  ville?: string
  pays: string
  annee_construction?: number
  nb_etages?: number
  tantiemes_totaux: number
  surface_totale?: number
  assureur?: string
  numero_contrat_assurance?: string
  expiration_assurance?: string
  iban?: string
  banque?: string
  statut: CoproprieteStatut
  nb_lots: number
  nb_coproprietaires: number
  nb_sinistres_ouverts: number
  montant_impayes: number
  created_at: string
  updated_at: string
}

export interface CoproprieteWithDetails extends Copropriete {
  gestionnaire?: Profile
  lots?: Lot[]
}

// ─── LOT ──────────────────────────────────────────────────────

export interface Lot {
  id: string
  copropriete_id: string
  numero: string
  etage?: string
  type: LotType
  surface?: number
  nb_pieces?: number
  tantiemes: number
  solde_compte: number
  montant_impaye: number
  derniere_regularisation?: string
  occupe: boolean
  created_at: string
  updated_at: string
}

export interface LotWithCoproprietaire extends Lot {
  coproprietaire?: Coproprietaire
}

// ─── COPROPRIÉTAIRE ───────────────────────────────────────────

export interface Coproprietaire {
  id: string
  cabinet_id: string
  profile_id?: string
  prenom: string
  nom: string
  email?: string
  telephone?: string
  adresse_correspondance?: string
  portail_actif: boolean
  invitation_envoyee_at?: string
  created_at: string
  updated_at: string
}

export interface CoproprietaireWithLots extends Coproprietaire {
  lots?: Lot[]
}

// ─── APPEL DE CHARGES ─────────────────────────────────────────

export interface AppelCharges {
  id: string
  copropriete_id: string
  lot_id: string
  coproprietaire_id?: string
  libelle: string
  montant: number
  date_appel: string
  date_echeance: string
  montant_paye: number
  date_paiement?: string
  paye: boolean
  nb_relances: number
  derniere_relance_at?: string
  created_at: string
  updated_at: string
}

// ─── DOCUMENT ─────────────────────────────────────────────────

export interface Document {
  id: string
  cabinet_id: string
  copropriete_id?: string
  lot_id?: string
  sinistre_id?: string
  ag_id?: string
  nom: string
  description?: string
  categorie: DocumentCategory
  taille_bytes?: number
  type_mime?: string
  storage_path: string
  storage_bucket: string
  visible_coproprietaires: boolean
  upload_par?: string
  created_at: string
  updated_at: string
}

// ─── SINISTRE ─────────────────────────────────────────────────

export interface Sinistre {
  id: string
  copropriete_id: string
  cabinet_id: string
  gestionnaire_id?: string
  reference?: string
  titre: string
  description?: string
  status: SinistreStatus
  lots_concernes?: string[]
  numero_declaration_assurance?: string
  compagnie_assurance?: string
  montant_franchise?: number
  montant_indemnisation?: number
  date_sinistre?: string
  date_declaration?: string
  date_cloture?: string
  montant_travaux_estime?: number
  montant_travaux_reel?: number
  created_at: string
  updated_at: string
}

export interface SinistreWithDetails extends Sinistre {
  etapes?: SinistreEtape[]
  devis?: SinistreDevis[]
  intervenants?: SinistreIntervenant[]
  documents?: Document[]
}

export interface SinistreEtape {
  id: string
  sinistre_id: string
  status: SinistreStatus
  titre?: string
  description?: string
  date_etape: string
  created_par?: string
}

export interface SinistreDevis {
  id: string
  sinistre_id: string
  prestataire: string
  montant: number
  description?: string
  statut: DevisStatus
  document_id?: string
  created_at: string
  updated_at: string
}

export interface SinistreIntervenant {
  id: string
  sinistre_id: string
  nom: string
  role?: string
  telephone?: string
  email?: string
  entreprise?: string
  notes?: string
}

// ─── ASSEMBLÉE GÉNÉRALE ───────────────────────────────────────

export interface AssembleeGenerale {
  id: string
  copropriete_id: string
  cabinet_id: string
  gestionnaire_id?: string
  titre: string
  type: AgType
  status: AgStatus
  date_ag: string
  lieu?: string
  lien_visio?: string
  est_visio: boolean
  tantiemes_presents: number
  tantiemes_requis?: number
  date_limite_vote?: string
  convocations_envoyees_at?: string
  pv_document_id?: string
  created_at: string
  updated_at: string
}

export interface AgResolution {
  id: string
  ag_id: string
  ordre: number
  titre: string
  description?: string
  type_vote: VoteType
  voix_pour: number
  voix_contre: number
  voix_abstention: number
  tantiemes_pour: number
  tantiemes_contre: number
  adoptee?: boolean
  created_at: string
}

export interface AgVote {
  id: string
  resolution_id: string
  coproprietaire_id: string
  lot_id: string
  valeur: VoteValue
  tantiemes: number
  vote_a: string
}

// ─── RELANCE ──────────────────────────────────────────────────

export interface Relance {
  id: string
  cabinet_id: string
  copropriete_id: string
  appel_charge_id?: string
  coproprietaire_id?: string
  type: RelanceType
  statut: string
  sujet?: string
  contenu?: string
  envoye_at: string
  envoye_par?: string
}

// ─── NOTIFICATION ─────────────────────────────────────────────

export interface Notification {
  id: string
  user_id: string
  cabinet_id?: string
  type: NotificationType
  titre: string
  message?: string
  lien?: string
  copropriete_id?: string
  sinistre_id?: string
  ag_id?: string
  lu: boolean
  lu_at?: string
  created_at: string
}

// ─── CONVERSATION & MESSAGE ───────────────────────────────────

export interface Conversation {
  id: string
  cabinet_id: string
  copropriete_id?: string
  coproprietaire_id?: string
  gestionnaire_id?: string
  sujet?: string
  derniere_activite: string
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  expediteur_id: string
  contenu: string
  lu: boolean
  lu_at?: string
  created_at: string
}

// ─── BUDGET PRÉVISIONNEL ──────────────────────────────────────

export type BudgetStatut = 'brouillon' | 'valide' | 'approuve'
export type BudgetCategorie = 'charges_generales' | 'entretien' | 'travaux' | 'assurances' | 'honoraires' | 'reserves' | 'autre'

export interface Budget {
  id: string
  copropriete_id: string
  annee: number
  statut: BudgetStatut
  created_by?: string
  created_at: string
  updated_at: string
  lignes?: BudgetLigne[]
}

export interface BudgetLigne {
  id: string
  budget_id: string
  poste: string
  categorie: BudgetCategorie
  montant_previsionnel: number
  montant_reel?: number
  commentaire?: string
  ordre: number
  created_at: string
}

export const BUDGET_CATEGORIE_LABELS: Record<BudgetCategorie, string> = {
  charges_generales: 'Charges générales',
  entretien: 'Entretien & maintenance',
  travaux: 'Travaux',
  assurances: 'Assurances',
  honoraires: 'Honoraires syndic',
  reserves: 'Fonds de réserve',
  autre: 'Autre',
}

// ─── UTILS ────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiError {
  message: string
  code?: string
  details?: unknown
}

// Dashboard KPIs
export interface DashboardKPIs {
  nb_coproprietes: number
  nb_lots: number
  nb_sinistres_ouverts: number
  montant_total_impayes: number
  nb_ag_a_preparer: number
  nb_convocations_a_envoyer: number
  taux_recouvrement: number
}

// Plans Stripe
export const PLANS_CONFIG = {
  starter: {
    name: 'Starter',
    price: 99,
    max_gestionnaires: 1,
    max_lots: 50,
    features: [
      '1 gestionnaire',
      'Jusqu\'à 50 lots',
      'Portail copropriétaire inclus',
      'GED illimitée',
      'Suivi sinistres',
    ]
  },
  pro: {
    name: 'Pro',
    price: 189,
    max_gestionnaires: 5,
    max_lots: 200,
    popular: true,
    features: [
      '2 à 5 gestionnaires',
      'Jusqu\'à 200 lots',
      'Portail copropriétaire inclus',
      'Vote en ligne AG',
      'Relances automatiques',
      'Rapports avancés',
    ]
  },
  expert: {
    name: 'Cabinet',
    price: 279,
    max_gestionnaires: 999,
    max_lots: 999,
    features: [
      'Gestionnaires illimités',
      'Lots illimités',
      'Toutes les fonctionnalités Pro',
      'API accès',
      'Support prioritaire',
      'Portail brandé inclus',
    ]
  }
} as const

// Labels français
export const SINISTRE_STATUS_LABELS: Record<SinistreStatus, string> = {
  signale: 'Signalé',
  assurance_declaree: 'Assurance déclarée',
  urgence: 'Urgence',
  expertise: 'Expertise',
  travaux: 'Travaux',
  cloture: 'Clôturé',
}

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  pv_ag: 'PV d\'AG',
  budget: 'Budget',
  contrat: 'Contrat',
  sinistre: 'Sinistre',
  appel_fonds: 'Appel de fonds',
  reglement: 'Règlement',
  autre: 'Autre',
}

export const LOT_TYPE_LABELS: Record<LotType, string> = {
  appartement: 'Appartement',
  maison: 'Maison',
  local_commercial: 'Local commercial',
  parking: 'Parking',
  cave: 'Cave',
  autre: 'Autre',
}

export const VOTE_TYPE_LABELS: Record<VoteType, string> = {
  art_24: 'Art. 24 (majorité simple)',
  art_25: 'Art. 25 (majorité absolue)',
  art_26: 'Art. 26 (double majorité)',
  unanimite: 'Unanimité',
}
