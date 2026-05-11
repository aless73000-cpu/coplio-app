import { Text, Section } from '@react-email/components'
import * as React from 'react'
import { EmailBase, EmailBody } from '@/emails/layouts/EmailBase'
import { EmailButton } from '@/emails/components/EmailButton'
import { EmailInfoCard } from '@/emails/components/EmailInfoCard'
import { EMAIL_CONFIG } from '@/lib/email/config'
import type { AppelChargesProps } from '@/lib/email/types'

const { brand } = EMAIL_CONFIG

export function NouvelAppelCharges({
  prenom,
  nom,
  libelle,
  montant,
  dateEcheance,
  nomCopropriete,
  numeroLot,
  portailUrl,
}: AppelChargesProps) {
  return (
    <EmailBase
      preview={`Nouvel appel de charges de ${montant} pour votre lot ${numeroLot}.`}
      showUnsubscribe
    >
      <EmailBody>
        <Text style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700, color: brand.textColor }}>
          💶 Nouvel appel de charges
        </Text>
        <Text style={{ margin: '0 0 20px', fontSize: '13px', color: brand.mutedColor }}>
          {nomCopropriete} · Lot {numeroLot}
        </Text>
        <Text style={{ margin: '0 0 24px', fontSize: '15px', color: '#666', lineHeight: '1.7' }}>
          Bonjour <strong>{prenom} {nom}</strong>,{'\n\n'}
          Un nouvel appel de charges a été émis pour votre lot.
        </Text>

        <EmailInfoCard
          variant="success"
          highlight={montant}
          highlightLabel="Montant"
          items={[
            { label: 'Libellé', value: libelle },
            { label: 'Échéance', value: dateEcheance },
            { label: 'Résidence', value: nomCopropriete },
            { label: 'Lot', value: `N°${numeroLot}` },
          ]}
        />

        <Section style={{ textAlign: 'center' as const, marginBottom: '20px' }}>
          <EmailButton href={portailUrl}>
            Voir mes charges →
          </EmailButton>
        </Section>

        <Text style={{ margin: 0, fontSize: '13px', color: brand.mutedColor, textAlign: 'center' as const }}>
          Vous pouvez consulter votre historique complet depuis votre portail.
        </Text>
      </EmailBody>
    </EmailBase>
  )
}

export default NouvelAppelCharges
