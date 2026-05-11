import { Text, Section, Hr } from '@react-email/components'
import * as React from 'react'
import { EmailBase, EmailBody } from '@/emails/layouts/EmailBase'
import { EmailButton } from '@/emails/components/EmailButton'
import { EmailInfoCard } from '@/emails/components/EmailInfoCard'
import { EMAIL_CONFIG } from '@/lib/email/config'
import type { InvitationProps } from '@/lib/email/types'

const { brand } = EMAIL_CONFIG

export function Invitation({
  prenom,
  nom,
  cabinetNom,
  nomCopropriete,
  magicLink,
}: InvitationProps) {
  return (
    <EmailBase
      preview={`${cabinetNom} vous invite à accéder à votre portail copropriétaire.`}
      recipientEmail={undefined}
    >
      <EmailBody>
        <Text style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: brand.textColor }}>
          🏠 Accès à votre portail copropriétaire
        </Text>
        <Text style={{ margin: '0 0 20px', fontSize: '15px', color: '#666', lineHeight: '1.7' }}>
          Bonjour <strong>{prenom} {nom}</strong>,{'\n\n'}
          Le cabinet <strong>{cabinetNom}</strong> vous invite à rejoindre votre espace
          copropriétaire en ligne pour la résidence <strong>{nomCopropriete}</strong>.
        </Text>

        <EmailInfoCard
          variant="success"
          items={[
            { label: 'Résidence', value: nomCopropriete },
            { label: 'Géré par', value: cabinetNom },
          ]}
        />

        <Text style={{ margin: '0 0 8px', fontSize: '14px', color: brand.textColor, fontWeight: 600 }}>
          Ce que vous pouvez faire depuis votre portail :
        </Text>
        <Text style={{ margin: '0 0 28px', fontSize: '14px', color: '#666', lineHeight: '2' }}>
          💶 Consulter vos charges et votre solde{'\n'}
          📄 Accéder à tous vos documents{'\n'}
          🔨 Suivre les travaux et sinistres{'\n'}
          🗳️ Voter lors des assemblées générales{'\n'}
          💬 Échanger avec votre syndic
        </Text>

        <Section style={{ textAlign: 'center' as const, marginBottom: '28px' }}>
          <EmailButton href={magicLink}>
            Accéder à mon portail →
          </EmailButton>
        </Section>

        <Hr style={{ borderColor: brand.borderColor, margin: '0 0 16px' }} />
        <Text style={{ margin: 0, fontSize: '12px', color: brand.mutedColor, textAlign: 'center' as const, lineHeight: '1.6' }}>
          Ce lien expire dans 24 heures.{'\n'}
          Si vous n&apos;attendiez pas cet email, ignorez-le.
        </Text>
      </EmailBody>
    </EmailBase>
  )
}

export default Invitation
