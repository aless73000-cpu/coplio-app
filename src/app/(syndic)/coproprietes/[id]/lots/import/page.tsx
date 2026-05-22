'use client'

import { useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Upload, FileSpreadsheet, Download,
  CheckCircle2, AlertCircle, Loader2, X, Info,
} from 'lucide-react'

export default function ImportLotsPage() {
  const router = useRouter()
  const { id: coproprieteId } = useParams<{ id: string }>()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [result, setResult] = useState<{ lots_created: number; errors: string[] } | null>(null)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv'))) {
      setFile(f)
    }
  }

  async function handleSubmit() {
    if (!file) return
    setLoading(true)
    setServerError('')
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('copropriete_id', coproprieteId)

    const res = await fetch('/api/lots/import', { method: 'POST', body: formData })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setServerError(data.error ?? "Erreur lors de l'import")
    } else {
      setResult(data)
    }
  }

  const inputClass = `w-full px-3 py-2.5 text-sm bg-white border border-border rounded-lg
    focus:outline-none focus:ring-2 focus:ring-coplio-green focus:border-transparent
    placeholder:text-gray-400 transition-shadow`

  if (result) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
        <div className="coplio-card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-coplio-green-light rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-coplio-green" />
            </div>
            <div>
              <p className="font-semibold text-coplio-text">Import terminé</p>
              <p className="text-sm text-muted-foreground">Lots ajoutés à la copropriété</p>
            </div>
          </div>
          <div className="bg-coplio-green-light rounded-xl p-6 text-center">
            <p className="text-4xl font-bold text-coplio-green">{result.lots_created}</p>
            <p className="text-sm text-coplio-green/80 mt-1">Lot{result.lots_created > 1 ? 's' : ''} créé{result.lots_created > 1 ? 's' : ''}</p>
          </div>
          {result.errors.length > 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-700 mb-2">Avertissements</p>
              <ul className="space-y-1">
                {result.errors.map((e, i) => (
                  <li key={i} className="text-xs text-amber-600">· {e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setResult(null); setFile(null) }}
            className="flex-1 bg-coplio-bg text-coplio-text font-medium py-2.5 px-4 rounded-lg hover:bg-border transition-colors text-sm"
          >
            Nouvel import
          </button>
          <button
            onClick={() => router.push(`/coproprietes/${coproprieteId}/lots`)}
            className="flex-1 bg-coplio-green text-white font-medium py-2.5 px-4 rounded-lg hover:bg-coplio-green/90 transition-colors text-sm"
          >
            Voir les lots
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/coproprietes/${coproprieteId}/lots`}
          className="text-muted-foreground hover:text-coplio-text transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Importer des lots</h1>
          <p className="text-muted-foreground text-sm">Depuis un fichier Excel ou CSV</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Template download */}
        <div className="coplio-card bg-coplio-blue-bg border-coplio-blue/20">
          <div className="flex items-start gap-3">
            <FileSpreadsheet className="w-5 h-5 text-coplio-blue flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-coplio-text text-sm">Télécharger le modèle Excel</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Colonnes : <strong>numero</strong>, type, etage, surface_m2, <strong>tantiemes</strong>, batiment, commentaires
              </p>
            </div>
            <a
              href="/api/lots/template"
              download
              className="flex items-center gap-1.5 text-sm font-medium text-coplio-blue hover:text-coplio-blue/80 transition-colors flex-shrink-0"
            >
              <Download className="w-4 h-4" />
              Télécharger
            </a>
          </div>
        </div>

        {/* Instructions */}
        <div className="coplio-card bg-amber-50 border-amber-200">
          <div className="flex gap-2.5">
            <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-700 space-y-1">
              <p className="font-medium">Champs obligatoires : <code>numero</code> et <code>tantiemes</code></p>
              <p>Type accepté : <code>appartement</code> · <code>maison</code> · <code>local_commercial</code> · <code>parking</code> · <code>cave</code> · <code>autre</code></p>
              <p>Les lots déjà existants (même numéro) seront ignorés automatiquement.</p>
            </div>
          </div>
        </div>

        <div className="coplio-card space-y-4">
          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {serverError}
            </div>
          )}

          {/* Drop zone */}
          <div>
            <label className="block text-sm font-medium text-coplio-text mb-1.5">Fichier Excel *</label>
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                isDragging
                  ? 'border-coplio-green bg-coplio-green-light'
                  : file
                  ? 'border-coplio-green/50 bg-coplio-green-light/40'
                  : 'border-border hover:border-coplio-green/50 hover:bg-coplio-bg'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f) }}
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-coplio-green" />
                  <div className="text-left">
                    <p className="font-medium text-coplio-text text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} Ko</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null) }}
                    className="ml-2 p-1 rounded-full hover:bg-border transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium text-coplio-text">Glissez-déposez votre fichier ici</p>
                  <p className="text-xs text-muted-foreground mt-0.5">ou cliquez pour sélectionner (.xlsx, .xls)</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/coproprietes/${coproprieteId}/lots`}
            className="flex-1 text-center bg-coplio-bg text-coplio-text font-medium py-2.5 px-4 rounded-lg hover:bg-border transition-colors text-sm"
          >
            Annuler
          </Link>
          <button
            onClick={handleSubmit}
            disabled={!file || loading}
            className="flex-1 bg-coplio-green text-white font-medium py-2.5 px-4 rounded-lg hover:bg-coplio-green/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Import en cours...</>
            ) : (
              <><Upload className="w-4 h-4" /> Importer</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
