import { Text, Section, Hr } from '@react-email/components'
import * as React from 'react'
import { EmailBase, EmailBody } from '@/emails/layouts/EmailBase'
import { EmailButton } from '@/emails/components/EmailButton'
import { EMAIL_CONFIG } from '@/lib/email/config'
import type { ResetPasswordProps } from '@/lib/email/types'

const { brand } = EMAIL_CONFIG

export function ResetPassword({ prenom, resetUrl, expiresInMinutes = 60 }: ResetPasswordProps) {
  return (
    <EmailBase preview={`${prenom}, voici votre lien pour réinitialiser votre mot de passe.`}>
      <EmailBody>
        <Text style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: brand.textColor }}>
          Réinitialisation du mot de passe 🔐
        </Text>
        <Text style={{ margin: '0 0 24px', fontSize: '15px', color: '#666', lineHeight: '1.7' }}>
          Bonjour {prenom},{'\n\n'}
          Vous avez demandé à réinitialiser votre mot de passe Coplio.
          Cliquez sur le bouton ci-dessous pour en choisir un nouveau.
        </Text>

        <Section style={{ textAlign: 'center' as const, marginBottom: '28px' }}>
          <EmailButton href={resetUrl}>
            Réinitialiser mon mot de passe
          </EmailButton>
        </Section>

        <Hr style={{ borderColor: brand.borderColor, margin: '0 0 20px' }} />

        {/* Infos sécurité */}
        <Text style={{ margin: '0 0 8px', fontSize: '13px', color: brand.mutedColor, lineHeight: '1.6' }}>
          ⏱ Ce lien expire dans <strong>{expiresInMinutes} minutes</strong>.
        </Text>
        <Text style={{ margin: '0 0 8px', fontSize: '13px', color: brand.mutedColor, lineHeight: '1.6' }}>
          🔒 Si vous n&apos;avez pas demandé cette réinitialisation, ignorez cet email.
          Votre mot de passe restera inchangé.
        </Text>
        <Text style={{ margin: 0, fontSize: '13px', color: brand.mutedColor, lineHeight: '1.6' }}>
          ⚠️ Ne partagez jamais ce lien avec quelqu&apos;un d&apos;autre.
        </Text>
      </EmailBody>
    </EmailBase>
  )
}

export default ResetPassword
