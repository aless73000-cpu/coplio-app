import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Signatures électroniques | Coplio' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
