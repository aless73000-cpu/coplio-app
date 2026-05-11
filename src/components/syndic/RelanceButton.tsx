'use client'

import { useState } from 'react'
import { Send, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  appelId: string
  nbRelances: number
  onSuccess?: (newNbRelances: number) => void
}

const NIVEAU_LABELS = ['Rappel amiable', 'Deuxième rappel', 'Mise en demeure']
const NIVEAU_COLORS = [
  'text-coplio-amber hover:text-coplio-amber/80',
  'text-orange-600 hover:text-orange-500',
  'text-coplio-red hover:text-coplio-red/80',
]

export function RelanceButton({ appelId, nbRelances, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const niveau = Math.min(nbRelances + 1, 3)
  const label = NIVEAU_LABELS[niveau - 1]
  const colorClass = NIVEAU_COLORS[niveau - 1]

  async function handleRelance() {
    if (loading || done) return
    setLoading(true)
    try {
      const res = await fetch(`/api/impayes/${appelId}/relancer`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Erreur lors de la relance')
      } else {
        setDone(true)
        toast.success(`${label} envoyée`)
        onSuccess?.(nbRelances + 1)
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <span className="flex items-center gap-1 text-xs text-coplio-green font-medium">
        <CheckCircle className="w-3 h-3" /> Envoyée
      </span>
    )
  }

  return (
    <button
      onClick={handleRelance}
      disabled={loading}
      title={label}
      className={`flex items-center gap-1 text-xs font-medium transition-colors disabled:opacity-50 ${colorClass}`}
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
      {loading ? 'Envoi…' : label}
    </button>
  )
}
