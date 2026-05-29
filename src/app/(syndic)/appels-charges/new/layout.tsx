import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Nouvel appel de charges | Coplio' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
