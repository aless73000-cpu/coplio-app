'use client'

import { useState, useEffect, useRef } from 'react'
import { Sparkles, FileText, Upload, Copy, Loader2, CheckCircle2, FileSearch, MessageCircle, BarChart2, AlertTriangle, TrendingDown, TrendingUp, Send, Bot, User, FileDown, Pencil, Eye } from 'lucide-react'

// ── Inline Markdown renderer ──────────────────────────────────────────────────
function renderInline(text: string): React.ReactNode {
  const regex = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g
  const parts: React.ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    const raw = match[0]
    if (raw.startsWith('***')) parts.push(<strong key={match.index}><em>{raw.slice(3, -3)}</em></strong>)
    else if (raw.startsWith('**')) parts.push(<strong key={match.index}>{raw.slice(2, -2)}</strong>)
    else parts.push(<em key={match.index}>{raw.slice(1, -1)}</em>)
    last = match.index + raw.length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

function DocumentRenderer({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0
  let listBuf: string[] = []
  let listType: 'ul' | 'ol' | null = null

  function flushList() {
    if (!listBuf.length) return
    const key = `list-${elements.length}`
    if (listType === 'ul') {
      elements.push(
        <ul key={key} className="list-disc ml-5 space-y-1 mb-3">
          {listBuf.map((item, j) => <li key={j} className="text-sm text-coplio-text leading-relaxed">{renderInline(item)}</li>)}
        </ul>
      )
    } else {
      elements.push(
        <ol key={key} className="list-decimal ml-5 space-y-1 mb-3">
          {listBuf.map((item, j) => <li key={j} className="text-sm text-coplio-text leading-relaxed">{renderInline(item)}</li>)}
        </ol>
      )
    }
    listBuf = []
    listType = null
  }

  for (; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('# ')) {
      flushList()
      elements.push(<h1 key={i} className="text-xl font-bold text-coplio-text mb-4 mt-2 leading-snug">{renderInline(line.slice(2))}</h1>)
    } else if (line.startsWith('## ')) {
      flushList()
      elements.push(
        <div key={i} className="mt-6 mb-2">
          <h2 className="text-sm font-bold text-coplio-green uppercase tracking-wide">{renderInline(line.slice(3))}</h2>
          <div className="h-px bg-coplio-green/20 mt-1" />
        </div>
      )
    } else if (line.startsWith('### ')) {
      flushList()
      elements.push(<h3 key={i} className="text-sm font-semibold text-coplio-text mt-4 mb-1">{renderInline(line.slice(4))}</h3>)
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (listType !== 'ul') flushList()
      listType = 'ul'
      listBuf.push(line.slice(2))
    } else if (/^\d+\. /.test(line)) {
      if (listType !== 'ol') flushList()
      listType = 'ol'
      listBuf.push(line.replace(/^\d+\. /, ''))
    } else if (line.trim() === '---') {
      flushList()
      elements.push(<hr key={i} className="my-5 border-border" />)
    } else if (line.trim() === '') {
      flushList()
    } else {
      flushList()
      elements.push(<p key={i} className="text-sm text-coplio-text leading-relaxed mb-2">{renderInline(line)}</p>)
    }
  }
  flushList()
  return <>{elements}</>
}

// ── PDF export ────────────────────────────────────────────────────────────────
function stripMd(t: string) {
  return t.replace(/\*\*\*(.+?)\*\*\*/g, '$1').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')
}

async function downloadPdf(text: string, label: string, copropNom: string) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const GREEN = '#0F6E56', TEXT = '#1C1C1A', MUTED = '#888888'
  const W = 210, M = 20, CW = W - M * 2
  const now = new Date()

  // Header
  doc.setFillColor(GREEN)
  doc.rect(0, 0, W, 18, 'F')
  doc.setTextColor('#FFFFFF')
  doc.setFontSize(10); doc.setFont('helvetica', 'bold')
  doc.text('COPLIO', M, 8)
  doc.setFontSize(8); doc.setFont('helvetica', 'normal')
  doc.text(copropNom, W - M, 8, { align: 'right' })
  doc.text(now.toLocaleDateString('fr-FR'), W - M, 14, { align: 'right' })

  let y = 28

  for (const line of text.split('\n')) {
    if (y > 274) { doc.addPage(); y = 20 }

    if (line.startsWith('# ')) {
      doc.setFontSize(15); doc.setFont('helvetica', 'bold'); doc.setTextColor(TEXT)
      const wrapped = doc.splitTextToSize(stripMd(line.slice(2)), CW)
      doc.text(wrapped, M, y); y += wrapped.length * 7 + 5
    } else if (line.startsWith('## ')) {
      if (y > 265) { doc.addPage(); y = 20 }
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(GREEN)
      doc.text(stripMd(line.slice(3)).toUpperCase(), M, y)
      doc.setDrawColor(GREEN); doc.setLineWidth(0.2)
      doc.line(M, y + 1.5, W - M, y + 1.5)
      y += 9
    } else if (line.startsWith('### ')) {
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(TEXT)
      doc.text(stripMd(line.slice(4)), M, y); y += 6
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(TEXT)
      const wrapped = doc.splitTextToSize('• ' + stripMd(line.slice(2)), CW - 5)
      doc.text(wrapped, M + 3, y); y += wrapped.length * 5 + 1
    } else if (/^\d+\. /.test(line)) {
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(TEXT)
      const wrapped = doc.splitTextToSize(stripMd(line), CW - 5)
      doc.text(wrapped, M + 3, y); y += wrapped.length * 5 + 1
    } else if (line.trim() === '---') {
      doc.setDrawColor('#DDDDDD'); doc.setLineWidth(0.2)
      doc.line(M, y, W - M, y); y += 5
    } else if (line.trim() === '') {
      y += 3
    } else {
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(TEXT)
      const wrapped = doc.splitTextToSize(stripMd(line), CW)
      doc.text(wrapped, M, y); y += wrapped.length * 5 + 1
    }
  }

  const total = doc.getNumberOfPages()
  for (let p = 1; p <= total; p++) {
    doc.setPage(p)
    doc.setFontSize(7); doc.setTextColor(MUTED); doc.setDrawColor('#DDDDDD')
    doc.line(M, 286, W - M, 286)
    doc.text(`Coplio · ${copropNom} · ${now.toLocaleDateString('fr-FR')} · Page ${p}/${total}`, W / 2, 290, { align: 'center' })
  }

  doc.save(`${label.toLowerCase().replace(/\s+/g, '_')}_${now.toISOString().slice(0, 10)}.pdf`)
}

