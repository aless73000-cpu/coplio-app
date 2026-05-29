import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Clés de répartition' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
