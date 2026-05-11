// ═══════════════════════════════════════════════════════════════
// COPLIO — Email public API
//
// Usage :
//   import { Email } from '@/lib/email'
//   await Email.welcomeSyndic({ prenom: 'Jean', nomCabinet: 'Mon Cabinet' }, 'jean@example.com')
//   await Email.convocationAG({ ... }, ['a@x.fr', 'b@x.fr'])
//
// Chaque méthode :
//  1. Rend le template React Email en HTML
//  2. Délègue à sendEmail (retry + logs)
//  3. Retourne un SendResult typé
// ═══════════════════════════════════════════════════════════════

import { render } from '@react-email/render'
import { sendEmail, sendEmailBatch } from './service'
import { EMAIL_CONFIG } from './config'
import type {
  SendResult,
  WelcomeSyndicProps,
  ResetPasswordProps,
  MagicLinkProps,
  SuspiciousLoginProps,
  InvitationProps,
  AppelChargesProps,
  RelanceImpayesProps,
  ConvocationAGProps,
  CheckoutConfirmProps,
  PaymentFailedProps,
  TrialEndingProps,
  PlanChangeProps,
  CriticalAlertProps,
} from './types'

// Imports des templates
import { WelcomeSyndic }       from '@/emails/templates/auth/WelcomeSyndic'
import { ResetPassword }       from '@/emails/templates/auth/ResetPassword'
import { MagicLink }           from '@/emails/templates/auth/MagicLink'
import { SuspiciousLogin }     from '@/emails/templates/auth/SuspiciousLogin'
import { InvitationGestionnaire } from '@/emails/templates/auth/InvitationGestionnaire'
import type { InvitationGestionnaireProps } from '@/emails/templates/auth/InvitationGestionnaire'
import { Invitation }          from '@/emails/templates/copropriete/Invitation'
import { NouvelAppelCharges }  from '@/emails/templates/copropriete/NouvelAppelCharges'
import { RelanceImpayes }      from '@/emails/templates/copropriete/RelanceImpayes'
import { ConvocationAG }       from '@/emails/templates/copropriete/ConvocationAG'
import { CheckoutConfirm }     from '@/emails/templates/subscription/CheckoutConfirm'
import { PaymentFailed }       from '@/emails/templates/subscription/PaymentFailed'
import { TrialEnding }         from '@/emails/templates/subscription/TrialEnding'
import { PlanChange }          from '@/emails/templates/subscription/PlanChange'
import { CriticalAlert }       from '@/emails/templates/admin/CriticalAlert'

import * as React from 'react'

const { brand } = EMAIL_CONFIG

// ─── Helper interne ───────────────────────────────────────────

async function renderAndSend<P extends object>(
  component: React.FC<P>,
  props: P,
  to: string | string[],
  subject: string,
  options?: {
    from?: string
    replyTo?: string
    idempotencyKey?: string
    tags?: Array<{ name: string; value: string }>
  }
): Promise<SendResult> {
  const html = await render(React.createElement(component, props))
  return sendEmail({ to, subject, html, ...options })
}

// ─── Email namespace ──────────────────────────────────────────

