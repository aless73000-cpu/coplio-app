import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Signaler un problème' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
