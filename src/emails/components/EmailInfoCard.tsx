import { Section, Row, Column, Text } from '@react-email/components'
import * as React from 'react'
import { EMAIL_CONFIG } from '@/lib/email/config'

const { brand } = EMAIL_CONFIG

interface InfoItem {
  label: string
  value: string
}

interface EmailInfoCardProps {
  items: InfoItem[]
  variant?: 'success' | 'warning' | 'danger' | 'neutral'
  /** Valeur mise en avant (grand texte au-dessus des items) */
  highlight?: string
  highlightLabel?: string
}

const VARIANT_STYLES = {
  success: { bg: brand.lightColor, text: brand.primaryColor },
  warning: { bg: '#FAEEDA',         text: '#854F0B' },
  danger:  { bg: '#FCEBEB',         text: '#A32D2D' },
  neutral: { bg: '#F7F7F6',         text: brand.textColor },
}

export function EmailInfoCard({
  items,
  variant = 'success',
  highlight,
  highlightLabel,
}: EmailInfoCardProps) {
  const { bg, text } = VARIANT_STYLES[variant]

  return (
    <Section
      style={{
        backgroundColor: bg,
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
      }}
    >
      {highlight && (
        <>
          {highlightLabel && (
            <Text style={{ margin: '0 0 4px', fontSize: '11px', color: text, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {highlightLabel}
            </Text>
          )}
          <Text style={{ margin: '0 0 16px', fontSize: '28px', fontWeight: 800, color: text, lineHeight: 1 }}>
            {highlight}
          </Text>
        </>
      )}
      {items.map((item, i) => (
        <Row key={i} style={{ marginBottom: i < items.length - 1 ? '12px' : 0 }}>
          <Column>
            <Text style={{ margin: '0 0 2px', fontSize: '11px', color: text, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {item.label}
            </Text>
            <Text style={{ margin: 0, fontSize: '14px', color: text, fontWeight: 500 }}>
              {item.value}
            </Text>
          </Column>
        </Row>
      ))}
    </Section>
  )
}