export const Email = {

  // ─── AUTH ─────────────────────────────────────────────────

  /** Email de bienvenue après inscription d'un syndic */
  async welcomeSyndic(props: WelcomeSyndicProps, to: string): Promise<SendResult> {
    return renderAndSend(
      WelcomeSyndic, props, to,
      `🏠 Bienvenue sur Coplio, ${props.prenom} !`,
      {
        replyTo: brand.supportEmail,
        idempotencyKey: `welcome-syndic-${to}`,
        tags: [{ name: 'type', value: 'welcome' }],
      }
    )
  },

  /** Lien de réinitialisation mot de passe */
  async resetPassword(props: ResetPasswordProps, to: string): Promise<SendResult> {
    return renderAndSend(
      ResetPassword, props, to,
      `Réinitialisation de votre mot de passe Coplio`,
      {
        from: EMAIL_CONFIG.from.noreply,
        idempotencyKey: `reset-password-${to}-${Date.now()}`,
        tags: [{ name: 'type', value: 'reset-password' }],
      }
    )
  },

  /** Magic link portail copropriétaire */
  async magicLink(props: MagicLinkProps, to: string): Promise<SendResult> {
    return renderAndSend(
      MagicLink, props, to,
      `Accès à votre portail copropriétaire — ${props.nomCopropriete}`,
      {
        idempotencyKey: `magic-link-${to}-${props.nomCopropriete}`,
        tags: [{ name: 'type', value: 'magic-link' }],
      }
    )
  },

  /** Invitation gestionnaire à rejoindre un cabinet */
  async invitationGestionnaire(props: InvitationGestionnaireProps, to: string): Promise<SendResult> {
    return renderAndSend(
      InvitationGestionnaire, props, to,
      `Invitation à rejoindre ${props.cabinetNom} sur Coplio`,
      {
        idempotencyKey: `invitation-gestionnaire-${to}-${props.cabinetNom}`,
        tags: [{ name: 'type', value: 'invitation-gestionnaire' }],
      }
    )
  },

  /** Alerte connexion suspecte */
  async suspiciousLogin(props: SuspiciousLoginProps, to: string): Promise<SendResult> {
    return renderAndSend(
      SuspiciousLogin, props, to,
      `⚠️ Connexion inhabituelle détectée sur votre compte Coplio`,
      {
        from: EMAIL_CONFIG.from.noreply,
        tags: [{ name: 'type', value: 'security' }],
      }
    )
  },

  // ─── COPROPRIÉTAIRE ────────────────────────────────────────

  /** Invitation portail copropriétaire */
  async invitation(props: InvitationProps, to: string): Promise<SendResult> {
    return renderAndSend(
      Invitation, props, to,
      `Accès à votre portail copropriétaire — ${props.nomCopropriete}`,
      {
        idempotencyKey: `invitation-${to}-${props.nomCopropriete}`,
        tags: [{ name: 'type', value: 'invitation' }],
      }
    )
  },

  /** Notification nouvel appel de charges */
  async appelCharges(props: AppelChargesProps, to: string): Promise<SendResult> {
    return renderAndSend(
      NouvelAppelCharges, props, to,
      `Nouvel appel de charges — ${props.nomCopropriete}`,
      {
        tags: [{ name: 'type', value: 'appel-charges' }],
      }
    )
  },

  /** Email de relance pour impayés */
  async relanceImpayes(props: RelanceImpayesProps, to: string): Promise<SendResult> {
    return renderAndSend(
      RelanceImpayes, props, to,
      props.niveau === 3
        ? `🚨 Mise en demeure — ${props.nomCopropriete}`
        : `⚠️ Rappel de paiement — ${props.nomCopropriete}`,
      {
        idempotencyKey: `relance-${to}-${props.nomCopropriete}-niveau${props.niveau}`,
        tags: [
          { name: 'type', value: 'relance' },
          { name: 'niveau', value: String(props.niveau) },
        ],
      }
    )
  },

  /** Convocations AG (envoi individuel) */
  async convocationAG(props: ConvocationAGProps, to: string): Promise<SendResult> {
    return renderAndSend(
      ConvocationAG, props, to,
      `Convocation à l'Assemblée Générale — ${props.nomCopropriete}`,
      {
        tags: [{ name: 'type', value: 'convocation-ag' }],
      }
    )
  },

  /**
   * Convocations AG en masse (tous les copropriétaires).
   * Utilise sendEmailBatch pour respecter le rate limit.
   */
  async convocationAGBatch(
    recipients: Array<{ props: ConvocationAGProps; to: string }>
  ): Promise<{ sent: number; failed: number }> {
    const payloads = await Promise.all(
      recipients.map(async ({ props, to }) => {
        const html = await render(React.createElement(ConvocationAG, props))
        return {
          to,
          subject: `Convocation à l'Assemblée Générale — ${props.nomCopropriete}`,
          html,
          tags: [{ name: 'type', value: 'convocation-ag' }] as Array<{ name: string; value: string }>,
        }
      })
    )
    const { sent, failed } = await sendEmailBatch(payloads, 150)
    return { sent, failed }
  },

  // ─── ABONNEMENT ────────────────────────────────────────────

  /** Confirmation d'abonnement / paiement */
  async checkoutConfirm(props: CheckoutConfirmProps, to: string): Promise<SendResult> {
    return renderAndSend(
      CheckoutConfirm, props, to,
      `✅ Abonnement Coplio ${props.plan} activé`,
      {
        from: EMAIL_CONFIG.from.billing,
        idempotencyKey: `checkout-confirm-${to}-${props.periodeDebut}`,
        tags: [{ name: 'type', value: 'billing' }],
      }
    )
  },

  /** Échec de paiement */
  async paymentFailed(props: PaymentFailedProps, to: string): Promise<SendResult> {
    return renderAndSend(
      PaymentFailed, props, to,
      `⚠️ Échec du prélèvement Coplio — Action requise`,
      {
        from: EMAIL_CONFIG.from.billing,
        tags: [{ name: 'type', value: 'billing' }],
      }
    )
  },

  /** Fin d'essai imminente */
  async trialEnding(props: TrialEndingProps, to: string): Promise<SendResult> {
    return renderAndSend(
      TrialEnding, props, to,
      `⏰ Votre essai Coplio expire dans ${props.joursRestants} jour${props.joursRestants > 1 ? 's' : ''}`,
      {
        idempotencyKey: `trial-ending-${to}-j${props.joursRestants}`,
        tags: [{ name: 'type', value: 'trial' }],
      }
    )
  },

  /** Changement de plan */
  async planChange(props: PlanChangeProps, to: string): Promise<SendResult> {
    return renderAndSend(
      PlanChange, props, to,
      `Votre plan Coplio a changé : ${props.ancienPlan} → ${props.nouveauPlan}`,
      {
        from: EMAIL_CONFIG.from.billing,
        idempotencyKey: `plan-change-${to}-${props.effectifLe}`,
        tags: [{ name: 'type', value: 'billing' }],
      }
    )
  },

  // ─── ADMIN ─────────────────────────────────────────────────

  /** Alerte critique pour l'équipe Coplio */
  async criticalAlert(
    props: CriticalAlertProps,
    to: string = 'team@coplio.fr'
  ): Promise<SendResult> {
    return renderAndSend(
      CriticalAlert, props, to,
      `[Coplio Admin] ${props.severity.toUpperCase()} — ${props.titre}`,
      {
        from: EMAIL_CONFIG.from.noreply,
        tags: [{ name: 'type', value: 'admin-alert' }, { name: 'severity', value: props.severity }],
      }
    )
  },
}

// ─── Exports backward-compat (pour les fichiers existants) ────
// Évite de casser les imports existants pendant la migration.

export { sendEmail, sendEmailBatch } from './service'
export type { SendResult, EmailPayload } from './types'
