'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import type { AgStatus } from '@/types'

const TRANSITIONS: Record<AgStatus, { label: string; next: AgStatus; color: string }[]> = {
  planifiee: [
    { label: '→ Convocations envoyées', next: 'convocations_envoyees', color: 'text-coplio-amber bg-coplio-amber-bg hover:bg-coplio-amber/20' },
    { label: '→ Annuler', next: 'annulee', color: 'text-coplio-red bg-red-50 hover:bg-red-100' },
  ],
  convocations_envoyees: [
    { label: '→ En cours', next: 'en_cours', color: 'text-purple-700 bg-purple-50 hover:bg-purple-100' },
    { label: '→ Annuler', next: 'annulee', color: 'text-coplio-red bg-red-50 hover:bg-red-100' },
  ],
  en_cours: [
    { label: '→ Terminée', next: 'terminee', color: 'text-[#111827] bg-slate-100 hover:bg-[#111827]/20' },
    { label: '→ Annuler', next: 'annulee', color: 'text-coplio-red bg-red-50 hover:bg-red-100' },
  ],
  terminee: [],
  annulee: [],
}

interface Props {
  agId: string
  status: AgStatus
}

export function AgStatutButtons({ agId, status }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<AgStatus | null>(null)
  const transitions = TRANSITIONS[status] ?? []

  if (transitions.length === 0) return null

  async function handleTransition(next: AgStatus) {
    setLoading(next)
    try {
      const res = await fetch(`/api/assemblees/${agId}/statut`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Changer le statut</p>
      <div className="flex flex-col gap-1.5">
        {transitions.map(({ label, next, color }) => (
          <button
            key={next}
            onClick={() => handleTransition(next)}
            disabled={loading !== null}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-60 ${color}`}
          >
            {loading === next ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
