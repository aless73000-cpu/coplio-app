import { Text, Section, Hr } from '@react-email/components'
import * as React from 'react'
import { EmailBase, EmailBody } from '@/emails/layouts/EmailBase'
import { EmailButton } from '@/emails/components/EmailButton'
import { EmailInfoCard } from '@/emails/components/EmailInfoCard'
import { EMAIL_CONFIG } from '@/lib/email/config'
import type { SuspiciousLoginProps } from '@/lib/email/types'

const { brand } = EMAIL_CONFIG

export function SuspiciousLogin({
  prenom,
  ipAddress,
  location,
  device,
  loginAt,
  supportUrl = `mailto:${brand.supportEmail}`,
}: SuspiciousLoginProps) {
  const items = [
    { label: 'Date', value: loginAt },
    ...(device   ? [{ label: 'Appareil', value: device }]   : []),
    ...(location ? [{ label: 'Localisation', value: location }] : []),
    ...(ipAddress ? [{ label: 'Adresse IP', value: ipAddress }] : []),
  ]

  return (
    <EmailBase preview={`⚠️ Connexion inhabituelle détectée sur votre compte Coplio.`}>
      <EmailBody>
        <Text style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: '#A32D2D' }}>
          ⚠️ Connexion inhabituelle détectée
        </Text>
        <Text style={{ margin: '0 0 24px', fontSize: '15px', color: '#666', lineHeight: '1.7' }}>
          Bonjour {prenom},{'\n\n'}
          Nous avons détecté une connexion à votre compte Coplio depuis un appareil ou
          une localisation inhabituels.
        </Text>

        <EmailInfoCard variant="danger" items={items} />

        <Text style={{ margin: '0 0 16px', fontSize: '15px', color: brand.textColor, fontWeight: 600 }}>
          C&apos;était vous ?
        </Text>
        <Text style={{ margin: '0 0 24px', fontSize: '14px', color: '#666', lineHeight: '1.7' }}>
          ✅ <strong>Si c&apos;était vous</strong> — ignorez cet email, tout est normal.{'\n'}
          🚨 <strong>Si ce n&apos;était pas vous</strong> — sécurisez immédiatement votre compte
          en changeant votre mot de passe.
        </Text>

        <Section style={{ textAlign: 'center' as const, marginBottom: '16px' }}>
          <EmailButton href={supportUrl} variant="danger">
            Sécuriser mon compte
          </EmailButton>
        </Section>

        <Hr style={{ borderColor: brand.borderColor, margin: '16px 0' }} />
        <Text style={{ margin: 0, fontSize: '12px', color: brand.mutedColor, textAlign: 'center' as const }}>
          Si vous avez besoin d&apos;aide, contactez-nous à{' '}
          <span style={{ color: brand.primaryColor }}>{brand.supportEmail}</span>
        </Text>
      </EmailBody>
    </EmailBase>
  )
}

export default SuspiciousLogin
