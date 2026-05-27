'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

interface Props {
  coproprieteId: string
  exerciceId: string
  annee: number
  copropNom: string
}

export function ExportFecButton({ coproprieteId, exerciceId, annee, copropNom }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/comptabilite/export-fec?copropriete=${coproprieteId}&exercice=${exerciceId}`
      )
      if (!res.ok) throw new Error('Erreur export FEC')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      // Nom fichier: FEC_<SIREN>_<YYYYMMDD>.txt — ici on utilise le nom de la coprop
      const nom = copropNom.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20)
      a.download = `FEC_${nom}_${annee}.txt`
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
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#374151] text-white rounded-lg hover:bg-[#374151]/90 disabled:opacity-50 transition-colors"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
      Exercice {annee}
    </button>
  )
}
