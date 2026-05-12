'use client'

import { useState, useEffect, useRef } from 'react'
import { Sparkles, FileText, Upload, Copy, Download, Loader2, CheckCircle2, FileSearch } from 'lucide-react'

const TEMPLATES = [
  { value: 'convocation_ag', label: 'Convocation AG', desc: 'Lettre de convocation à l\'assemblée générale', icon: '📋' },
  { value: 'pv_ag', label: 'Procès-verbal AG', desc: 'PV d\'assemblée générale', icon: '📝' },
  { value: 'mise_en_demeure', label: 'Mise en demeure', desc: 'Lettre de mise en demeure pour impayé', icon: '⚠️' },
  { value: 'courrier_travaux', label: 'Info travaux', desc: 'Courrier d\'information pour des travaux', icon: '🔧' },
  { value: 'relance_impaye', label: 'Relance impayé', desc: 'Lettre de relance courtoise', icon: '💌' },
]

const TYPE_DOC = [
  { value: 'reglement', label: 'Règlement de copropriété' },
  { value: 'contrat', label: 'Contrat prestataire' },
  { value: 'devis', label: 'Devis de travaux' },
  { value: 'autre', label: 'Autre document' },
]

interface Copropriete { id: string; nom: string }

export default function IAPage() {
  const [tab, setTab] = useState<'rediger' | 'analyser'>('rediger')
  const [coproprietes, setCoproprietes] = useState<Copropriete[]>([])
  const [coproprieteId, setCoproprieteId] = useState('')
  const [template, setTemplate] = useState('convocation_ag')
  const [donnees, setDonnees] = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)

  const [file, setFile] = useState<File | null>(null)
  const [typeDoc, setTypeDoc] = useState('reglement')
  const [analysing, setAnalysing] = useState(false)
  const [analyse, setAnalyse] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/coproprietes').then(r => r.json()).then(d => {
      if (Array.isArray(d)) { setCoproprietes(d); if (d[0]) setCoproprieteId(d[0].id) }
    })
  }, [])

  async function handleGenerate() {
    if (!coproprieteId) return
    setGenerating(true); setResult('')
    const res = await fetch('/api/ia/rediger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template, copropriete_id: coproprieteId, donnees }),
    })
    const data = await res.json()
    setResult(data.texte ?? data.error ?? 'Erreur')
    setGenerating(false)
  }

  async function handleAnalyse() {
    if (!file) return
    setAnalysing(true); setAnalyse('')
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', typeDoc)
    const res = await fetch('/api/ia/analyser', { method: 'POST', body: fd })
    const data = await res.json()
    setAnalyse(data.analyse ?? data.error ?? 'Erreur')
    setAnalysing(false)
  }

  function handleCopy() {
    navigator.clipboard.writeText(result || analyse)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload(text: string, name: string) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = name; a.click()
    URL.revokeObjectURL(url)
  }

  const currentTpl = TEMPLATES.find(t => t.value === template)

  const CHAMPS_EXTRA: Record<string, { key: string; label: string; placeholder: string }[]> = {
    convocation_ag: [
      { key: 'date_ag', label: 'Date AG', placeholder: 'Ex: 15 juin 2026 à 18h00' },
      { key: 'lieu', label: 'Lieu', placeholder: 'Salle des fêtes, 12 rue...' },
    ],
    pv_ag: [
      { key: 'date_ag', label: 'Date AG', placeholder: 'Ex: 15 juin 2026' },
    ],
    mise_en_demeure: [
      { key: 'prenom', label: 'Prénom copropriétaire', placeholder: 'Jean' },
      { key: 'nom', label: 'Nom', placeholder: 'Dupont' },
      { key: 'numero_lot', label: 'N° lot', placeholder: '12' },
      { key: 'montant', label: 'Montant dû (€)', placeholder: '450' },
      { key: 'jours_retard', label: 'Jours de retard', placeholder: '45' },
    ],
    courrier_travaux: [
      { key: 'nature_travaux', label: 'Nature des travaux', placeholder: 'Remplacement toiture' },
      { key: 'prestataire', label: 'Prestataire', placeholder: 'Entreprise Martin' },
      { key: 'date_debut', label: 'Début travaux', placeholder: '1er juillet 2026' },
      { key: 'date_fin', label: 'Fin travaux', placeholder: '15 juillet 2026' },
    ],
    relance_impaye: [
      { key: 'prenom', label: 'Prénom', placeholder: 'Jean' },
      { key: 'nom', label: 'Nom', placeholder: 'Dupont' },
      { key: 'numero_lot', label: 'N° lot', placeholder: '12' },
      { key: 'montant', label: 'Montant (€)', placeholder: '350' },
    ],
  }

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-coplio-text flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-coplio-green" />
          Assistant IA
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">Rédaction automatique et analyse de documents</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-coplio-bg p-1 rounded-xl w-fit">
        <button onClick={() => setTab('rediger')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'rediger' ? 'bg-white text-coplio-text shadow-sm' : 'text-muted-foreground hover:text-coplio-text'}`}>
          <FileText className="w-4 h-4" />Rédaction assistée
        </button>
        <button onClick={() => setTab('analyser')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'analyser' ? 'bg-white text-coplio-text shadow-sm' : 'text-muted-foreground hover:text-coplio-text'}`}>
          <FileSearch className="w-4 h-4" />Analyse de documents
        </button>
      </div>

      {tab === 'rediger' && (
        <div className="grid grid-cols-5 gap-6">
          {/* Panneau gauche */}
          <div className="col-span-2 space-y-4">
            <div className="coplio-card">
              <p className="text-sm font-semibold text-coplio-text mb-3">Type de document</p>
              <div className="space-y-2">
                {TEMPLATES.map(t => (
                  <button key={t.value} onClick={() => { setTemplate(t.value); setDonnees({}) }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border-2 transition-all text-sm ${template === t.value ? 'border-coplio-green bg-coplio-green-light' : 'border-border hover:border-coplio-green/30'}`}>
                    <span className="mr-2">{t.icon}</span>
                    <span className={`font-medium ${template === t.value ? 'text-coplio-green' : 'text-coplio-text'}`}>{t.label}</span>
                    <p className="text-xs text-muted-foreground mt-0.5 ml-6">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="coplio-card">
              <p className="text-sm font-semibold text-coplio-text mb-3">Copropriété</p>
              <select value={coproprieteId} onChange={e => setCoproprieteId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green bg-white">
                {coproprietes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>

            {(CHAMPS_EXTRA[template] ?? []).length > 0 && (
              <div className="coplio-card">
                <p className="text-sm font-semibold text-coplio-text mb-3">Informations complémentaires</p>
                <div className="space-y-3">
                  {(CHAMPS_EXTRA[template] ?? []).map(champ => (
                    <div key={champ.key}>
                      <label className="block text-xs font-medium text-coplio-text mb-1">{champ.label}</label>
                      <input value={donnees[champ.key] ?? ''}
                        onChange={e => setDonnees(prev => ({ ...prev, [champ.key]: e.target.value }))}
                        placeholder={champ.placeholder}
                        className="w-full px-2.5 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-coplio-green" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={handleGenerate} disabled={generating || !coproprieteId}
              className="w-full flex items-center justify-center gap-2 bg-coplio-green text-white font-medium py-3 rounded-xl hover:bg-coplio-green/90 transition-colors disabled:opacity-60">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? 'Génération en cours...' : 'Générer le document'}
            </button>
          </div>

          {/* Résultat */}
          <div className="col-span-3">
            <div className="coplio-card h-full flex flex-col min-h-[500px]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-coplio-text">
                  {result ? currentTpl?.label : 'Document généré'}
                </p>
                {result && (
                  <div className="flex gap-2">
                    <button onClick={handleCopy}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-coplio-text px-2.5 py-1.5 rounded-lg border border-border transition-colors">
                      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-coplio-green" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copié' : 'Copier'}
                    </button>
                    <button onClick={() => handleDownload(result, `${template}_${Date.now()}.txt`)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-coplio-text px-2.5 py-1.5 rounded-lg border border-border transition-colors">
                      <Download className="w-3.5 h-3.5" />Télécharger
                    </button>
                  </div>
                )}
              </div>
              {generating ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-coplio-green mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">L&apos;IA rédige votre document...</p>
                  </div>
                </div>
              ) : result ? (
                <textarea
                  value={result}
                  onChange={e => setResult(e.target.value)}
                  className="flex-1 w-full text-sm text-coplio-text leading-relaxed resize-none focus:outline-none font-mono"
                />
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Sélectionnez un type de document<br />et cliquez sur &quot;Générer&quot;</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'analyser' && (
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-2 space-y-4">
            <div className="coplio-card">
              <p className="text-sm font-semibold text-coplio-text mb-3">Type de document</p>
              <div className="space-y-2">
                {TYPE_DOC.map(t => (
                  <button key={t.value} onClick={() => setTypeDoc(t.value)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border-2 transition-all text-sm font-medium ${typeDoc === t.value ? 'border-coplio-green bg-coplio-green-light text-coplio-green' : 'border-border text-coplio-text hover:border-coplio-green/30'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="coplio-card">
              <p className="text-sm font-semibold text-coplio-text mb-3">Fichier PDF</p>
              <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
              <button onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl py-8 text-center hover:border-coplio-green transition-colors group">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2 group-hover:text-coplio-green transition-colors" />
                <p className="text-sm text-muted-foreground group-hover:text-coplio-text">
                  {file ? file.name : 'Cliquez pour uploader un PDF'}
                </p>
                {file && <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(0)} KB</p>}
              </button>
              {file && <button onClick={() => setFile(null)} className="text-xs text-coplio-red mt-2 hover:underline">Supprimer</button>}
            </div>

            <button onClick={handleAnalyse} disabled={analysing || !file}
              className="w-full flex items-center justify-center gap-2 bg-coplio-green text-white font-medium py-3 rounded-xl hover:bg-coplio-green/90 transition-colors disabled:opacity-60">
              {analysing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSearch className="w-4 h-4" />}
              {analysing ? 'Analyse en cours...' : 'Analyser le document'}
            </button>
          </div>

          <div className="col-span-3">
            <div className="coplio-card h-full flex flex-col min-h-[500px]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-coplio-text">Résultat de l&apos;analyse</p>
                {analyse && (
                  <div className="flex gap-2">
                    <button onClick={handleCopy}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-coplio-text px-2.5 py-1.5 rounded-lg border border-border transition-colors">
                      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-coplio-green" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copié' : 'Copier'}
                    </button>
                    <button onClick={() => handleDownload(analyse, `analyse_${Date.now()}.txt`)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-coplio-text px-2.5 py-1.5 rounded-lg border border-border transition-colors">
                      <Download className="w-3.5 h-3.5" />Télécharger
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
                <div className="flex-1 overflow-y-auto prose prose-sm max-w-none text-coplio-text">
                  <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{analyse}</pre>
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
      )}
    </div>
  )
}
