'use client'

import { useState, useRef, useEffect } from 'react'
import { Download, Loader2, ChevronDown } from 'lucide-react'

type Format = 'txt' | 'csv' | 'xlsx'
const LABELS: Record<Format, string> = { txt: 'Texte (.txt)', csv: 'CSV (.csv)', xlsx: 'Excel (.xlsx)' }

interface Props {
  endpoint: string
  coproprieteId: string
  exerciceId: string
  formats: Format[]
  filenamePrefix: string
  annee: number
  label?: string
}

/** Bouton d'export compact avec menu déroulant de choix du format. */
export function ExportButton({ endpoint, coproprieteId, exerciceId, formats, filenamePrefix, annee, label = 'Exporter' }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function download(format: Format) {
    setOpen(false)
    setLoading(true)
    try {
      const res = await fetch(`${endpoint}?copropriete=${coproprieteId}&exercice=${exerciceId}&format=${format}`)
      if (!res.ok) throw new Error('Erreur export')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filenamePrefix}_${annee}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Un seul format → bouton direct
  if (formats.length === 1) {
    return (
      <button
        onClick={() => download(formats[0])}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#374151] text-white rounded-lg hover:bg-[#374151]/90 disabled:opacity-50 transition-colors"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
        {label}
      </button>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#374151] text-white rounded-lg hover:bg-[#374151]/90 disabled:opacity-50 transition-colors"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
        {label}
        <ChevronDown className="w-3.5 h-3.5 opacity-70" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white border border-border rounded-xl shadow-lg z-20 overflow-hidden">
          <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Format</p>
          {formats.map((f) => (
            <button
              key={f}
              onClick={() => download(f)}
              className="w-full text-left px-3 py-2 text-sm text-coplio-text hover:bg-slate-50 transition-colors"
            >
              {LABELS[f]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
