'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Copy, Download, X, Check, RefreshCw, AlertTriangle } from 'lucide-react'

interface Props {
  agId: string
}

export function AgIAPVButton({ agId }: Props) {
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/assemblees/${agId}/ia-pv`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setContent(data.content)
      } else {
        setError(data.error ?? 'Erreur lors de la génération')
      }
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  async function copyToClipboard() {
    if (!content) return
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadTxt() {
    if (!content) return
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pv-ag-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      {error && (
        <p className="text-xs text-coplio-red mt-2 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> {error}
        </p>
      )}
      <button
        onClick={generate}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 w-full justify-center mt-3"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Génération en cours…</>
          : <><Sparkles className="w-4 h-4" /> Générer le PV avec l&apos;IA</>
        }
      </button>

      {content && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setContent(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-slate-700" />
                <h2 className="font-semibold text-coplio-text">PV généré par l&apos;IA</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={generate}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 border border-border rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="w-3 h-3" />
                  Régénérer
                </button>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  {copied
                    ? <><Check className="w-3 h-3 text-green-600" /> Copié !</>
                    : <><Copy className="w-3 h-3" /> Copier</>
                  }
                </button>
                <button
                  onClick={downloadTxt}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  .txt
                </button>
                <button
                  onClick={() => setContent(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="bg-slate-50 rounded-xl p-5 border border-border">
                <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                  {content}
                </pre>
              </div>
              <p className="text-xs text-muted-foreground mt-3 flex items-start gap-1.5">
                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5 text-amber-500" />
                Brouillon généré par l&apos;IA — vérifiez et complétez les informations entre crochets avant toute utilisation officielle.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
