import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import '@/styles/globals.css'
import { Toaster } from 'sonner'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import {
  OrganizationJsonLd,
  WebSiteJsonLd,
} from '@/components/seo/JsonLd'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coplio.fr'

export const metadata: Metadata = {
  title: {
    default: 'Coplio — Gestion de copropriété pour syndics indépendants',
    template: '%s | Coplio',
  },
  description:
    'Coplio simplifie la gestion de copropriété pour les syndics indépendants. Portail copropriétaire, AG en ligne, suivi des impayés, sinistres — tout en un. Essai gratuit 14 jours.',
  keywords: [
    'logiciel syndic',
    'gestion copropriété',
    'syndic indépendant',
    'portail copropriétaire',
    'assemblée générale en ligne',
    'suivi impayés',
    'logiciel gestion immeuble',
    'syndic bénévole',
    'logiciel copropriété',
    'gestion immeuble',
    'charges copropriété',
  ],
  authors: [{ name: 'Coplio', url: APP_URL }],
  creator: 'Coplio',
  publisher: 'Coplio',
  metadataBase: new URL(APP_URL),

  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: APP_URL,
    siteName: 'Coplio',
    title: 'Coplio — Gestion de copropriété pour syndics indépendants',
    description:
      'Simplifiez votre gestion de copropriété. Portail copropriétaire inclus, AG en ligne, relances automatiques. Essai gratuit 14 jours.',
    images: [
      {
        url: `${APP_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'Coplio — Logiciel de gestion syndic',
        type: 'image/png',
      },
    ],
  },

  // Twitter card
  twitter: {
    card: 'summary_large_image',
    title: 'Coplio — Gestion de copropriété simplifiée',
    description:
      'Le logiciel de gestion de copropriété pour syndics indépendants. Essai gratuit 14 jours.',
    images: [`${APP_URL}/opengraph-image`],
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Canonical
  alternates: {
    canonical: APP_URL,
  },

  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0F6E56',
  width: 'device-width',
  initialScale: 1,
  // maximumScale supprimé — violation WCAG 2.1 SC 1.4.4 (empêchait le zoom sur iOS)
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <OrganizationJsonLd />
        <WebSiteJsonLd />
      </head>
      <body className={inter.className}>
        <ServiceWorkerRegistration />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#fff',
              border: '1px solid #E1F5EE',
              color: '#444441',
            },
          }}
        />

        {/* Plausible Analytics — privacy-friendly, sans cookies */}
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <Script
            defer
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  )
}
