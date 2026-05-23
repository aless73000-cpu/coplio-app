'use client'

import { useState, useRef } from 'react'
import { FileSearch, Upload, Copy, Download, Loader2, CheckCircle2 } from 'lucide-react'

const TYPE_DOC = [
  { value: 'reglement', label: 'Règlement de copropriété' },
  { value: 'contrat',   label: 'Contrat prestataire' },
  { value: 'devis',     label: 'Devis de travaux' },
  { value: 'autre',     label: 'Autre document' },
]

export function IaAnalyse() {
  const [file,      setFile]      = useState<File | null>(null)
  const [typeDoc,   setTypeDoc]   = useState('reglement')
  const [analysing, setAnalysing] = useState(false)
  const [analyse,   setAnalyse]   = useState('')
  const [copied,    setCopied]    = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleAnalyse() {
    if (!file) return
    setAnalysing(true); setAnalyse('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('type', typeDoc)
      const res = await fetch('/api/ia/analyser', { method: 'POST', body: fd })
      const data = await res.json()
      setAnalyse(data.analyse ?? data.error ?? 'Erreur inattendue')
    } catch {
      setAnalyse('Erreur de connexion au serveur IA.')
    } finally {
      setAnalysing(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(analyse)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const blob = new Blob([analyse], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `analyse_${Date.now()}.txt`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid grid-cols-5 gap-6">
      {/* Panneau gauche */}
      <div className="col-span-2 space-y-4">
        <div className="coplio-card">
          <p className="text-sm font-semibold text-coplio-text mb-3">Type de document</p>
          <div className="space-y-2">
            {TYPE_DOC.map(t => (
              <button
                key={t.value}
                onClick={() => setTypeDoc(t.value)}
                className={`w-full text-left px-3 py-2.5 rounded-xl border-2 transition-all text-sm font-medium ${
                  typeDoc === t.value
                    ? 'border-coplio-green bg-coplio-green-light text-coplio-green'
                    : 'border-border text-coplio-text hover:border-coplio-green/30'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="coplio-card">
          <p className="text-sm font-semibold text-coplio-text mb-3">Fichier PDF</p>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-border rounded-xl py-8 text-center hover:border-coplio-green transition-colors group"
          >
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2 group-hover:text-coplio-green transition-colors" />
            <p className="text-sm text-muted-foreground group-hover:text-coplio-text">
              {file ? file.name : 'Cliquez pour uploader un PDF'}
            </p>
            {file && <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(0)} KB</p>}
          </button>
          {file && (
            <button onClick={() => setFile(null)} className="text-xs text-coplio-red mt-2 hover:underline">
              Supprimer
            </button>
          )}
        </div>

        <button
          onClick={handleAnalyse}
          disabled={analysing || !file}
          className="w-full flex items-center justify-center gap-2 bg-coplio-green text-white font-medium py-3 rounded-xl hover:bg-coplio-green/90 transition-colors disabled:opacity-60"
        >
          {analysing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSearch className="w-4 h-4" />}
          {analysing ? 'Analyse en cours...' : 'Analyser le document'}
        </button>
      </div>

      {/* Panneau droit */}
      <div className="col-span-3">
        <div className="coplio-card h-full flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-coplio-text">Résultat de l&apos;analyse</p>
            {analyse && (
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-coplio-text px-2.5 py-1.5 rounded-lg border border-border transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-coplio-green" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copié' : 'Copier'}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-coplio-text px-2.5 py-1.5 rounded-lg border border-border transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Télécharger
                </button>
              </div>
            )}
          </div>

          {analysing ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-coplio-green mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">L&apos;IA analyse votre document...</p>
              </div>
            </div>
          ) : analyse ? (
            <div className="flex-1 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-coplio-text">{analyse}</pre>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <FileSearch className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Uploadez un PDF et cliquez<br />sur &quot;Analyser&quot;</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
