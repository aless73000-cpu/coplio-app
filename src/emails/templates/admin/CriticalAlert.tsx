import { Text, Section, Row, Column } from '@react-email/components'
import * as React from 'react'
import { EmailBase, EmailBody } from '@/emails/layouts/EmailBase'
import { EmailButton } from '@/emails/components/EmailButton'
import { EMAIL_CONFIG } from '@/lib/email/config'
import type { CriticalAlertProps } from '@/lib/email/types'

const { brand } = EMAIL_CONFIG

const SEVERITY = {
  info:     { icon: 'ℹ️', color: brand.primaryColor,  bg: brand.lightColor },
  warning:  { icon: '⚠️', color: '#854F0B',            bg: '#FAEEDA' },
  critical: { icon: '🚨', color: '#A32D2D',            bg: '#FCEBEB' },
}

export function CriticalAlert({
  titre,
  message,
  severity,
  details,
  actionUrl,
  actionLabel = 'Voir le détail',
}: CriticalAlertProps) {
  const s = SEVERITY[severity]

  return (
    <EmailBase preview={`[Coplio Admin] ${s.icon} ${titre}`}>
      <EmailBody>
        <Text style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Alerte système · {severity.toUpperCase()}
        </Text>
        <Text style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: 700, color: brand.textColor }}>
          {s.icon} {titre}
        </Text>

        <Section
          style={{
            backgroundColor: s.bg,
            borderLeft: `3px solid ${s.color}`,
            borderRadius: '6px',
            padding: '16px',
            marginBottom: '24px',
          }}
        >
          <Text style={{ margin: 0, fontSize: '14px', color: s.color, lineHeight: '1.7', fontWeight: 500 }}>
            {message}
          </Text>
        </Section>

        {details && Object.keys(details).length > 0 && (
          <Section
            style={{
              backgroundColor: '#F7F7F6',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '24px',
              fontFamily: 'monospace',
            }}
          >
            <Text style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: brand.mutedColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Détails techniques
            </Text>
            {Object.entries(details).map(([key, value]) => (
              <Row key={key} style={{ marginBottom: '4px' }}>
                <Column style={{ width: '140px' }}>
                  <Text style={{ margin: 0, fontSize: '12px', color: brand.mutedColor, fontWeight: 600 }}>
                    {key}
                  </Text>
                </Column>
                <Column>
                  <Text style={{ margin: 0, fontSize: '12px', color: brand.textColor }}>
                    {value}
                  </Text>
                </Column>
              </Row>
            ))}
          </Section>
        )}

        {actionUrl && (
          <Section style={{ textAlign: 'center' as const }}>
            <EmailButton
              href={actionUrl}
              variant={severity === 'critical' ? 'danger' : severity === 'warning' ? 'warning' : 'primary'}
            >
              {actionLabel}
            </EmailButton>
          </Section>
        )}

        <Text style={{ margin: '20px 0 0', fontSize: '11px', color: brand.mutedColor, textAlign: 'center' as const }}>
          Envoyé automatiquement par Coplio · {new Date().toISOString()}
        </Text>
      </EmailBody>
    </EmailBase>
  )
}

export default CriticalAlert