const TEMPLATES = [
  { value: 'convocation_ag', label: 'Convocation AG', desc: 'Lettre de convocation à l\'assemblée générale', icon: '📋' },
  { value: 'pv_ag', label: 'Procès-verbal AG', desc: 'PV d\'assemblée générale', icon: '📝' },
  { value: 'mise_en_demeure', label: 'Mise en demeure', desc: 'Lettre de mise en demeure pour impayé', icon: '⚠️' },
  { value: 'courrier_travaux', label: 'Info travaux', desc: 'Courrier d\'information pour des travaux', icon: '🔧' },
  { value: 'relance_impaye', label: 'Relance impayé', desc: 'Lettre de relance courtoise', icon: '💌' },
  { value: 'contrat_prestataire', label: 'Contrat prestataire', desc: 'Contrat de prestation de services', icon: '📄' },
  { value: 'courrier_resiliation', label: 'Résiliation contrat', desc: 'Courrier de résiliation prestataire', icon: '✂️' },
  { value: 'notice_annuelle', label: 'Bilan annuel', desc: 'Notice d\'information annuelle copropriétaires', icon: '📊' },
]

const TYPE_DOC = [
  { value: 'reglement', label: 'Règlement de copropriété' },
  { value: 'contrat', label: 'Contrat prestataire' },
  { value: 'devis', label: 'Devis de travaux' },
  { value: 'autre', label: 'Autre document' },
]

