import { Text, Section, Hr, Row, Column } from '@react-email/components'
import * as React from 'react'
import { EmailBase, EmailBody } from '@/emails/layouts/EmailBase'
import { EmailButton } from '@/emails/components/EmailButton'
import { EmailInfoCard } from '@/emails/components/EmailInfoCard'
import { EMAIL_CONFIG } from '@/lib/email/config'
import type { InvitationProps } from '@/lib/email/types'

const { brand } = EMAIL_CONFIG

export function Invitation({
  prenom,
  nom,
  cabinetNom,
  nomCopropriete,
  tempPassword,
  portailUrl,
}: InvitationProps) {
  return (
    <EmailBase
      preview={`${cabinetNom} vous invite à accéder à votre portail copropriétaire.`}
      recipientEmail={undefined}
    >
      <EmailBody>
        <Text style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: brand.textColor }}>
          🏠 Accès à votre portail copropriétaire
        </Text>
        <Text style={{ margin: '0 0 20px', fontSize: '15px', color: '#666', lineHeight: '1.7' }}>
          Bonjour <strong>{prenom} {nom}</strong>,{'\n\n'}
          Le cabinet <strong>{cabinetNom}</strong> vous invite à rejoindre votre espace
          copropriétaire en ligne pour la résidence <strong>{nomCopropriete}</strong>.
        </Text>

        <EmailInfoCard
          variant="success"
          items={[
            { label: 'Résidence', value: nomCopropriete },
            { label: 'Géré par', value: cabinetNom },
          ]}
        />

        {/* Encadré identifiants */}
        <Section style={{
          backgroundColor: '#F0FDF9',
          border: '1.5px solid #A7F3D0',
          borderRadius: '12px',
          padding: '20px 24px',
          margin: '20px 0 24px',
        }}>
          <Text style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 700, color: brand.textColor }}>
            🔐 Vos identifiants de connexion
          </Text>

          <Row style={{ marginBottom: '10px' }}>
            <Column style={{ width: '120px' }}>
              <Text style={{ margin: 0, fontSize: '12px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                Identifiant
              </Text>
            </Column>
            <Column>
              <Text style={{ margin: 0, fontSize: '14px', color: brand.textColor, fontWeight: 600 }}>
                Votre adresse email
              </Text>
            </Column>
          </Row>

          <Row>
            <Column style={{ width: '120px' }}>
              <Text style={{ margin: 0, fontSize: '12px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                Mot de passe
              </Text>
            </Column>
            <Column>
              <Text style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 800,
                color: brand.primaryColor,
                fontFamily: 'monospace',
                letterSpacing: '0.1em',
                backgroundColor: '#DCFCE7',
                padding: '4px 10px',
                borderRadius: '6px',
                display: 'inline-block',
              }}>
                {tempPassword}
              </Text>
            </Column>
          </Row>

          <Hr style={{ borderColor: '#A7F3D0', margin: '16px 0 12px' }} />

          <Text style={{ margin: 0, fontSize: '13px', color: '#059669', lineHeight: '1.6' }}>
            ⚠️ <strong>Important :</strong> Ce mot de passe est temporaire.
            Connectez-vous et modifiez-le dès votre première connexion dans <strong>Compte → Sécurité</strong>.
          </Text>
        </Section>

        <Text style={{ margin: '0 0 8px', fontSize: '14px', color: brand.textColor, fontWeight: 600 }}>
          Ce que vous pouvez faire depuis votre portail :
        </Text>
        <Text style={{ margin: '0 0 28px', fontSize: '14px', color: '#666', lineHeight: '2' }}>
          💶 Consulter vos charges et votre solde{'\n'}
          📄 Accéder à tous vos documents{'\n'}
          🔨 Suivre les travaux et sinistres{'\n'}
          🗳️ Voter lors des assemblées générales{'\n'}
          💬 Échanger avec votre syndic
        </Text>

        <Section style={{ textAlign: 'center' as const, marginBottom: '28px' }}>
          <EmailButton href={portailUrl}>
            Accéder à mon portail →
          </EmailButton>
        </Section>

        <Hr style={{ borderColor: brand.borderColor, margin: '0 0 16px' }} />
        <Text style={{ margin: 0, fontSize: '12px', color: brand.mutedColor, textAlign: 'center' as const, lineHeight: '1.6' }}>
          Si vous n&apos;attendiez pas cet email, ignorez-le.{'\n'}
          Pour toute question, contactez directement {cabinetNom}.
        </Text>
      </EmailBody>
    </EmailBase>
  )
}

export default Invitation
