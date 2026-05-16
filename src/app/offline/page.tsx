import type { Metadata } from 'next'
import OfflineContent from './OfflineContent'

export const metadata: Metadata = {
  title: 'Hors ligne',
  robots: { index: false, follow: false },
}

export default function OfflinePage() {
  return <OfflineContent />
}
