// ═══════════════════════════════════════════════════════════════
// COPLIO — Email types stricts
// ═══════════════════════════════════════════════════════════════

/** Payload d'envoi d'un email */
export interface EmailPayload {
  to: string | string[]
  subject: string
  /** HTML rendu (via React Email ou template brut) */
  html: string
  /** Texte fallback pour les clients mail anciens */
  text?: string
  /** Expéditeur personnalisé (override du FROM par défaut) */
  from?: string
  /** Adresse de réponse */
  replyTo?: string
  /**
   * Clé d'idempotence — empêche le double-envoi.
   * Si deux appels partagent la même idempotencyKey, le deuxième
   * est ignoré côté service (dans la même instance serverless).
   * Exemple : `invoice-${invoiceId}-payment-failed`
   */
  idempotencyKey?: string
  /** Tags Resend pour filtrer dans le dashboard */
  tags?: Array<{ name: string; value: string }>
  /** Headers custom (ex: List-Unsubscribe) */
  headers?: Record<string, string>
}

/** Résultat d'un envoi */
export interface SendResult {
  success: boolean
  /** ID Resend de l'email envoyé */
  emailId?: string
  /** Nombre de tentatives effectuées */
  attempts: number
  /** Durée totale en ms */
  durationMs: number
  error?: {
    message: string
    code?: string | number
    /** true si l'erreur est temporaire (réseau, rate limit) → retry possible */
    retryable: boolean
  }
}

/** Log structuré d'un envoi email */
export interface EmailLog {
  timestamp: string
  emailId?: string
  to: string | string[]
  subject: string
  success: boolean
  attempts: number
  durationMs: number
  error?: string
  tags?: Array<{ name: string; value: string }>
  idempotencyKey?: string
}

/** Événement reçu depuis le webhook Resend */
export interface ResendWebhookEvent {
  type:
    | 'email.sent'
    | 'email.delivered'
    | 'email.delivery_delayed'
    | 'email.complained'
    | 'email.bounced'
    | 'email.opened'
    | 'email.clicked'
  created_at: string
  data: {
    email_id: string
    from: string
    to: string[]
    subject: string
    created_at: string
    // Champs spécifiques selon le type
    bounced_at?: string
    bounce_type?: 'hard' | 'soft'
    complained_at?: string
    opened_at?: string
    clicked_at?: string
    link?: string
  }
}

// ─── Types des templates ────────────────────────────────────

export interface WelcomeSyndicProps {
  prenom: string
  nomCabinet: string
  appUrl?: string
  /** Lien de confirmation d'email (si fourni, le CTA principal pointe vers ce lien). */
  confirmUrl?: string
}

export interface ResetPasswordProps {
  prenom: string
  resetUrl: string
  expiresInMinutes?: number
}

export interface MagicLinkProps {
  prenom: string
  nom: string
  cabinetNom: string
  nomCopropriete: string
  magicLink: string
}

export interface SuspiciousLoginProps {
  prenom: string
  ipAddress?: string
  location?: string
  device?: string
  loginAt: string
  supportUrl?: string
}

export interface InvitationProps {
  prenom: string
  nom: string
  cabinetNom: string
  nomCopropriete: string
  magicLink: string
}

export interface AppelChargesProps {
  prenom: string
  nom: string
  libelle: string
  montant: string
  dateEcheance: string
  nomCopropriete: string
  numeroLot: string
  portailUrl: string
}

export interface RelanceImpayesProps {
  prenom: string
  nom: string
  montant: string
  dateEcheance: string
  cabinetNom: string
  nomCopropriete: string
  numeroLot: string
  niveau: 1 | 2 | 3
  portailUrl?: string
}

export interface ConvocationAGProps {
  prenom: string
  nom: string
  cabinetNom: string
  nomCopropriete: string
  dateAg: string
  heure: string
  lieu: string
  listeResolutions: string[]
  lienVote?: string
}

export interface CheckoutConfirmProps {
  prenom: string
  nomCabinet: string
  plan: string
  montant: string
  periodeDebut: string
  periodeFin: string
  factureUrl?: string
}

export interface PaymentFailedProps {
  prenom: string
  nomCabinet: string
  montant: string
  dateEchec: string
  updatePaymentUrl: string
}

export interface TrialEndingProps {
  prenom: string
  nomCabinet: string
  joursRestants: number
  upgradeUrl: string
}

export interface PlanChangeProps {
  prenom: string
  nomCabinet: string
  ancienPlan: string
  nouveauPlan: string
  montant: string
  effectifLe: string
}

export interface CriticalAlertProps {
  titre: string
  message: string
  severity: 'info' | 'warning' | 'critical'
  details?: Record<string, string>
  actionUrl?: string
  actionLabel?: string
}
