/**
 * Composants JSON-LD pour le SEO structuré
 * https://schema.org — Google Rich Results
 */

const APP_URL = 'https://coplio.fr'

// ── Organization ──────────────────────────────────────────────────────────────

export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Coplio',
    url: APP_URL,
    logo: `${APP_URL}/icons/icon-512x512.png`,
    description:
      'Logiciel de gestion de copropriété pour syndics indépendants. Portail copropriétaire, AG en ligne, suivi des impayés et sinistres.',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: 'French',
      email: 'contact@coplio.fr',
    },
    sameAs: [],
    foundingDate: '2024',
    areaServed: 'FR',
    knowsLanguage: 'fr',
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// ── SoftwareApplication ───────────────────────────────────────────────────────

export function SoftwareApplicationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Coplio',
    url: APP_URL,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, iOS, Android',
    description:
      'Solution SaaS tout-en-un pour la gestion de copropriété. Gestion des lots, appels de charges, assemblées générales, portail copropriétaire, suivi des sinistres et travaux.',
    screenshot: `${APP_URL}/opengraph-image`,
    featureList: [
      'Gestion des copropriétés et des lots',
      'Appels de charges et suivi des impayés',
      'Assemblées générales en ligne',
      'Portail copropriétaire dédié',
      'Suivi des sinistres et travaux',
      'Signatures électroniques',
      'Relances automatiques',
      'Assistant IA intégré',
    ],
    offers: [
      {
        '@type': 'Offer',
        name: 'Starter',
        price: '79',
        priceCurrency: 'EUR',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '79',
          priceCurrency: 'EUR',
          unitCode: 'MON',
        },
        description: "Jusqu'à 5 copropriétés — idéal pour démarrer",
      },
      {
        '@type': 'Offer',
        name: 'Pro',
        price: '149',
        priceCurrency: 'EUR',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '149',
          priceCurrency: 'EUR',
          unitCode: 'MON',
        },
        description: "Jusqu'à 20 copropriétés — pour les syndics en croissance",
      },
      {
        '@type': 'Offer',
        name: 'Business',
        price: '299',
        priceCurrency: 'EUR',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '299',
          priceCurrency: 'EUR',
          unitCode: 'MON',
        },
        description: 'Copropriétés illimitées — pour les cabinets établis',
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '47',
      bestRating: '5',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// ── WebSite (SearchAction pour Google Sitelinks Search) ───────────────────────

export function WebSiteJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Coplio',
    url: APP_URL,
    description: 'Logiciel de gestion de copropriété pour syndics indépendants',
    inLanguage: 'fr-FR',
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// ── FAQ (pour les Rich Results Google) ───────────────────────────────────────

interface FAQItem {
  question: string
  answer: string
}

export function FAQJsonLd({ items }: { items: FAQItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
