import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Clés de répartition | Coplio' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