interface Copropriete { id: string; nom: string }
interface ChatMessage { role: 'user' | 'assistant'; content: string }

interface RiskScore { copropriete_id: string; nom: string; score: number; niveau: string; tauxImpaye: number; montantImpayes: number; sinistresOuverts: number }
interface Anomalie { titre: string; description: string; severite: 'haute' | 'moyenne' | 'faible'; copropriete?: string }
interface AnalyseCabinet { scores: RiskScore[]; analyse: { anomalies: Anomalie[]; recommandations: string[]; points_positifs: string[]; resume: string } }

const CHAMPS_EXTRA: Record<string, { key: string; label: string; placeholder: string }[]> = {
  convocation_ag: [
    { key: 'date_ag', label: 'Date AG', placeholder: 'Ex: 15 juin 2026 à 18h00' },
    { key: 'lieu', label: 'Lieu', placeholder: 'Salle des fêtes, 12 rue...' },
  ],
  pv_ag: [{ key: 'date_ag', label: 'Date AG', placeholder: 'Ex: 15 juin 2026' }],
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
  contrat_prestataire: [
    { key: 'prestataire', label: 'Nom du prestataire', placeholder: 'Entreprise Martin SARL' },
    { key: 'siret', label: 'SIRET', placeholder: '123 456 789 00012' },
    { key: 'objet', label: 'Objet de la prestation', placeholder: 'Entretien espaces verts' },
    { key: 'montant', label: 'Montant HT (€)', placeholder: '1 200' },
    { key: 'duree', label: 'Durée / période', placeholder: '1 an renouvelable' },
  ],
  courrier_resiliation: [
    { key: 'prestataire', label: 'Nom du prestataire', placeholder: 'Entreprise Martin SARL' },
    { key: 'motif', label: 'Motif', placeholder: 'Non-respect des délais contractuels' },
    { key: 'preavis', label: 'Préavis', placeholder: '3 mois' },
    { key: 'date_resiliation', label: 'Date effective', placeholder: '30 septembre 2026' },
  ],
  notice_annuelle: [
    { key: 'annee', label: 'Année', placeholder: '2026' },
  ],
}

