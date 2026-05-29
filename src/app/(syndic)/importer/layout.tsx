import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Importer des données' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
