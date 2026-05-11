/**
 * @deprecated — Ce fichier est conservé pour la rétrocompatibilité.
 * Utiliser désormais `@/lib/email` à la place.
 *
 * Migration :
 *   import { sendEmail, emailXxx } from '@/lib/resend'
 *   →
 *   import { Email } from '@/lib/email'
 *   await Email.xxx(props, to)
 */

// Re-export depuis le nouveau module
export { sendEmail } from '@/lib/email/service'
export { EMAIL_CONFIG as emailConfig } from '@/lib/email/config'

// ─── Fonctions de rendu legacy ────────────────────────────────
// Conservées pour ne pas casser les appels existants.
// À supprimer progressivement en migrant chaque call site.

import { render } from '@react-email/render'
import * as React from 'react'
import { WelcomeSyndic }      from '@/emails/templates/auth/WelcomeSyndic'
import { MagicLink }          from '@/emails/templates/auth/MagicLink'
import { NouvelAppelCharges } from '@/emails/templates/copropriete/NouvelAppelCharges'
import { RelanceImpayes }     from '@/emails/templates/copropriete/RelanceImpayes'
import { ConvocationAG }      from '@/emails/templates/copropriete/ConvocationAG'
import { Invitation }         from '@/emails/templates/copropriete/Invitation'

export async function emailBienvenueSyndic(props: { prenom: string; nomCabinet: string; appUrl: string }) {
  return render(React.createElement(WelcomeSyndic, props))
}

export async function emailInvitationCopropriétaire(props: {
  prenom: string; nom: string; cabinetNom: string; nomCopropriete: string; magicLink: string
}) {
  return render(React.createElement(Invitation, props))
}

export async function emailNouvelAppelCharges(props: {
  prenom: string; nom: string; libelle: string; montant: string
  dateEcheance: string; nomCopropriete: string; numeroLot: string; portailUrl: string
}) {
  return render(React.createElement(NouvelAppelCharges, props))
}

export async function emailRelanceImpayes(props: {
  prenom: string; nom: string; montant: string; dateEcheance: string
  cabinetNom: string; nomCopropriete: string; numeroLot: string
  niveau: 1 | 2 | 3; portailUrl?: string
}) {
  return render(React.createElement(RelanceImpayes, props))
}

export async function emailConvocationAG(props: {
  prenom: string; nom: string; cabinetNom: string; nomCopropriete: string
  dateAg: string; heure: string; lieu: string; listeResolutions: string[]; lienVote?: string
}) {
  return render(React.createElement(ConvocationAG, props))
}
