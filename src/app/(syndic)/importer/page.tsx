'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Upload, FileSpreadsheet, Download, CheckCircle2, AlertTriangle,
  Loader2, ChevronDown, X, ArrowRight, Building2, Layers, Users,
} from 'lucide-react'

interface Copropriete {
  id: string
  nom: string
  ville?: string
}

interface ImportResult {
  lots_created: number
  copros_created: number
  errors: string[]
}

export default function ImporterPage() {
  const [coproprietes, setCoproprietes] = useState<Copropriete[]>([])
  const [selectedCopro, setSelectedCopro] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('coproprietes').select('id, nom, ville').order('nom').then(({ data }) => {
      if (data) setCoproprietes(data as Copropriete[])
    })
  }, [])

  const handleFile = useCallback((f: File) => {
    if (!f.name.endsWith('.xlsx') && !f.name.endsWith('.xls')) {
      alert('Format non supporté. Veuillez utiliser le fichier Excel (.xlsx) téléchargé depuis le modèle.')
      return
    }
    setFile(f)
    setResult(null)
  }, [])

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  async function handleImport() {
    if (!file || !selectedCopro) return
    setLoading(true)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('copropriete_id', selectedCopro)
      const res = await fetch('/api/import/dossier', { method: 'POST', body: formData })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ lots_created: 0, copros_created: 0, errors: ['Erreur réseau'] })
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setFile(null)
    setResult(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const totalSuccess = (result?.lots_created ?? 0) + (result?.copros_created ?? 0)

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-coplio-text">Import Excel</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Importez lots et copropriétaires en une seule fois depuis un fichier Excel
        </p>
      </div>

      {/* Schéma visuel */}
      <div className="coplio-card bg-slate-100 border-[#374151]/20 flex items-center gap-4 p-5">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-[#374151]/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-[#374151]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#374151]">1 fichier Excel, 2 feuilles</p>
            <p className="text-xs text-[#374151]/70 mt-0.5">Feuille "Lots" + feuille "Copropriétaires"</p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-[#374151]/40 flex-shrink-0" />
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-[#374151]/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-[#374151]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#374151]">Tout est créé et lié</p>
            <p className="text-xs text-[#374151]/70 mt-0.5">Lots créés, copros enregistrés, lots assignés</p>
          </div>
        </div>
      </div>

      {/* Step 1 — Template */}
      <div className="coplio-card space-y-4">
        <h2 className="font-semibold text-coplio-text flex items-center gap-2">
          <span className="w-6 h-6 bg-[#374151] text-white rounded-full text-xs flex items-center justify-center font-bold">1</span>
          Téléchargez et remplissez le modèle
        </h2>
        <div className="flex items-center justify-between p-4 bg-coplio-bg rounded-xl border border-border">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-coplio-text">
              <Layers className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Feuille "Lots"</span>
              <span className="text-muted-foreground">— numero, type, etage, surface_m2, tantiemes</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-coplio-text">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Feuille "Copropriétaires"</span>
              <span className="text-muted-foreground">— prenom, nom, email, telephone, lots</span>
            </div>
          </div>
          <a
            href="/api/import/template"
            download="modele_coplio.xlsx"
            className="flex items-center gap-1.5 text-sm font-medium text-[#374151] hover:text-[#374151]/80 transition-colors flex-shrink-0 ml-4"
          >
            <Download className="w-4 h-4" />
            Télécharger le modèle
          </a>
        </div>
        <p className="text-xs text-muted-foreground">
          💡 Dans la colonne "lots", indiquez le numéro de lot. Pour plusieurs lots, séparez par un espace : <code className="bg-coplio-bg px-1.5 py-0.5 rounded text-coplio-text">A01 P01</code>
        </p>
      </div>

      {/* Step 2 — Copropriété */}
      <div className="coplio-card space-y-4">
        <h2 className="font-semibold text-coplio-text flex items-center gap-2">
          <span className="w-6 h-6 bg-[#374151] text-white rounded-full text-xs flex items-center justify-center font-bold">2</span>
          Sélectionnez la copropriété cible
        </h2>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <select
            value={selectedCopro}
            onChange={(e) => setSelectedCopro(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 text-sm bg-white border border-border rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-[#374151]/20"
          >
            <option value="">Sélectionner une copropriété…</option>
            {coproprietes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}{c.ville ? ` — ${c.ville}` : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Step 3 — Upload */}
      <div className="coplio-card space-y-4">
        <h2 className="font-semibold text-coplio-text flex items-center gap-2">
          <span className="w-6 h-6 bg-[#374151] text-white rounded-full text-xs flex items-center justify-center font-bold">3</span>
          Déposez votre fichier Excel
        </h2>

        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-[#374151] bg-slate-100'
                : 'border-border hover:border-[#374151]/50 hover:bg-coplio-bg'
            }`}
          >
            <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-coplio-text mb-1">Glisser-déposer votre fichier Excel</p>
            <p className="text-sm text-muted-foreground mb-4">ou cliquer pour parcourir</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#374151] text-white rounded-lg text-sm font-medium">
              <Upload className="w-4 h-4" />
              Choisir un fichier .xlsx
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFileChange} />
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-slate-100 rounded-xl">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-[#374151]" />
              <div>
                <p className="text-sm font-medium text-coplio-text">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} Ko</p>
              </div>
            </div>
            <button onClick={reset} className="p-1.5 rounded-lg hover:bg-white/50 transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>

      {/* Import button */}
      {file && (
        <button
          onClick={handleImport}
          disabled={loading || !selectedCopro || !file}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#374151] text-white font-semibold rounded-xl hover:bg-[#374151]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Import en cours…</>
          ) : (
            <><ArrowRight className="w-5 h-5" /> Lancer l&apos;import</>
          )}
        </button>
      )}

      {!selectedCopro && file && (
        <p className="text-center text-sm text-coplio-amber font-medium">
          ⚠ Sélectionnez une copropriété à l&apos;étape 2 avant de lancer l&apos;import
        </p>
      )}

      {/* Results */}
      {result && (
        <div className={`coplio-card space-y-4 ${totalSuccess > 0 ? 'border-[#374151]/30' : ''}`}>
          <div className="flex items-center gap-3">
            {totalSuccess > 0
              ? <CheckCircle2 className="w-6 h-6 text-[#374151] flex-shrink-0" />
              : <AlertTriangle className="w-6 h-6 text-coplio-amber flex-shrink-0" />
            }
            <div>
              <p className="font-semibold text-coplio-text">
                {totalSuccess > 0 ? 'Import terminé avec succès' : 'Aucune donnée importée'}
              </p>
              {totalSuccess > 0 && (
                <p className="text-sm text-muted-foreground">
                  {result.lots_created > 0 && `${result.lots_created} lot${result.lots_created > 1 ? 's' : ''} créé${result.lots_created > 1 ? 's' : ''}`}
                  {result.lots_created > 0 && result.copros_created > 0 && ' · '}
                  {result.copros_created > 0 && `${result.copros_created} copropriétaire${result.copros_created > 1 ? 's' : ''} enregistré${result.copros_created > 1 ? 's' : ''}`}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          {totalSuccess > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-coplio-bg rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-[#374151]">{result.lots_created}</p>
                <p className="text-xs text-muted-foreground mt-1">Lots créés</p>
              </div>
              <div className="bg-coplio-bg rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-[#374151]">{result.copros_created}</p>
                <p className="text-xs text-muted-foreground mt-1">Copropriétaires enregistrés</p>
              </div>
            </div>
          )}

          {result.errors.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {result.errors.length} avertissement{result.errors.length > 1 ? 's' : ''}
              </p>
              {result.errors.map((err, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 bg-red-50 rounded-lg">
                  <X className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-red-700">{err}</span>
                </div>
              ))}
            </div>
          )}

          {totalSuccess > 0 && (
            <button onClick={reset} className="text-sm text-[#374151] hover:underline font-medium">
              Faire un autre import
            </button>
          )}
        </div>
      )}
    </div>
  )
}
