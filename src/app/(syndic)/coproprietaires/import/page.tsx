'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ImportDossierPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [coproprietes, setCoproprietes] = useState<{ id: string; nom: string }[]>([])
  const [coproprieteId, setCoproprieteId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    lots_created: number
    copros_created: number
    errors: string[]
  } | null>(null)
  const [serverError, setServerError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('coproprietes').select('id, nom').order('nom').then(({ data }) => {
      if (data) setCoproprietes(data)
    })
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) {
      setFile(f)
    }
  }

  async function handleSubmit() {
    if (!file || !coproprieteId) return
    setLoading(true)
    setServerError('')
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('copropriete_id', coproprieteId)

    const res = await fetch('/api/import/dossier', {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setServerError(data.error || 'Erreur lors de l\'import')
    } else {
      setResult(data)
    }
  }

  const inputClass = `w-full px-3 py-2.5 text-sm bg-white border border-border rounded-lg
    focus:outline-none focus:ring-2 focus:ring-[#111827]/20 focus:border-transparent
    placeholder:text-gray-400 transition-shadow`

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/coproprietaires" className="text-muted-foreground hover:text-coplio-text transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Importer un dossier</h1>
          <p className="text-muted-foreground text-sm">Lots et copropriétaires depuis un fichier Excel</p>
        </div>
      </div>

      {result ? (
        /* ─── Résultat ─── */
        <div className="space-y-4">
          <div className="coplio-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#111827]" />
              </div>
              <div>
                <p className="font-semibold text-coplio-text">Import terminé</p>
                <p className="text-sm text-muted-foreground">Données ajoutées avec succès</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-100 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-[#111827]">{result.lots_created}</p>
                <p className="text-sm text-[#111827]/80 mt-0.5">Lots créés</p>
              </div>
              <div className="bg-coplio-blue-bg rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-coplio-blue">{result.copros_created}</p>
                <p className="text-sm text-coplio-blue/80 mt-0.5">Copropriétaires créés</p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm font-medium text-amber-700 mb-1">Avertissements</p>
                <ul className="space-y-0.5">
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
              onClick={() => router.push('/coproprietaires')}
              className="flex-1 bg-[#111827] text-white font-medium py-2.5 px-4 rounded-lg hover:bg-[#111827]/90 transition-colors text-sm"
            >
              Voir les copropriétaires
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Template download */}
          <div className="coplio-card bg-coplio-blue-bg border-coplio-blue/20">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="w-5 h-5 text-coplio-blue flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-coplio-text text-sm">Télécharger le modèle Excel</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  2 feuilles : <strong>Lots</strong> (numero, type, etage, surface_m2, tantiemes) et <strong>Copropriétaires</strong> (prenom, nom, email, telephone, adresse, lots)
                </p>
              </div>
              <a
                href="/api/import/template"
                download
                className="flex items-center gap-1.5 text-sm font-medium text-coplio-blue hover:text-coplio-blue/80 transition-colors flex-shrink-0"
              >
                <Download className="w-4 h-4" />
                Télécharger
              </a>
            </div>
          </div>

          <div className="coplio-card space-y-4">
            {serverError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {serverError}
              </div>
            )}

            {/* Copropriété */}
            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">
                Copropriété *
              </label>
              <select
                value={coproprieteId}
                onChange={(e) => setCoproprieteId(e.target.value)}
                className={inputClass}
              >
                <option value="">Sélectionner une copropriété</option>
                {coproprietes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            </div>

            {/* Drop zone */}
            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">
                Fichier Excel *
              </label>
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                  isDragging
                    ? 'border-[#111827] bg-slate-100'
                    : file
                    ? 'border-[#111827]/50 bg-slate-100/40'
                    : 'border-border hover:border-[#111827]/50 hover:bg-coplio-bg'
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) setFile(f)
                  }}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileSpreadsheet className="w-8 h-8 text-[#111827]" />
                    <div className="text-left">
                      <p className="font-medium text-coplio-text text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} Ko
                      </p>
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
                    <p className="text-sm font-medium text-coplio-text">
                      Glissez-déposez votre fichier ici
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ou cliquez pour sélectionner (.xlsx, .xls)
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/coproprietaires"
              className="flex-1 text-center bg-coplio-bg text-coplio-text font-medium py-2.5 px-4 rounded-lg hover:bg-border transition-colors text-sm"
            >
              Annuler
            </Link>
            <button
              onClick={handleSubmit}
              disabled={!file || !coproprieteId || loading}
              className="flex-1 bg-[#111827] text-white font-medium py-2.5 px-4 rounded-lg hover:bg-[#111827]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Import en cours...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Importer
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
