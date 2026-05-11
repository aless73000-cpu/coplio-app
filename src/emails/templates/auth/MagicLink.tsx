import { Text, Section, Hr } from '@react-email/components'
import * as React from 'react'
import { EmailBase, EmailBody } from '@/emails/layouts/EmailBase'
import { EmailButton } from '@/emails/components/EmailButton'
import { EmailInfoCard } from '@/emails/components/EmailInfoCard'
import { EMAIL_CONFIG } from '@/lib/email/config'
import type { MagicLinkProps } from '@/lib/email/types'

const { brand } = EMAIL_CONFIG

export function MagicLink({
  prenom,
  nom,
  cabinetNom,
  nomCopropriete,
  magicLink,
}: MagicLinkProps) {
  return (
    <EmailBase preview={`${prenom}, accédez à votre portail copropriétaire.`}>
      <EmailBody>
        <Text style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: brand.textColor }}>
          🏠 Accès à votre portail
        </Text>
        <Text style={{ margin: '0 0 24px', fontSize: '15px', color: '#666', lineHeight: '1.7' }}>
          Bonjour <strong>{prenom} {nom}</strong>,{'\n\n'}
          Le cabinet <strong>{cabinetNom}</strong> vous invite à accéder à votre espace
          copropriétaire pour la résidence <strong>{nomCopropriete}</strong>.
        </Text>

        <EmailInfoCard
          variant="success"
          items={[
            { label: 'Résidence', value: nomCopropriete },
            { label: 'Syndic', value: cabinetNom },
          ]}
        />

        <Text style={{ margin: '0 0 8px', fontSize: '14px', color: brand.textColor, lineHeight: '1.6' }}>
          Depuis votre portail, vous pouvez :
        </Text>
        <Text style={{ margin: '0 0 24px', fontSize: '14px', color: '#666', lineHeight: '1.8' }}>
          ✅ Consulter et payer vos charges{'\n'}
          📄 Accéder à tous vos documents{'\n'}
          🔨 Suivre les travaux en cours{'\n'}
          🗳️ Voter lors des assemblées générales
        </Text>

        <Section style={{ textAlign: 'center' as const, marginBottom: '28px' }}>
          <EmailButton href={magicLink}>
            Accéder à mon portail →
          </EmailButton>
        </Section>

        <Hr style={{ borderColor: brand.borderColor, margin: '0 0 16px' }} />
        <Text style={{ margin: 0, fontSize: '12px', color: brand.mutedColor, textAlign: 'center' as const }}>
          Ce lien expire dans 24 heures · Ne le partagez pas
        </Text>
      </EmailBody>
    </EmailBase>
  )
}

export default MagicLink
