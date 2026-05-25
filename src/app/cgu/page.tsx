import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Building2 } from 'lucide-react'

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
  description: "Conditions générales d'utilisation du logiciel Coplio — gestion de copropriété pour syndics indépendants.",
  alternates: { canonical: 'https://coplio.fr/cgu' },
  robots: { index: true, follow: false },
}

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-coplio-bg py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-[#374151] rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-coplio-text font-bold text-xl">Coplio</span>
        </div>

        <Link href="/register" className="flex items-center gap-1.5 text-muted-foreground hover:text-coplio-text text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>

        <div className="coplio-card prose prose-sm max-w-none">
          <h1 className="text-2xl font-bold text-coplio-text mb-2">Conditions Générales d&apos;Utilisation</h1>
          <p className="text-muted-foreground text-sm mb-8">Dernière mise à jour : janvier 2026</p>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-coplio-text mb-3">1. Objet</h2>
            <p className="text-sm text-coplio-text leading-relaxed">
              Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;accès et l&apos;utilisation
              de la plateforme Coplio, solution SaaS dédiée à la gestion de copropriétés, éditée par Coplio SAS.
              En créant un compte, vous acceptez sans réserve les présentes conditions.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-coplio-text mb-3">2. Description du service</h2>
            <p className="text-sm text-coplio-text leading-relaxed">
              Coplio est une solution de gestion de syndic permettant aux professionnels de l&apos;immobilier de gérer :
              les copropriétés, les lots, les appels de charges, les sinistres, les assemblées générales et la communication
              avec les copropriétaires.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-coplio-text mb-3">3. Inscription et compte</h2>
            <p className="text-sm text-coplio-text leading-relaxed">
              L&apos;accès à Coplio nécessite la création d&apos;un compte professionnel. Vous vous engagez à fournir
              des informations exactes et à maintenir la confidentialité de vos identifiants. Vous êtes responsable de
              toutes les actions effectuées depuis votre compte.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-coplio-text mb-3">4. Abonnements et facturation</h2>
            <p className="text-sm text-coplio-text leading-relaxed">
              Coplio propose plusieurs formules d&apos;abonnement (Starter, Pro, Expert). Les tarifs sont indiqués HT.
              Le paiement est mensuel ou annuel, traité via Stripe. L&apos;abonnement se renouvelle automatiquement sauf
              résiliation avant la date de renouvellement.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-coplio-text mb-3">5. Données</h2>
            <p className="text-sm text-coplio-text leading-relaxed">
              Vous restez propriétaire de vos données. Coplio s&apos;engage à ne pas les vendre à des tiers. Les données
              sont hébergées en Europe (Supabase / AWS EU). En cas de résiliation, vos données sont exportables pendant
              30 jours puis supprimées définitivement.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-coplio-text mb-3">6. Responsabilité</h2>
            <p className="text-sm text-coplio-text leading-relaxed">
              Coplio met tout en œuvre pour assurer la disponibilité du service (SLA 99,5%). En cas d&apos;indisponibilité,
              la responsabilité de Coplio est limitée au montant de l&apos;abonnement mensuel en cours. Coplio ne peut
              être tenu responsable des conséquences d&apos;une mauvaise utilisation du service.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-coplio-text mb-3">7. Résiliation</h2>
            <p className="text-sm text-coplio-text leading-relaxed">
              Vous pouvez résilier votre abonnement à tout moment depuis la page Facturation. La résiliation prend
              effet à la fin de la période d&apos;abonnement en cours. Coplio se réserve le droit de résilier un compte
              en cas de violation des présentes CGU.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-coplio-text mb-3">8. Droit applicable</h2>
            <p className="text-sm text-coplio-text leading-relaxed">
              Les présentes CGU sont soumises au droit français. Tout litige sera de la compétence exclusive des
              tribunaux français.
            </p>
          </section>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Pour toute question : <a href="mailto:legal@coplio.fr" className="text-[#374151] hover:underline">legal@coplio.fr</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
