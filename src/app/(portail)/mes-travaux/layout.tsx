import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Travaux & sinistres' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
