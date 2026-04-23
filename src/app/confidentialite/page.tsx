import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-coplio-bg py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-coplio-green rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="text-coplio-text font-bold text-xl">Coplio</span>
        </div>

        <Link href="/register" className="flex items-center gap-1.5 text-muted-foreground hover:text-coplio-text text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>

        <div className="coplio-card">
          <h1 className="text-2xl font-bold text-coplio-text mb-2">Politique de confidentialité</h1>
          <p className="text-muted-foreground text-sm mb-8">Dernière mise à jour : janvier 2026</p>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-coplio-text mb-3">1. Responsable du traitement</h2>
            <p className="text-sm text-coplio-text leading-relaxed">
              Coplio SAS est responsable du traitement de vos données personnelles. Contact DPO : <a href="mailto:privacy@coplio.fr" className="text-coplio-green hover:underline">privacy@coplio.fr</a>
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-coplio-text mb-3">2. Données collectées</h2>
            <p className="text-sm text-coplio-text leading-relaxed mb-2">Nous collectons les données suivantes :</p>
            <ul className="text-sm text-coplio-text space-y-1 list-disc list-inside">
              <li><strong>Données de compte :</strong> nom, prénom, email, téléphone, entreprise</li>
              <li><strong>Données de facturation :</strong> via Stripe (nous ne stockons pas les données bancaires)</li>
              <li><strong>Données métier :</strong> copropriétés, lots, copropriétaires, documents, sinistres (données que vous saisissez)</li>
              <li><strong>Données techniques :</strong> logs de connexion, adresse IP, navigateur</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-coplio-text mb-3">3. Finalités du traitement</h2>
            <ul className="text-sm text-coplio-text space-y-1 list-disc list-inside">
              <li>Fourniture et amélioration du service Coplio</li>
              <li>Gestion de votre abonnement et facturation</li>
              <li>Support client et communication</li>
              <li>Sécurité et prévention des fraudes</li>
              <li>Obligations légales et réglementaires</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-coplio-text mb-3">4. Base légale</h2>
            <p className="text-sm text-coplio-text leading-relaxed">
              Le traitement de vos données repose sur : l&apos;exécution du contrat (fourniture du service),
              le consentement (communications marketing), et les obligations légales (facturation, comptabilité).
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-coplio-text mb-3">5. Hébergement et transferts</h2>
            <p className="text-sm text-coplio-text leading-relaxed">
              Vos données sont hébergées en Europe (Union Européenne) via Supabase (infrastructure AWS Frankfurt).
              Aucun transfert hors UE n&apos;est effectué sans garanties appropriées (clauses contractuelles types).
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-coplio-text mb-3">6. Durée de conservation</h2>
            <ul className="text-sm text-coplio-text space-y-1 list-disc list-inside">
              <li>Données de compte actif : durée de l&apos;abonnement</li>
              <li>Après résiliation : 30 jours pour export, puis suppression</li>
              <li>Données de facturation : 10 ans (obligation légale)</li>
              <li>Logs techniques : 12 mois</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-coplio-text mb-3">7. Vos droits (RGPD)</h2>
            <p className="text-sm text-coplio-text leading-relaxed mb-2">
              Conformément au RGPD, vous disposez des droits suivants :
            </p>
            <ul className="text-sm text-coplio-text space-y-1 list-disc list-inside">
              <li>Droit d&apos;accès à vos données</li>
              <li>Droit de rectification</li>
              <li>Droit à l&apos;effacement (&quot;droit à l&apos;oubli&quot;)</li>
              <li>Droit à la portabilité</li>
              <li>Droit d&apos;opposition et de limitation</li>
            </ul>
            <p className="text-sm text-coplio-text leading-relaxed mt-2">
              Pour exercer ces droits : <a href="mailto:privacy@coplio.fr" className="text-coplio-green hover:underline">privacy@coplio.fr</a>.
              Vous pouvez également déposer une plainte auprès de la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-coplio-green hover:underline">www.cnil.fr</a>).
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-coplio-text mb-3">8. Cookies</h2>
            <p className="text-sm text-coplio-text leading-relaxed">
              Coplio utilise uniquement des cookies strictement nécessaires au fonctionnement du service
              (session d&apos;authentification). Aucun cookie publicitaire ou de tracking n&apos;est utilisé.
            </p>
          </section>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Pour toute question : <a href="mailto:privacy@coplio.fr" className="text-coplio-green hover:underline">privacy@coplio.fr</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
