import type { Metadata } from 'next'

export const metadata: Metadata = { title: "Carnet d'entretien | Coplio" }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
