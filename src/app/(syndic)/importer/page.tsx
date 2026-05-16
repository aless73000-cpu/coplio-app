'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Upload, FileSpreadsheet, Download, CheckCircle2, AlertTriangle,
  Loader2, ChevronDown, X, ArrowRight, Building2,
} from 'lucide-react'
import { useEffect } from 'react'

// ─── CSV Parser ───────────────────────────────────────────────

function parseCSV(text: string): Record<string, string>[] {
  // Handle BOM
  const cleaned = text.replace(/^﻿/, '')
  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []

  // Detect separator: semicolon or comma
  const sep = lines[0].includes(';') ? ';' : ','
  const headers = lines[0].split(sep).map((h) => h.trim().toLowerCase().replace(/[^a-z_]/g, ''))

  return lines.slice(1).map((line) => {
    const values = line.split(sep)
    return Object.fromEntries(headers.map((h, i) => [h, values[i]?.trim() ?? '']))
  })
}

// ─── Types ────────────────────────────────────────────────────

type ImportType = 'lots' | 'coproprietaires'

interface Copropriete {
  id: string
  nom: string
  ville?: string
}

interface ImportResult {
  ok: number
  errors: { row: number; message: string }[]
}

// ─── Templates CSV ────────────────────────────────────────────

const TEMPLATES: Record<ImportType, { headers: string[]; example: string[] }> = {
  lots: {
    headers: ['numero', 'type', 'etage', 'surface', 'tantiemes'],
    example: ['A01', 'appartement', '2', '65', '250'],
  },
  coproprietaires: {
    headers: ['prenom', 'nom', 'email', 'telephone', 'lot_numero'],
    example: ['Marie', 'Dupont', 'marie.dupont@email.fr', '0612345678', 'A01'],
  },
}

