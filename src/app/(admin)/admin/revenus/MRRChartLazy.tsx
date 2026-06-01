'use client'

import dynamic from 'next/dynamic'

// ssr: false autorisé ici car ce wrapper est un Client Component (Next 15)
const MRRChart = dynamic(() => import('./MRRChart').then(m => m.MRRChart), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-muted rounded-xl" />,
})

export function MRRChartLazy({ data }: { data: { month: string; mrr: number }[] }) {
  return <MRRChart data={data} />
}
