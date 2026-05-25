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

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  // Seuls les poids réellement utilisés dans l'app → réduit le téléchargement de ~30%
  weight: ['400', '500', '600', '700'],
  // CSS variable → permet l'utilisation via var(--font-inter) dans Tailwind
  variable: '--font-inter',
  // preload: true est le défaut de next/font — la police est déclarée en <link rel="preload">
  preload: true,
})

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

  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#374151',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // active env(safe-area-inset-*) sur iPhone avec encoche/Dynamic Island
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        {/* ── Resource hints ─────────────────────────────────────────────────
            preconnect  = ouvre la connexion TCP+TLS à l'avance (critique path)
            dns-prefetch = résolution DNS seulement (fallback navigateurs anciens)
        ──────────────────────────────────────────────────────────────────── */}
        {/* Supabase : API + Storage (connexion dès la 1re requête auth) */}
        <link rel="preconnect" href="https://qathchrashvfnugfdadc.supabase.co" />
        <link rel="dns-prefetch" href="https://qathchrashvfnugfdadc.supabase.co" />
        {/* Stripe — chargé sur les pages de paiement */}
        <link rel="preconnect" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        {/* Plausible Analytics */}
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <link rel="dns-prefetch" href="https://plausible.io" />
        )}

        <OrganizationJsonLd />
        <WebSiteJsonLd />
      </head>
      {/* inter.variable expose --font-inter comme fallback ; pas de inter.className
          pour que -apple-system (SF Pro sur macOS) soit utilisé en priorité */}
      <body className={inter.variable}>
        <ServiceWorkerRegistration />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#FFFFFF',
              border: '1px solid #E8E8ED',
              color: '#1D1D1F',
              borderRadius: '12px',
              fontSize: '14px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", system-ui, sans-serif',
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
