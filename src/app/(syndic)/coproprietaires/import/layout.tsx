import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Importer copropriétaires' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
