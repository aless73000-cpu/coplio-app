'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Upload, Loader2, Trash2, ExternalLink } from 'lucide-react'

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
      ) : (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 w-full px-3 py-2.5 border border-dashed border-border rounded-xl text-xs text-muted-foreground hover:border-[#374151] hover:text-[#374151] transition-colors disabled:opacity-60"
          >
            {uploading
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Upload en cours…</>
              : <><Upload className="w-3.5 h-3.5" /> Charger le PV (PDF, Word)</>
            }
          </button>
          {error && <p className="mt-1 text-xs text-coplio-red">{error}</p>}
        </div>
      )}
    </div>
  )
}
