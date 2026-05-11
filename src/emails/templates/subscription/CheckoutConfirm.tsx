import { Text, Section, Link } from '@react-email/components'
import * as React from 'react'
import { EmailBase, EmailBody } from '@/emails/layouts/EmailBase'
import { EmailButton } from '@/emails/components/EmailButton'
import { EmailInfoCard } from '@/emails/components/EmailInfoCard'
import { EMAIL_CONFIG } from '@/lib/email/config'
import type { CheckoutConfirmProps } from '@/lib/email/types'

const { brand } = EMAIL_CONFIG

export function CheckoutConfirm({
  prenom,
  nomCabinet,
  plan,
  montant,
  periodeDebut,
  periodeFin,
  factureUrl,
}: CheckoutConfirmProps) {
  return (
    <EmailBase preview={`✅ Abonnement ${plan} activé pour ${nomCabinet}`}>
      <EmailBody>
        <Text style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 800, color: brand.primaryColor }}>
          ✅ Abonnement activé !
        </Text>
        <Text style={{ margin: '0 0 24px', fontSize: '15px', color: '#666', lineHeight: '1.7' }}>
          Bonjour {prenom},{'\n\n'}
          Votre abonnement <strong>Coplio {plan}</strong> est maintenant actif pour le cabinet{' '}
          <strong>{nomCabinet}</strong>. Merci pour votre confiance !
        </Text>

        <EmailInfoCard
          variant="success"
          items={[
            { label: 'Plan', value: `Coplio ${plan}` },
            { label: 'Montant', value: `${montant} / mois` },
            { label: 'Période', value: `${periodeDebut} → ${periodeFin}` },
          ]}
        />

        <Section style={{ textAlign: 'center' as const, marginBottom: '20px' }}>
          <EmailButton href={`${brand.appUrl}/dashboard`}>
            Accéder à mon tableau de bord
          </EmailButton>
        </Section>

        {factureUrl && (
          <Text style={{ margin: '8px 0 0', fontSize: '13px', color: brand.mutedColor, textAlign: 'center' as const }}>
            <Link href={factureUrl} style={{ color: brand.primaryColor }}>
              Télécharger ma facture
            </Link>
          </Text>
        )}

        <Text style={{ margin: '20px 0 0', fontSize: '13px', color: brand.mutedColor, textAlign: 'center' as const }}>
          Gérez votre abonnement à tout moment depuis{' '}
          <Link href={`${brand.appUrl}/facturation`} style={{ color: brand.primaryColor }}>
            votre espace facturation
          </Link>.
        </Text>
      </EmailBody>
    </EmailBase>
  )
}

export default CheckoutConfirm
