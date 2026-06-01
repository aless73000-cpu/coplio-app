import { Text, Section, Hr, Row, Column } from '@react-email/components'
import * as React from 'react'
import { EmailBase, EmailBody } from '@/emails/layouts/EmailBase'
import { EmailButton } from '@/emails/components/EmailButton'
import { EmailInfoCard } from '@/emails/components/EmailInfoCard'
import { EMAIL_CONFIG } from '@/lib/email/config'
import type { InvitationLocataireProps } from '@/lib/email/types'

const { brand } = EMAIL_CONFIG

export function InvitationLocataire({
  prenom,
  nom,
  proprietaireNom,
  nomCopropriete,
  tempPassword,
  portailUrl,
}: InvitationLocataireProps) {
  return (
    <EmailBase
      preview={`${proprietaireNom} vous invite à accéder à votre espace locataire.`}
      recipientEmail={undefined}
    >
      <EmailBody>
        <Text style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: brand.textColor }}>
          🔑 Accès à votre espace locataire
        </Text>
        <Text style={{ margin: '0 0 20px', fontSize: '15px', color: '#666', lineHeight: '1.7' }}>
          Bonjour <strong>{prenom} {nom}</strong>,{'\n\n'}
          <strong>{proprietaireNom}</strong>, propriétaire de votre logement, vous invite à accéder
          à un espace en ligne pour la résidence <strong>{nomCopropriete}</strong>.{'\n\n'}
          Cet espace vous permet de <strong>signaler facilement un problème</strong> et de retrouver
          les informations utiles de la copropriété.
        </Text>

        <EmailInfoCard
          variant="success"
          items={[
            { label: 'Résidence', value: nomCopropriete },
            { label: 'Invité par', value: proprietaireNom },
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
            Connectez-vous et modifiez-le dès votre première connexion dans <strong>Mon compte</strong>.
          </Text>
        </Section>

        <Text style={{ margin: '0 0 8px', fontSize: '14px', color: brand.textColor, fontWeight: 600 }}>
          Ce que vous pouvez faire depuis votre espace :
        </Text>
        <Text style={{ margin: '0 0 28px', fontSize: '14px', color: '#666', lineHeight: '2' }}>
          🛠️ Signaler un problème à votre syndic{'\n'}
          📋 Suivre l&apos;avancement de vos signalements{'\n'}
          📄 Consulter les documents utiles{'\n'}
          📇 Retrouver les contacts (syndic, propriétaire){'\n'}
          💬 Échanger avec votre syndic
        </Text>

        <Section style={{ textAlign: 'center' as const, marginBottom: '28px' }}>
          <EmailButton href={portailUrl}>
            Accéder à mon espace →
          </EmailButton>
        </Section>

        <Hr style={{ borderColor: brand.borderColor, margin: '0 0 16px' }} />
        <Text style={{ margin: 0, fontSize: '12px', color: brand.mutedColor, textAlign: 'center' as const, lineHeight: '1.6' }}>
          Si vous n&apos;attendiez pas cet email, ignorez-le.{'\n'}
          Cet accès vous a été ouvert par {proprietaireNom}.
        </Text>
      </EmailBody>
    </EmailBase>
  )
}

export default InvitationLocataire
