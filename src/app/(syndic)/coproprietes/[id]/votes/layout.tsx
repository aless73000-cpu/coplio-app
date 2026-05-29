import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Votes copropriété' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
