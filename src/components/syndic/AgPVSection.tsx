'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Upload, Loader2, Trash2, ExternalLink, PenLine } from 'lucide-react'

interface Props {
  agId: string
  pvNom: string | null
  pvUrl: string | null
}

export function AgPVSection({ agId, pvNom, pvUrl }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState('')
  const [manualMode, setManualMode] = useState(false)
  const [pvText, setPvText] = useState('')
  const [saving, setSaving] = useState(false)

  // Rédaction manuelle : on génère un PDF du texte tapé puis on l'upload (même route)
  async function saveManual() {
    if (!pvText.trim()) return
    setSaving(true)
    setError('')
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      doc.setFontSize(11)
      const lines = doc.splitTextToSize(pvText, 180)
      let y = 20
      for (const line of lines) {
        if (y > 280) { doc.addPage(); y = 20 }
        doc.text(line, 15, y)
        y += 6
      }
      const blob = doc.output('blob')
      const file = new File([blob], 'PV.pdf', { type: 'application/pdf' })
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/assemblees/${agId}/pv`, { method: 'POST', body: fd })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Erreur enregistrement')
        return
      }
      setManualMode(false)
      setPvText('')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/assemblees/${agId}/pv`, { method: 'POST', body: fd })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Erreur upload')
        return
      }
      router.refresh()
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleRemove() {
    setRemoving(true)
    try {
      await fetch(`/api/assemblees/${agId}/pv`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">Procès-verbal (PV)</p>

      {pvUrl && pvNom ? (
        <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-xl border border-[#374151]/20">
          <FileText className="w-4 h-4 text-[#374151] flex-shrink-0" />
          <span className="text-sm font-medium text-coplio-text truncate flex-1">{pvNom}</span>
          <a
            href={pvUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#374151] hover:text-[#374151]/80"
            title="Ouvrir"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={handleRemove}
            disabled={removing}
            className="text-muted-foreground hover:text-coplio-red transition-colors"
            title="Supprimer"
            aria-label="Supprimer le PV"
          >
            {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      ) : manualMode ? (
        <div className="space-y-2">
          <textarea
            value={pvText}
            onChange={e => setPvText(e.target.value)}
            rows={10}
            placeholder="Rédigez ici le procès-verbal de l'assemblée…"
            className="w-full px-3 py-2.5 text-sm bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#374151]/20 focus:border-[#374151] transition-all resize-y"
          />
          <div className="flex gap-2">
            <button
              onClick={saveManual}
              disabled={saving || !pvText.trim()}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#374151] text-white rounded-lg hover:bg-[#374151]/90 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PenLine className="w-3.5 h-3.5" />}
              Enregistrer le PV
            </button>
            <button
              onClick={() => { setManualMode(false); setPvText('') }}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-coplio-text transition-colors"
            >
              Annuler
            </button>
          </div>
          {error && <p className="text-xs text-coplio-red">{error}</p>}
        </div>
      ) : (
        <div className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={handleUpload}
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center justify-center gap-2 px-3 py-2.5 border border-dashed border-border rounded-xl text-xs text-muted-foreground hover:border-[#374151] hover:text-[#374151] transition-colors disabled:opacity-60"
            >
              {uploading
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Upload…</>
                : <><Upload className="w-3.5 h-3.5" /> Charger un fichier</>
              }
            </button>
            <button
              onClick={() => setManualMode(true)}
              className="flex items-center justify-center gap-2 px-3 py-2.5 border border-dashed border-border rounded-xl text-xs text-muted-foreground hover:border-[#374151] hover:text-[#374151] transition-colors"
            >
              <PenLine className="w-3.5 h-3.5" /> Rédiger à la main
            </button>
          </div>
          {error && <p className="text-xs text-coplio-red">{error}</p>}
        </div>
      )}
    </div>
  )
}
