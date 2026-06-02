'use client'

import { useState } from 'react'
import { Download, Loader2, AlertCircle } from 'lucide-react'
import type { ReactNode } from 'react'

type Format = 'txt' | 'csv' | 'xlsx'

const FORMAT_LABELS: Record<Format, string> = { txt: 'Texte', csv: 'CSV', xlsx: 'Excel' }

interface Exercice { id: string; annee: number }

interface Props {
  title: string
  description: string
  icon: ReactNode
  iconBg: string
  /** Endpoint sans query, ex: /api/comptabilite/export-fec */
  endpoint: string
  coproprieteId: string
  exercices: Exercice[]
  /** Formats proposés (le 1er est le défaut). */
  formats: Format[]
  /** Préfixe du nom de fichier (l'extension est ajoutée automatiquement). */
  filenamePrefix: string
}

export function ExportSection({
  title, description, icon, iconBg, endpoint, coproprieteId, exercices, formats, filenamePrefix,
}: Props) {
  const [format, setFormat] = useState<Format>(formats[0])
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function download(ex: Exercice) {
    setLoadingId(ex.id)
    try {
      const url = `${endpoint}?copropriete=${coproprieteId}&exercice=${ex.id}&format=${format}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Erreur export')
      const blob = await res.blob()
      const objUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objUrl
      a.download = `${filenamePrefix}_${ex.annee}.${format}`
      a.click()
      URL.revokeObjectURL(objUrl)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="coplio-card">
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-coplio-text">{title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>

          {exercices.length === 0 ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              Aucun exercice disponible pour cette copropriété.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {/* Sélecteur de format */}
              {formats.length > 1 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Format du fichier :</p>
                  <div className="inline-flex p-0.5 bg-slate-100 rounded-lg">
                    {formats.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFormat(f)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          format === f ? 'bg-white text-[#374151] shadow-sm' : 'text-muted-foreground hover:text-coplio-text'
                        }`}
                      >
                        {FORMAT_LABELS[f]}
                        <span className="text-[10px] opacity-60 ml-1">.{f}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Boutons par exercice */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Exercice :</p>
                <div className="flex flex-wrap gap-2">
                  {exercices.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => download(ex)}
                      disabled={loadingId === ex.id}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#374151] text-white rounded-lg hover:bg-[#374151]/90 disabled:opacity-50 transition-colors"
                    >
                      {loadingId === ex.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      {ex.annee} · {format.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
