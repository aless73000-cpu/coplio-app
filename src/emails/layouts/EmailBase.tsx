// ═══════════════════════════════════════════════════════════════
// COPLIO — Layout de base des emails
// Compatible Gmail, Outlook, Apple Mail, mobile.
// ═══════════════════════════════════════════════════════════════

import {
  Html,
  Head,
  Body,
  Preview,
  Container,
  Section,
  Row,
  Column,
  Text,
  Link,
  Hr,
} from '@react-email/components'
import * as React from 'react'
import { EMAIL_CONFIG } from '@/lib/email/config'

const { brand } = EMAIL_CONFIG

interface EmailBaseProps {
  preview: string
  children: React.ReactNode
  /** Afficher le lien de désinscription en footer */
  showUnsubscribe?: boolean
  /** Email du destinataire pour le lien de désinscription */
  recipientEmail?: string
}

export function EmailBase({
  preview,
  children,
  showUnsubscribe = false,
  recipientEmail,
}: EmailBaseProps) {
  const year = new Date().getFullYear()
  const unsubLink = recipientEmail
    ? `${brand.unsubscribeUrl}?email=${encodeURIComponent(recipientEmail)}`
    : brand.unsubscribeUrl

  return (
    <Html lang="fr" dir="ltr">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        {/* Prevent iOS from auto-linking phone numbers */}
        <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          * { box-sizing: border-box; }
          body { margin: 0; padding: 0; }
          a { color: ${brand.primaryColor}; }
          /* Dark mode */
          @media (prefers-color-scheme: dark) {
            .email-body { background-color: #1a1a1a !important; }
            .email-card { background-color: #242424 !important; border-color: #333 !important; }
            .email-text { color: #e0e0e0 !important; }
            .email-muted { color: #999 !important; }
            .email-footer-bg { background-color: #1a1a1a !important; }
          }
          @media only screen and (max-width: 600px) {
            .email-container { width: 100% !important; padding: 0 16px !important; }
            .email-card { border-radius: 12px !important; }
            .email-card-inner { padding: 24px !important; }
            .email-header { padding: 24px !important; }
            .email-cta { width: 100% !important; text-align: center !important; }
          }
        `}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body
        className="email-body"
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: brand.bgColor,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        <Container
          className="email-container"
          style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}
        >
          {/* ─── Card principale ─── */}
          <Section
            className="email-card"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: `1px solid ${brand.borderColor}`,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <EmailHeader />

            {/* Contenu injecté */}
            {children}

            {/* Footer */}
            <EmailFooter
              showUnsubscribe={showUnsubscribe}
              unsubLink={unsubLink}
              year={year}
            />
          </Section>

          {/* Mention légale sous la card */}
          <Text
            style={{
              textAlign: 'center',
              fontSize: '11px',
              color: '#aaaaaa',
              marginTop: '20px',
              lineHeight: '1.5',
            }}
          >
            Cet email a été envoyé par Coplio · {brand.appUrl}
            {'\n'}
            <Link href={brand.privacyUrl} style={{ color: '#aaaaaa' }}>
              Politique de confidentialité
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// ─── Header ───────────────────────────────────────────────────

function EmailHeader() {
  return (
    <Section
      className="email-header"
      style={{
        backgroundColor: brand.primaryColor,
        padding: '32px 40px',
        textAlign: 'center' as const,
      }}
    >
      <Text
        style={{
          margin: 0,
          color: '#ffffff',
          fontSize: '26px',
          fontWeight: 800,
          letterSpacing: '-0.5px',
          lineHeight: '1',
        }}
      >
        Coplio
      </Text>
      <Text
        style={{
          margin: '6px 0 0',
          color: 'rgba(255,255,255,0.75)',
          fontSize: '13px',
          fontWeight: 400,
          letterSpacing: '0.2px',
        }}
      >
        Gestion de copropriété
      </Text>
    </Section>
  )
}

// ─── Footer ───────────────────────────────────────────────────

function EmailFooter({
  showUnsubscribe,
  unsubLink,
  year,
}: {
  showUnsubscribe: boolean
  unsubLink: string
  year: number
}) {
  return (
    <Section
      className="email-footer-bg"
      style={{ backgroundColor: brand.bgColor, padding: '20px 40px' }}
    >
      <Hr style={{ borderColor: brand.borderColor, margin: '0 0 16px' }} />
      <Row>
        <Column>
          <Text
            style={{
              margin: 0,
              fontSize: '12px',
              color: '#999999',
              lineHeight: '1.6',
              textAlign: 'center' as const,
            }}
          >
            © {year} Coplio SAS · Tous droits réservés
            {'\n'}
            <Link href={brand.supportEmail} style={{ color: '#999999' }}>
              {brand.supportEmail}
            </Link>
            {showUnsubscribe && (
              <>
                {' · '}
                <Link href={unsubLink} style={{ color: '#999999' }}>
                  Se désinscrire
                </Link>
              </>
            )}
          </Text>
        </Column>
      </Row>
    </Section>
  )
}

// ─── Corps ────────────────────────────────────────────────────

/** Wrapper pour le contenu principal d'un email */
export function EmailBody({ children }: { children: React.ReactNode }) {
  return (
    <Section
      className="email-card-inner"
      style={{ padding: '36px 40px' }}
    >
      {children}
    </Section>
  )
}