function downloadTemplate(type: ImportType) {
  const { headers, example } = TEMPLATES[type]
  const bom = '﻿'
  const csv = bom + headers.join(';') + '\n' + example.join(';')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `modele_import_${type}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Main Page ────────────────────────────────────────────────

export default function ImporterPage() {
  const [importType, setImportType] = useState<ImportType>('lots')
  const [coproprietes, setCoproprietes] = useState<Copropriete[]>([])
  const [selectedCopro, setSelectedCopro] = useState('')
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Load copropriétés
  useEffect(() => {
    const supabase = createClient()
    supabase.from('coproprietes').select('id, nom, ville').order('nom').then(({ data }) => {
      if (data) setCoproprietes(data as unknown as Parameters<typeof setCoproprietes>[0])
    })
  }, [])

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) return
    setFileName(file.name)
    setResult(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const parsed = parseCSV(text)
      setRows(parsed)
    }
    reader.readAsText(file, 'utf-8')
  }, [])

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  async function handleImport() {
    if (!rows.length || !selectedCopro) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/import/${importType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, copropriete_id: selectedCopro }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ ok: 0, errors: [{ row: 0, message: 'Erreur réseau' }] })
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setRows([])
    setFileName('')
    setResult(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const expectedHeaders = TEMPLATES[importType].headers

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-coplio-text">Import CSV</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Importez des lots ou copropriétaires depuis un fichier Excel/CSV
        </p>
      </div>

      {/* Step 1: Type + copropriété */}
      <div className="coplio-card space-y-5">
        <h2 className="font-semibold text-coplio-text flex items-center gap-2">
          <span className="w-6 h-6 bg-coplio-green text-white rounded-full text-xs flex items-center justify-center font-bold">1</span>
          Configuration
        </h2>

        {/* Type d'import */}
        <div>
          <label className="block text-sm font-medium text-coplio-text mb-2">Type d&apos;import</label>
          <div className="grid grid-cols-2 gap-3">
            {([
              { value: 'lots', label: 'Lots', description: 'Numéros, types, tantièmes…' },
              { value: 'coproprietaires', label: 'Copropriétaires', description: 'Noms, emails, lots associés…' },
            ] as const).map(({ value, label, description }) => (
              <button
                key={value}
                onClick={() => { setImportType(value); reset() }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  importType === value
                    ? 'border-coplio-green bg-coplio-green-light'
                    : 'border-border bg-white hover:border-coplio-green/40'
                }`}
              >
                <p className={`font-semibold text-sm ${importType === value ? 'text-coplio-green' : 'text-coplio-text'}`}>
                  {label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Copropriété */}
        <div>
          <label className="block text-sm font-medium text-coplio-text mb-2">
            <Building2 className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
            Copropriété cible
          </label>
          <div className="relative">
            <select
              value={selectedCopro}
              onChange={(e) => setSelectedCopro(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-white border border-border rounded-lg appearance-none
                focus:outline-none focus:ring-2 focus:ring-coplio-green pr-8"
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

        {/* Template download */}
        <div className="flex items-center justify-between p-3 bg-coplio-bg rounded-xl border border-border">
          <div>
            <p className="text-sm font-medium text-coplio-text">Modèle CSV à remplir</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Colonnes : {expectedHeaders.join(', ')}
            </p>
          </div>
          <button
            onClick={() => downloadTemplate(importType)}
            className="flex items-center gap-1.5 text-sm font-medium text-coplio-green hover:underline"
          >
            <Download className="w-4 h-4" />
            Télécharger
          </button>
        </div>
      </div>

      {/* Step 2: Upload */}
      <div className="coplio-card space-y-4">
        <h2 className="font-semibold text-coplio-text flex items-center gap-2">
          <span className="w-6 h-6 bg-coplio-green text-white rounded-full text-xs flex items-center justify-center font-bold">2</span>
          Fichier CSV
        </h2>

        {!rows.length ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-coplio-green bg-coplio-green-light'
                : 'border-border hover:border-coplio-green/50 hover:bg-coplio-bg'
            }`}
          >
            <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-coplio-text mb-1">
              Glisser-déposer votre fichier CSV
            </p>
            <p className="text-sm text-muted-foreground mb-4">ou cliquer pour parcourir</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-coplio-green text-white rounded-lg text-sm font-medium">
              <Upload className="w-4 h-4" />
              Choisir un fichier
            </div>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={onFileChange} />
          </div>
        ) : (
          <div className="space-y-4">
            {/* File info */}
            <div className="flex items-center justify-between p-3 bg-coplio-green-light rounded-xl">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-coplio-green" />
                <div>
                  <p className="text-sm font-medium text-coplio-text">{fileName}</p>
                  <p className="text-xs text-muted-foreground">{rows.length} ligne{rows.length > 1 ? 's' : ''} détectée{rows.length > 1 ? 's' : ''}</p>
                </div>
              </div>
              <button onClick={reset} className="p-1.5 rounded-lg hover:bg-white/50 transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Preview table */}
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-coplio-bg">
                    {Object.keys(rows[0]).map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-coplio-text">
                        {h}
                        {!expectedHeaders.includes(h) && (
                          <span className="ml-1 text-coplio-amber">⚠</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      {Object.values(row).map((v, j) => (
                        <td key={j} className="px-3 py-2 text-muted-foreground">{v || '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 5 && (
                <p className="text-xs text-muted-foreground px-3 py-2 border-t border-border">
                  … et {rows.length - 5} autre{rows.length - 5 > 1 ? 's' : ''} ligne{rows.length - 5 > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Step 3: Import */}
      {rows.length > 0 && (
        <div className="coplio-card space-y-4">
          <h2 className="font-semibold text-coplio-text flex items-center gap-2">
            <span className="w-6 h-6 bg-coplio-green text-white rounded-full text-xs flex items-center justify-center font-bold">3</span>
            Lancer l&apos;import
          </h2>

          {!selectedCopro && (
            <div className="p-3 bg-coplio-amber-bg border border-coplio-amber/20 rounded-xl">
              <p className="text-sm text-coplio-amber font-medium">
                ⚠ Sélectionnez une copropriété cible à l&apos;étape 1
              </p>
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={loading || !selectedCopro}
            className="w-full flex items-center justify-center gap-2 py-3 bg-coplio-green text-white font-medium rounded-xl
              hover:bg-coplio-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Import en cours…</>
            ) : (
              <><ArrowRight className="w-4 h-4" /> Importer {rows.length} ligne{rows.length > 1 ? 's' : ''}</>
            )}
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className={`coplio-card space-y-4 ${result.errors.length === 0 ? 'border-coplio-green/30' : ''}`}>
          <div className="flex items-center gap-3">
            {result.ok > 0 ? (
              <CheckCircle2 className="w-6 h-6 text-coplio-green flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-coplio-amber flex-shrink-0" />
            )}
            <div>
              <p className="font-semibold text-coplio-text">
                {result.ok > 0
                  ? `${result.ok} ligne${result.ok > 1 ? 's' : ''} importée${result.ok > 1 ? 's' : ''} avec succès`
                  : 'Aucune ligne importée'}
              </p>
              {result.errors.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {result.errors.length} erreur{result.errors.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {result.errors.map((err, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 bg-red-50 rounded-lg">
                  <X className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    {err.row > 0 && <span className="font-medium text-red-600 mr-1.5">Ligne {err.row} :</span>}
                    <span className="text-red-700">{err.message}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {result.ok > 0 && (
            <button onClick={reset} className="text-sm text-coplio-green hover:underline font-medium">
              Faire un autre import
            </button>
          )}
        </div>
      )}
    </div>
  )
}
