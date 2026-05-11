import { Text, Section, Hr } from '@react-email/components'
import * as React from 'react'
import { EmailBase, EmailBody } from '@/emails/layouts/EmailBase'
import { EmailButton } from '@/emails/components/EmailButton'
import { EmailInfoCard } from '@/emails/components/EmailInfoCard'
import { EMAIL_CONFIG } from '@/lib/email/config'

const { brand } = EMAIL_CONFIG

export interface InvitationGestionnaireProps {
  prenom: string
  cabinetNom: string
  invitationLink: string
}

export function InvitationGestionnaire({ prenom, cabinetNom, invitationLink }: InvitationGestionnaireProps) {
  return (
    <EmailBase
      preview={`${cabinetNom} vous invite à rejoindre leur espace de gestion de copropriété.`}
      recipientEmail={undefined}
    >
      <EmailBody>
        <Text style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: brand.textColor }}>
          👥 Invitation à rejoindre le cabinet
        </Text>
        <Text style={{ margin: '0 0 20px', fontSize: '15px', color: '#666', lineHeight: '1.7' }}>
          Bonjour <strong>{prenom}</strong>,{'\n\n'}
          Le cabinet <strong>{cabinetNom}</strong> vous invite à rejoindre leur espace Coplio
          en tant que <strong>gestionnaire</strong>.
        </Text>

        <EmailInfoCard
          variant="neutral"
          items={[
            { label: 'Cabinet', value: cabinetNom },
            { label: 'Rôle', value: 'Gestionnaire' },
          ]}
        />

        <Text style={{ margin: '0 0 8px', fontSize: '14px', color: brand.textColor, fontWeight: 600 }}>
          En tant que gestionnaire vous pourrez :
        </Text>
        <Text style={{ margin: '0 0 28px', fontSize: '14px', color: '#666', lineHeight: '2' }}>
          🏢 Gérer les copropriétés du cabinet{'\n'}
          💶 Émettre et suivre les appels de charges{'\n'}
          📄 Gérer les documents et sinistres{'\n'}
          🗳️ Organiser les assemblées générales{'\n'}
          💬 Communiquer avec les copropriétaires
        </Text>

        <Section style={{ textAlign: 'center' as const, marginBottom: '28px' }}>
          <EmailButton href={invitationLink}>
            Accepter l&apos;invitation →
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

export default InvitationGestionnaire
