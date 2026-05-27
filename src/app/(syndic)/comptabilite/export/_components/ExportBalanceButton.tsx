'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

interface Props {
  coproprieteId: string
  exerciceId: string
  annee: number
  copropNom: string
}

export function ExportBalanceButton({ coproprieteId, exerciceId, annee, copropNom }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/comptabilite/export-balance?copropriete=${coproprieteId}&exercice=${exerciceId}`
      )
      if (!res.ok) throw new Error('Erreur export balance')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const nom = copropNom.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20)
      a.download = `Balance_${nom}_${annee}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-border text-coplio-text rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
      Exercice {annee}
    </button>
  )
}
