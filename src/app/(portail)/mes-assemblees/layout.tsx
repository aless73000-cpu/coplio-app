import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mes assemblées' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
