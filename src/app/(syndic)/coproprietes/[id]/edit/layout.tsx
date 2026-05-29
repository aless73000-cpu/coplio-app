import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Modifier copropriété' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
