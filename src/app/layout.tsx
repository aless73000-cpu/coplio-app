import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Coplio — Gestion de copropriété simplifiée',
    template: '%s | Coplio',
  },
  description:
    'Le logiciel de gestion de copropriété pour syndics indépendants. Portail copropriétaire inclus, AG en ligne, suivi sinistres et bien plus.',
  keywords: ['syndic', 'copropriété', 'gestion immobilière', 'logiciel syndic'],
  authors: [{ name: 'Coplio' }],
  creator: 'Coplio',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.coplio.fr'),
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://coplio.fr',
    siteName: 'Coplio',
    title: 'Coplio — Gestion de copropriété simplifiée',
    description: 'Le logiciel de gestion de copropriété pour syndics indépendants.',
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
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
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
      </body>
    </html>
  )
}
