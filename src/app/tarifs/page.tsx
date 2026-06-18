import type { Metadata } from 'next'
import { SoftwareApplicationJsonLd } from '@/components/seo/JsonLd'
import Nav from '@/components/landing/Nav'
import Footer from '@/components/landing/Footer'
import PricingTarifs from '@/components/landing/PricingTarifs'

export const metadata: Metadata = {
  title: 'Tarifs',
  description:
    "Tarifs Coplio — logiciel de gestion de copropriété. Un prix par copropriété, dégressif (de 30 à 19 €/copro/mois) + forfaits Essentiel, Pro et Cabinet. Essai gratuit 30 jours, sans carte bancaire, sans engagement.",
  alternates: { canonical: 'https://coplio.fr/tarifs' },
  openGraph: {
    title: 'Tarifs Coplio — Logiciel syndic à partir de 19 €/copropriété',
    description:
      'Un prix par copropriété, dégressif. Forfaits Essentiel, Pro et Cabinet. Essai gratuit 30 jours sans engagement.',
    url: 'https://coplio.fr/tarifs',
    images: [{ url: 'https://coplio.fr/opengraph-image', width: 1200, height: 630 }],
  },
}

export default function TarifsPage() {
  return (
    <>
      <SoftwareApplicationJsonLd />

      <div className="min-h-screen bg-white">
        {/* Navigation principale — identique à la landing */}
        <Nav />

        {/* Grille tarifaire (socle dégressif + forfaits) — source unique partagée avec la home */}
        <PricingTarifs headingLevel={1} />

        {/* Footer identique à la landing */}
        <Footer />
      </div>
    </>
  )
}
