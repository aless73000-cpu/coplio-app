import { Text, Section, Row, Column } from '@react-email/components'
import * as React from 'react'
import { EmailBase, EmailBody } from '@/emails/layouts/EmailBase'
import { EmailButton } from '@/emails/components/EmailButton'
import { EMAIL_CONFIG } from '@/lib/email/config'
import type { WelcomeSyndicProps } from '@/lib/email/types'

const { brand } = EMAIL_CONFIG

export function WelcomeSyndic({ prenom, nomCabinet, appUrl = brand.appUrl, confirmUrl }: WelcomeSyndicProps) {
  const steps = [
    { icon: '🏢', label: 'Ajoutez votre première copropriété' },
    { icon: '👥', label: 'Invitez vos copropriétaires' },
    { icon: '📄', label: 'Importez vos documents' },
    { icon: '💶', label: 'Suivez vos appels de charges' },
  ]

  return (
    <EmailBase preview={`Bienvenue ${prenom} ! Votre espace ${nomCabinet} est prêt.`}>
      <EmailBody>
        {/* Accroche */}
        <Text style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 800, color: brand.textColor }}>
          Bienvenue {prenom} ! 👋
        </Text>
        <Text style={{ margin: '0 0 24px', fontSize: '15px', color: '#666', lineHeight: '1.7' }}>
          Votre espace <strong>{nomCabinet}</strong> est prêt.
          Votre essai gratuit de <strong>30 jours</strong> commence maintenant — aucune carte bancaire requise.
        </Text>

        {/* Steps d'onboarding */}
        <Text style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: brand.mutedColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Pour commencer
        </Text>
        <Section style={{ backgroundColor: brand.bgColor, borderRadius: '12px', padding: '20px', marginBottom: '28px' }}>
          {steps.map((step, i) => (
            <Row key={i} style={{ marginBottom: i < steps.length - 1 ? '12px' : 0 }}>
              <Column style={{ width: '36px' }}>
                <Text style={{ margin: 0, fontSize: '20px' }}>{step.icon}</Text>
              </Column>
              <Column>
                <Text style={{ margin: 0, fontSize: '14px', color: brand.textColor, fontWeight: 500 }}>
                  {step.label}
                </Text>
              </Column>
            </Row>
          ))}
        </Section>

        {/* CTA — confirmation email si lien fourni, dashboard sinon */}
        <Section style={{ textAlign: 'center' as const, marginBottom: '24px' }}>
          {confirmUrl ? (
            <>
              <EmailButton href={confirmUrl}>
                ✉️ Confirmer mon adresse email →
              </EmailButton>
              <Text style={{ margin: '12px 0 0', fontSize: '12px', color: brand.mutedColor, textAlign: 'center' as const }}>
                Ce lien expire dans 24h. Après confirmation, vous accéderez directement à votre tableau de bord.
              </Text>
            </>
          ) : (
            <EmailButton href={`${appUrl}/dashboard`}>
              Accéder à mon tableau de bord →
            </EmailButton>
          )}
        </Section>

        <Text style={{ margin: 0, fontSize: '13px', color: brand.mutedColor, textAlign: 'center' as const }}>
          Des questions ? Répondez directement à cet email.
          Notre équipe vous répond sous 24h.
        </Text>
      </EmailBody>
    </EmailBase>
  )
}

export default WelcomeSyndic
