import { Text, Section, Row, Column } from '@react-email/components'
import * as React from 'react'
import { EmailBase, EmailBody } from '@/emails/layouts/EmailBase'
import { EmailButton } from '@/emails/components/EmailButton'
import { EmailInfoCard } from '@/emails/components/EmailInfoCard'
import { EMAIL_CONFIG } from '@/lib/email/config'
import type { ConvocationAGProps } from '@/lib/email/types'

const { brand } = EMAIL_CONFIG

export function ConvocationAG({
  prenom,
  nom,
  cabinetNom,
  nomCopropriete,
  dateAg,
  heure,
  lieu,
  listeResolutions,
  lienVote,
}: ConvocationAGProps) {
  return (
    <EmailBase preview={`Convocation à l'AG du ${dateAg} — ${nomCopropriete}`}>
      <EmailBody>
        <Text style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700, color: brand.textColor }}>
          📋 Convocation à l&apos;Assemblée Générale
        </Text>
        <Text style={{ margin: '0 0 20px', fontSize: '13px', color: brand.mutedColor }}>
          {nomCopropriete}
        </Text>

        <Text style={{ margin: '0 0 20px', fontSize: '15px', color: '#666', lineHeight: '1.7' }}>
          Madame, Monsieur <strong>{prenom} {nom}</strong>,{'\n\n'}
          Vous êtes convoqué(e) à l&apos;Assemblée Générale de la résidence{' '}
          <strong>{nomCopropriete}</strong>, organisée par le cabinet <strong>{cabinetNom}</strong>.
        </Text>

        {/* Date + Lieu mis en avant */}
        <EmailInfoCard
          variant="success"
          items={[
            { label: '📅 Date', value: `${dateAg} à ${heure}` },
            { label: '📍 Lieu', value: lieu },
            { label: 'Organisé par', value: cabinetNom },
          ]}
        />

        {/* Ordre du jour */}
        <Text style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: brand.textColor }}>
          Ordre du jour ({listeResolutions.length} résolution{listeResolutions.length > 1 ? 's' : ''})
        </Text>
        <Section
          style={{
            backgroundColor: brand.bgColor,
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '28px',
          }}
        >
          {listeResolutions.map((res, i) => (
            <Row key={i} style={{ marginBottom: i < listeResolutions.length - 1 ? '10px' : 0 }}>
              <Column style={{ width: '28px' }}>
                <Text
                  style={{
                    margin: 0,
                    fontSize: '12px',
                    fontWeight: 700,
                    color: brand.primaryColor,
                    backgroundColor: brand.lightColor,
                    borderRadius: '50%',
                    width: '22px',
                    height: '22px',
                    textAlign: 'center' as const,
                    lineHeight: '22px',
                    display: 'inline-block',
                  }}
                >
                  {i + 1}
                </Text>
              </Column>
              <Column>
                <Text style={{ margin: 0, fontSize: '14px', color: brand.textColor }}>
                  {res}
                </Text>
              </Column>
            </Row>
          ))}
        </Section>

        {lienVote && (
          <Section style={{ textAlign: 'center' as const, marginBottom: '20px' }}>
            <EmailButton href={lienVote}>
              🗳️ Voter en ligne →
            </EmailButton>
          </Section>
        )}

        <Text style={{ margin: 0, fontSize: '13px', color: brand.mutedColor, textAlign: 'center' as const }}>
          Vous pouvez également voter par procuration en contactant votre syndic.
        </Text>
      </EmailBody>
    </EmailBase>
  )
}

export default ConvocationAG