export default function IAPage() {
  const [tab, setTab] = useState<'rediger' | 'analyser' | 'chat' | 'tableau'>('rediger')
  const [coproprietes, setCoproprietes] = useState<Copropriete[]>([])
  const [coproprieteId, setCoproprieteId] = useState('')

  // Rédaction
  const [template, setTemplate] = useState('convocation_ag')
  const [donnees, setDonnees] = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  // Analyse document
  const [file, setFile] = useState<File | null>(null)
  const [typeDoc, setTypeDoc] = useState('reglement')
  const [analysing, setAnalysing] = useState(false)
  const [analyse, setAnalyse] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Chat IA
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Tableau de bord IA
  const [analyseData, setAnalyseData] = useState<AnalyseCabinet | null>(null)
  const [analyseLoading, setAnalyseLoading] = useState(false)
  const [analyseLoaded, setAnalyseLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/coproprietes')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) { setCoproprietes(d); if (d[0]) setCoproprieteId(d[0].id) } })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  useEffect(() => {
    if (tab === 'tableau' && !analyseLoaded) loadAnalyse()
  }, [tab])

  async function handleGenerate() {
    if (!coproprieteId) return
    setGenerating(true); setResult(''); setEditMode(false)
    try {
      const res = await fetch('/api/ia/rediger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template, copropriete_id: coproprieteId, donnees }),
      })
      const data = await res.json()
      setResult(data.texte ?? data.error ?? 'Erreur inattendue')
    } catch {
      setResult('Erreur de connexion au serveur IA.')
    } finally {
      setGenerating(false)
    }
  }

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

  async function handleChat(e: React.FormEvent) {
    e.preventDefault()
    if (!chatInput.trim() || chatLoading) return
    const userMsg: ChatMessage = { role: 'user', content: chatInput }
    const newMessages = [...chatMessages, userMsg]
    setChatMessages(newMessages)
    setChatInput('')
    setChatLoading(true)
    try {
      const res = await fetch('/api/ia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, copropriete_id: coproprieteId }),
      })
      const data = await res.json()
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.message ?? data.error ?? 'Erreur inattendue' }])
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Erreur de connexion au serveur IA.' }])
    } finally {
      setChatLoading(false)
    }
  }

  async function loadAnalyse() {
    setAnalyseLoading(true)
    try {
      const res = await fetch('/api/ia/analyse-cabinet')
      const data = await res.json()
      setAnalyseData(data)
      setAnalyseLoaded(true)
    } catch {
      setAnalyseData(null)
    } finally {
      setAnalyseLoading(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(result || analyse)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  async function handleDownloadPdf() {
    if (!result) return
    setPdfLoading(true)
    const copropNom = coproprietes.find(c => c.id === coproprieteId)?.nom ?? 'Copropriété'
    const label = TEMPLATES.find(t => t.value === template)?.label ?? 'document'
    try {
      await downloadPdf(result, label, copropNom)
    } finally {
      setPdfLoading(false)
    }
  }

  const currentTpl = TEMPLATES.find(t => t.value === template)

  const TABS = [
    { key: 'rediger', label: 'Rédaction assistée', icon: FileText },
    { key: 'analyser', label: 'Analyse de documents', icon: FileSearch },
    { key: 'chat', label: 'Chat IA', icon: MessageCircle },
    { key: 'tableau', label: 'Tableau de bord IA', icon: BarChart2 },
  ] as const

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-coplio-text flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-coplio-green" />Assistant IA
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">Rédaction, analyse, chat et détection d&apos;anomalies</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-coplio-bg p-1 rounded-xl flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-white text-coplio-text shadow-sm' : 'text-muted-foreground hover:text-coplio-text'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* RÉDACTION */}
      {tab === 'rediger' && (
        <div className="grid grid-cols-5 gap-6">
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
                      <input value={donnees[champ.key] ?? ''} onChange={e => setDonnees(prev => ({ ...prev, [champ.key]: e.target.value }))}
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
          <div className="col-span-3">
            <div className="coplio-card h-full flex flex-col min-h-[500px]">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-coplio-text">{result ? currentTpl?.label : 'Document généré'}</p>
                {result && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setEditMode(m => !m)}
                      title={editMode ? 'Aperçu' : 'Éditer'}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-coplio-text px-2.5 py-1.5 rounded-lg border border-border transition-colors"
                    >
                      {editMode ? <Eye className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                      {editMode ? 'Aperçu' : 'Éditer'}
                    </button>
                    <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-coplio-text px-2.5 py-1.5 rounded-lg border border-border transition-colors">
                      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-coplio-green" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copié' : 'Copier'}
                    </button>
                    <button
                      onClick={handleDownloadPdf}
                      disabled={pdfLoading}
                      className="flex items-center gap-1.5 text-xs bg-coplio-green text-white px-2.5 py-1.5 rounded-lg hover:bg-coplio-green/90 transition-colors disabled:opacity-60"
                    >
                      {pdfLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                      PDF
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
                editMode ? (
                  <textarea
                    value={result}
                    onChange={e => setResult(e.target.value)}
                    className="flex-1 w-full text-sm text-coplio-text leading-relaxed resize-none focus:outline-none font-mono bg-coplio-bg rounded-lg p-3"
                  />
                ) : (
                  <div className="flex-1 overflow-y-auto px-1">
                    <div className="bg-white border border-border/50 rounded-xl p-6 shadow-sm min-h-full">
                      <DocumentRenderer text={result} />
                    </div>
                  </div>
                )
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

      {/* ANALYSE DOCUMENTS */}
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
                <p className="text-sm text-muted-foreground group-hover:text-coplio-text">{file ? file.name : 'Cliquez pour uploader un PDF'}</p>
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
                    <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-coplio-text px-2.5 py-1.5 rounded-lg border border-border transition-colors">
                      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-coplio-green" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copié' : 'Copier'}
                    </button>
                    <button onClick={() => {
                        const blob = new Blob([analyse], { type: 'text/plain;charset=utf-8' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a'); a.href = url; a.download = `analyse_${Date.now()}.txt`; a.click()
                        URL.revokeObjectURL(url)
                      }}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-coplio-text px-2.5 py-1.5 rounded-lg border border-border transition-colors">
                      <FileDown className="w-3.5 h-3.5" />Télécharger
                    </button>
                  </div>
                )}
              </div>
              {analysing ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center"><Loader2 className="w-8 h-8 animate-spin text-coplio-green mx-auto mb-3" /><p className="text-sm text-muted-foreground">L&apos;IA analyse votre document...</p></div>
                </div>
              ) : analyse ? (
                <div className="flex-1 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-coplio-text">{analyse}</pre>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-muted-foreground"><FileSearch className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="text-sm">Uploadez un PDF et cliquez<br />sur &quot;Analyser&quot;</p></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CHAT IA */}
      {tab === 'chat' && (
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-2 space-y-4">
            <div className="coplio-card">
              <p className="text-sm font-semibold text-coplio-text mb-1">Contexte</p>
              <p className="text-xs text-muted-foreground mb-3">L&apos;IA connaît vos données : copropriétés, impayés, sinistres, AG…</p>
              <label className="block text-xs font-medium text-coplio-text mb-1.5">Copropriété focus (optionnel)</label>
              <select value={coproprieteId} onChange={e => setCoproprieteId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green bg-white">
                <option value="">Toutes les copropriétés</option>
                {coproprietes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
            <div className="coplio-card">
              <p className="text-sm font-semibold text-coplio-text mb-2">Suggestions</p>
              <div className="space-y-1.5">
                {[
                  'Quelles copropriétés ont des impayés importants ?',
                  'Résume-moi l\'état de mon portefeuille',
                  'Quels sinistres nécessitent une attention urgente ?',
                  'Comment améliorer mon taux de recouvrement ?',
                ].map(q => (
                  <button key={q} onClick={() => setChatInput(q)}
                    className="w-full text-left text-xs text-muted-foreground hover:text-coplio-green hover:bg-coplio-green-light px-2.5 py-2 rounded-lg transition-colors border border-transparent hover:border-coplio-green/20">
                    {q}
                  </button>
                ))}
              </div>
            </div>
            {chatMessages.length > 0 && (
              <button onClick={() => setChatMessages([])} className="w-full text-xs text-muted-foreground border border-border rounded-lg py-2 hover:bg-coplio-bg transition-colors">
                Effacer la conversation
              </button>
            )}
          </div>
          <div className="col-span-3 flex flex-col min-h-[550px]">
            <div className="coplio-card flex flex-col flex-1">
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[400px] max-h-[450px]">
                {chatMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground">
                      <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium">Bonjour ! Je suis votre assistant IA.</p>
                      <p className="text-xs mt-1">Posez-moi des questions sur votre portefeuille.</p>
                    </div>
                  </div>
                ) : chatMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 bg-coplio-green-light rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-coplio-green" />
                      </div>
                    )}
                    <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-coplio-green text-white rounded-tr-sm' : 'bg-coplio-bg text-coplio-text rounded-tl-sm'}`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-7 h-7 bg-coplio-green rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-7 h-7 bg-coplio-green-light rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3.5 h-3.5 text-coplio-green" />
                    </div>
                    <div className="bg-coplio-bg rounded-2xl rounded-tl-sm px-3 py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleChat} className="flex gap-2">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Posez une question sur vos copropriétés..."
                  className="flex-1 px-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-coplio-green" />
                <button type="submit" disabled={chatLoading || !chatInput.trim()}
                  className="flex items-center gap-1.5 bg-coplio-green text-white px-4 py-2.5 rounded-xl hover:bg-coplio-green/90 transition-colors disabled:opacity-60">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TABLEAU DE BORD IA */}
      {tab === 'tableau' && (
        <div className="space-y-6">
          {analyseLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-coplio-green" />
              <p className="text-sm text-muted-foreground">L&apos;IA analyse votre portefeuille...</p>
            </div>
          ) : !analyseData ? (
            <div className="coplio-card text-center py-12">
              <BarChart2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
              <button onClick={loadAnalyse} className="bg-coplio-green text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-coplio-green/90 transition-colors">
                Lancer l&apos;analyse
              </button>
            </div>
          ) : (
            <>
              {/* Résumé */}
              {analyseData.analyse.resume && (
                <div className="coplio-card bg-coplio-green-light border-coplio-green/20">
                  <p className="text-sm text-coplio-text font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-coplio-green" />{analyseData.analyse.resume}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Scores de risque */}
                <div className="coplio-card">
                  <h2 className="font-semibold text-coplio-text mb-4 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-coplio-green" />Score de risque par copropriété
                  </h2>
                  <div className="space-y-3">
                    {(analyseData.scores ?? []).map(s => (
                      <div key={s.copropriete_id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-coplio-text font-medium truncate max-w-[160px]">{s.nom}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.niveau === 'critique' ? 'bg-red-50 text-red-600' : s.niveau === 'élevé' ? 'bg-orange-50 text-orange-600' : s.niveau === 'moyen' ? 'bg-amber-50 text-amber-600' : 'bg-coplio-green-light text-coplio-green'}`}>
                              {s.niveau}
                            </span>
                            <span className="text-sm font-bold text-coplio-text w-8 text-right">{s.score}</span>
                          </div>
                        </div>
                        <div className="h-2 bg-coplio-bg rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${s.score >= 80 ? 'bg-coplio-green' : s.score >= 60 ? 'bg-amber-400' : s.score >= 40 ? 'bg-orange-400' : 'bg-red-500'}`}
                            style={{ width: `${s.score}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.tauxImpaye}% impayés · {s.sinistresOuverts} sinistre{s.sinistresOuverts > 1 ? 's' : ''}</p>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setAnalyseLoaded(false); loadAnalyse() }}
                    className="mt-4 text-xs text-coplio-green hover:underline">Rafraîchir l&apos;analyse</button>
                </div>

                {/* Anomalies */}
                <div className="space-y-4">
                  <div className="coplio-card">
                    <h2 className="font-semibold text-coplio-text mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-coplio-amber" />Anomalies détectées
                    </h2>
                    {(analyseData.analyse.anomalies ?? []).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Aucune anomalie détectée</p>
                    ) : (
                      <div className="space-y-2">
                        {analyseData.analyse.anomalies.map((a, i) => (
                          <div key={i} className={`p-3 rounded-xl border text-sm ${a.severite === 'haute' ? 'bg-red-50 border-red-200' : a.severite === 'moyenne' ? 'bg-amber-50 border-amber-200' : 'bg-coplio-bg border-border'}`}>
                            <p className="font-medium text-coplio-text">{a.titre}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                            {a.copropriete && <span className="text-xs font-medium text-coplio-green mt-1 block">{a.copropriete}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recommandations */}
                  <div className="coplio-card">
                    <h2 className="font-semibold text-coplio-text mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-coplio-green" />Recommandations
                    </h2>
                    <ul className="space-y-2">
                      {(analyseData.analyse.recommandations ?? []).map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-coplio-text">
                          <span className="text-coplio-green font-bold flex-shrink-0 mt-0.5">→</span>{r}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Points positifs */}
                  {(analyseData.analyse.points_positifs ?? []).length > 0 && (
                    <div className="coplio-card">
                      <h2 className="font-semibold text-coplio-text mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-coplio-green" />Points positifs
                      </h2>
                      <ul className="space-y-2">
                        {analyseData.analyse.points_positifs.map((p, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-coplio-text">
                            <span className="text-coplio-green flex-shrink-0 mt-0.5">✓</span>{p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
