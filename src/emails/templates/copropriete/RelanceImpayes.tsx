import { Text, Section, Hr } from '@react-email/components'
import * as React from 'react'
import { EmailBase, EmailBody } from '@/emails/layouts/EmailBase'
import { EmailButton } from '@/emails/components/EmailButton'
import { EmailInfoCard } from '@/emails/components/EmailInfoCard'
import { EMAIL_CONFIG } from '@/lib/email/config'
import type { RelanceImpayesProps } from '@/lib/email/types'

const { brand } = EMAIL_CONFIG

const NIVEAU_CONFIG = {
  1: {
    titre: 'Rappel de paiement',
    intro: "Sauf erreur de notre part, nous n'avons pas reçu le règlement suivant :",
    variant: 'warning' as const,
    label: '⚠️ Rappel amiable',
    warning: null,
  },
  2: {
    titre: 'Deuxième rappel — charges impayées',
    intro: "Malgré notre premier rappel, nous n'avons pas reçu le règlement suivant :",
    variant: 'danger' as const,
    label: '⚠️ Deuxième rappel',
    warning: "Sans règlement de votre part dans les 15 jours, nous serons contraints d'engager une procédure de recouvrement.",
  },
  3: {
    titre: 'Mise en demeure',
    intro: 'Malgré nos rappels successifs, votre solde reste impayé :',
    variant: 'danger' as const,
    label: '🚨 Mise en demeure',
    warning: "À défaut de règlement dans les 8 jours, nous nous verrons dans l'obligation d'engager une procédure de recouvrement judiciaire.",
  },
}

export function RelanceImpayes({
  prenom,
  nom,
  montant,
  dateEcheance,
  cabinetNom,
  nomCopropriete,
  numeroLot,
  niveau,
  portailUrl,
}: RelanceImpayesProps) {
  const config = NIVEAU_CONFIG[niveau]

  return (
    <EmailBase preview={`${config.label} — ${montant} impayés · ${nomCopropriete}`}>
      <EmailBody>
        <Text style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700, color: niveau === 1 ? '#854F0B' : '#A32D2D' }}>
          {config.label}
        </Text>
        <Text style={{ margin: '0 0 20px', fontSize: '13px', color: brand.mutedColor }}>
          {nomCopropriete} · Lot {numeroLot}
        </Text>

        <Text style={{ margin: '0 0 16px', fontSize: '15px', color: brand.textColor }}>
          Madame, Monsieur <strong>{prenom} {nom}</strong>,{'\n\n'}
          {config.intro}
        </Text>

        <EmailInfoCard
          variant={config.variant}
          highlight={montant}
          highlightLabel="Montant dû"
          items={[
            { label: 'Échéance', value: dateEcheance },
            { label: 'Résidence', value: nomCopropriete },
            { label: 'Lot', value: `N°${numeroLot}` },
          ]}
        />

        {config.warning && (
          <Section
            style={{
              backgroundColor: '#FCEBEB',
              borderLeft: '3px solid #A32D2D',
              borderRadius: '6px',
              padding: '14px 16px',
              marginBottom: '24px',
            }}
          >
            <Text style={{ margin: 0, fontSize: '14px', color: '#A32D2D', lineHeight: '1.6', fontWeight: 600 }}>
              {config.warning}
            </Text>
          </Section>
        )}

        {portailUrl && (
          <Section style={{ textAlign: 'center' as const, marginBottom: '24px' }}>
            <EmailButton href={portailUrl} variant={niveau === 1 ? 'warning' : 'danger'}>
              Régulariser ma situation →
            </EmailButton>
          </Section>
        )}

        <Hr style={{ borderColor: brand.borderColor, margin: '0 0 16px' }} />
        <Text style={{ margin: 0, fontSize: '13px', color: brand.mutedColor, lineHeight: '1.6' }}>
          Cabinet {cabinetNom} — Syndic de la résidence {nomCopropriete}
          {'\n'}
          Pour toute question, contactez votre syndic directement.
        </Text>
      </EmailBody>
    </EmailBase>
  )
}

export default RelanceImpayes
