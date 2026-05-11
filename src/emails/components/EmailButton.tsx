import { Button } from '@react-email/components'
import * as React from 'react'
import { EMAIL_CONFIG } from '@/lib/email/config'

const { brand } = EMAIL_CONFIG

interface EmailButtonProps {
  href: string
  children: React.ReactNode
  variant?: 'primary' | 'danger' | 'warning'
}

export function EmailButton({ href, children, variant = 'primary' }: EmailButtonProps) {
  const bgColors = {
    primary: brand.primaryColor,
    danger: '#A32D2D',
    warning: '#854F0B',
  }

  return (
    <Button
      href={href}
      style={{
        backgroundColor: bgColors[variant],
        color: '#ffffff',
        borderRadius: '10px',
        fontSize: '15px',
        fontWeight: 600,
        padding: '14px 32px',
        textDecoration: 'none',
        display: 'inline-block',
        textAlign: 'center' as const,
        cursor: 'pointer',
      }}
    >
      {children}
    </Button>
  )
}
