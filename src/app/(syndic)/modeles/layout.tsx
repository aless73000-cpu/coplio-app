import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Modèles de documents' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
