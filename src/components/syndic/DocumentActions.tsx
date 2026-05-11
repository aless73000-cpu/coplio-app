'use client'

import { useState } from 'react'
import { Eye, Download, Loader2 } from 'lucide-react'

const PREVIEWABLE = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']

export function DocumentActions({ documentId, typeMime }: { documentId: string; typeMime?: string }) {
  const [loading, setLoading] = useState<'preview' | 'download' | null>(null)

  async function getUrl() {
    const res = await fetch(`/api/documents/${documentId}/url`)
    if (!res.ok) { alert('Erreur lors de la récupération du document.'); return null }
    return res.json() as Promise<{ url: string; nom: string; type_mime: string }>
  }

  async function handlePreview() {
    setLoading('preview')
    const data = await getUrl()
    setLoading(null)
    if (!data) return
    window.open(data.url, '_blank')
  }

  async function handleDownload() {
    setLoading('download')
    const data = await getUrl()
    setLoading(null)
    if (!data) return
    const a = document.createElement('a')
    a.href = data.url
    a.download = data.nom
    a.click()
  }

  const canPreview = !typeMime || PREVIEWABLE.includes(typeMime)

  return (
    <div className="flex items-center gap-1">
      {canPreview && (
        <button
          onClick={handlePreview}
          disabled={loading !== null}
          className="p-1.5 rounded-md hover:bg-coplio-green-light text-muted-foreground hover:text-coplio-green transition-colors disabled:opacity-50"
          title="Aperçu"
        >
          {loading === 'preview' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
      <button
        onClick={handleDownload}
        disabled={loading !== null}
        className="p-1.5 rounded-md hover:bg-coplio-green-light text-muted-foreground hover:text-coplio-green transition-colors disabled:opacity-50"
        title="Télécharger"
      >
        {loading === 'download' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      </button>
    </div>
  )
}
