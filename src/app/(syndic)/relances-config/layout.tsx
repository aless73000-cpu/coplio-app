import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Configuration relances' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
