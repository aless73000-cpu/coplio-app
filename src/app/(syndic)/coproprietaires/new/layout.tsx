import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Nouveau copropriétaire | Coplio' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
