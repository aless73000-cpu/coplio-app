import { Text, Section } from '@react-email/components'
import * as React from 'react'
import { EmailBase, EmailBody } from '@/emails/layouts/EmailBase'
import { EmailButton } from '@/emails/components/EmailButton'
import { EMAIL_CONFIG } from '@/lib/email/config'
import { PLAN_LIMITS } from '@/lib/stripe'
import type { TrialEndingProps } from '@/lib/email/types'

const { brand } = EMAIL_CONFIG

export function TrialEnding({
  prenom,
  nomCabinet,
  joursRestants,
  upgradeUrl,
}: TrialEndingProps) {
  const isUrgent = joursRestants <= 2

  return (
    <EmailBase preview={`⏰ Votre essai Coplio expire dans ${joursRestants} jour${joursRestants > 1 ? 's' : ''}.`}>
      <EmailBody>
        <Text
          style={{
            margin: '0 0 8px',
            fontSize: '20px',
            fontWeight: 700,
            color: isUrgent ? '#A32D2D' : '#854F0B',
          }}
        >
          {isUrgent ? '🚨' : '⏰'} Plus que {joursRestants} jour{joursRestants > 1 ? 's' : ''} d&apos;essai
        </Text>
        <Text style={{ margin: '0 0 24px', fontSize: '15px', color: '#666', lineHeight: '1.7' }}>
          Bonjour {prenom},{'\n\n'}
          Votre période d&apos;essai gratuit pour <strong>{nomCabinet}</strong> se termine dans{' '}
          <strong>{joursRestants} jour{joursRestants > 1 ? 's' : ''}</strong>.
          Pour continuer à utiliser Coplio sans interruption, choisissez un plan dès maintenant.
        </Text>

        {/* Plans résumés */}
        <Section
          style={{
            backgroundColor: brand.bgColor,
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '28px',
          }}
        >
          {[
            { name: 'Starter', price: '99€/mois', detail: `1 gestionnaire · ${PLAN_LIMITS.starter.max_lots} lots` },
            { name: 'Pro',     price: '189€/mois', detail: `${PLAN_LIMITS.pro.max_gestionnaires} gestionnaires · ${PLAN_LIMITS.pro.max_lots} lots` },
            { name: 'Cabinet', price: '279€/mois', detail: 'Illimité · Support prioritaire' },
          ].map((plan) => (
            <Section key={plan.name} style={{ marginBottom: '8px' }}>
              <Text style={{ margin: 0, fontSize: '14px', color: brand.textColor }}>
                <strong style={{ color: brand.primaryColor }}>{plan.name}</strong>
                {' — '}{plan.price}
                <span style={{ color: brand.mutedColor }}> · {plan.detail}</span>
              </Text>
            </Section>
          ))}
        </Section>

        <Section style={{ textAlign: 'center' as const, marginBottom: '20px' }}>
          <EmailButton href={upgradeUrl} variant={isUrgent ? 'danger' : 'primary'}>
            Choisir un plan →
          </EmailButton>
        </Section>

        <Text style={{ margin: 0, fontSize: '13px', color: brand.mutedColor, textAlign: 'center' as const }}>
          Sans action de votre part, votre compte passera en lecture seule.
        </Text>
      </EmailBody>
    </EmailBase>
  )
}

export default TrialEnding
