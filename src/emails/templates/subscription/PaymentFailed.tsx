import { Text, Section } from '@react-email/components'
import * as React from 'react'
import { EmailBase, EmailBody } from '@/emails/layouts/EmailBase'
import { EmailButton } from '@/emails/components/EmailButton'
import { EmailInfoCard } from '@/emails/components/EmailInfoCard'
import { EMAIL_CONFIG } from '@/lib/email/config'
import type { PaymentFailedProps } from '@/lib/email/types'

const { brand } = EMAIL_CONFIG

export function PaymentFailed({
  prenom,
  nomCabinet,
  montant,
  dateEchec,
  updatePaymentUrl,
}: PaymentFailedProps) {
  return (
    <EmailBase preview={`⚠️ Échec du paiement de ${montant} pour ${nomCabinet}`}>
      <EmailBody>
        <Text style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: '#A32D2D' }}>
          ⚠️ Échec du prélèvement
        </Text>
        <Text style={{ margin: '0 0 24px', fontSize: '15px', color: '#666', lineHeight: '1.7' }}>
          Bonjour {prenom},{'\n\n'}
          Nous n&apos;avons pas pu prélever votre abonnement Coplio pour le cabinet{' '}
          <strong>{nomCabinet}</strong>. Votre accès sera suspendu si le paiement n&apos;est pas
          régularisé dans les <strong>7 jours</strong>.
        </Text>

        <EmailInfoCard
          variant="danger"
          highlight={montant}
          highlightLabel="Montant non prélevé"
          items={[
            { label: 'Date d&apos;échec', value: dateEchec },
            { label: 'Cabinet', value: nomCabinet },
          ]}
        />

        <Text style={{ margin: '0 0 8px', fontSize: '14px', color: brand.textColor, lineHeight: '1.6' }}>
          Causes possibles :
        </Text>
        <Text style={{ margin: '0 0 24px', fontSize: '13px', color: '#666', lineHeight: '1.8' }}>
          • Carte expirée ou fonds insuffisants{'\n'}
          • Carte bancaire bloquée par votre banque{'\n'}
          • Informations de paiement incorrectes
        </Text>

        <Section style={{ textAlign: 'center' as const, marginBottom: '20px' }}>
          <EmailButton href={updatePaymentUrl} variant="danger">
            Mettre à jour mon moyen de paiement →
          </EmailButton>
        </Section>

        <Text style={{ margin: 0, fontSize: '13px', color: brand.mutedColor, textAlign: 'center' as const }}>
          Besoin d&apos;aide ? Contactez-nous à{' '}
          <span style={{ color: brand.primaryColor }}>{brand.supportEmail}</span>
        </Text>
      </EmailBody>
    </EmailBase>
  )
}

export default PaymentFailed
