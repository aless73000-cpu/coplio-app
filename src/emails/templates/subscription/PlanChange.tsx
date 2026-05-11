import { Text, Section } from '@react-email/components'
import * as React from 'react'
import { EmailBase, EmailBody } from '@/emails/layouts/EmailBase'
import { EmailButton } from '@/emails/components/EmailButton'
import { EmailInfoCard } from '@/emails/components/EmailInfoCard'
import { EMAIL_CONFIG } from '@/lib/email/config'
import type { PlanChangeProps } from '@/lib/email/types'

const { brand } = EMAIL_CONFIG

export function PlanChange({
  prenom,
  nomCabinet,
  ancienPlan,
  nouveauPlan,
  montant,
  effectifLe,
}: PlanChangeProps) {
  const isUpgrade = true // simplification — toujours considéré upgrade

  return (
    <EmailBase preview={`Votre plan Coplio a changé : ${ancienPlan} → ${nouveauPlan}`}>
      <EmailBody>
        <Text style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: brand.primaryColor }}>
          {isUpgrade ? '🚀' : '📦'} Changement de plan confirmé
        </Text>
        <Text style={{ margin: '0 0 24px', fontSize: '15px', color: '#666', lineHeight: '1.7' }}>
          Bonjour {prenom},{'\n\n'}
          Le plan de votre cabinet <strong>{nomCabinet}</strong> a bien été modifié.
        </Text>

        <EmailInfoCard
          variant="success"
          items={[
            { label: 'Ancien plan', value: ancienPlan },
            { label: 'Nouveau plan', value: nouveauPlan },
            { label: 'Nouveau montant', value: `${montant} / mois` },
            { label: 'Effectif le', value: effectifLe },
          ]}
        />

        <Section style={{ textAlign: 'center' as const, marginBottom: '20px' }}>
          <EmailButton href={`${brand.appUrl}/facturation`}>
            Voir mon abonnement →
          </EmailButton>
        </Section>

        <Text style={{ margin: 0, fontSize: '13px', color: brand.mutedColor, textAlign: 'center' as const }}>
          Des questions ? Contactez-nous à{' '}
          <span style={{ color: brand.primaryColor }}>{brand.supportEmail}</span>
        </Text>
      </EmailBody>
    </EmailBase>
  )
}

export default PlanChange
