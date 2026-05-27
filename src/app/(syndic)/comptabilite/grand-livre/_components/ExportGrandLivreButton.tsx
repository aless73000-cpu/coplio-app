'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

interface Props {
  coproprieteId: string
  exerciceId: string
  compteNumero: string
  compteLibelle: string
}

export function ExportGrandLivreButton({ coproprieteId, exerciceId, compteNumero, compteLibelle }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/comptabilite/export-grand-livre?copropriete=${coproprieteId}&exercice=${exerciceId}&compte_numero=${encodeURIComponent(compteNumero)}`
      )
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `GrandLivre_${compteNumero}_${exerciceId.slice(0, 8)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 btn-secondary text-xs flex-shrink-0"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
      Exporter
    </button>
  )
}
