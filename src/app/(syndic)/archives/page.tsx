'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Archive, Upload, Loader2, FileText, Trash2, Download, Search, Calendar, Shield } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { DocTabs } from '@/components/syndic/DocTabs'

const TYPES_ARCHIVE = [
  { value: 'pv_ag', label: 'PV d\'AG' },
  { value: 'convocation', label: 'Convocation' },
  { value: 'contrat', label: 'Contrat' },
  { value: 'facture', label: 'Facture' },
  { value: 'devis', label: 'Devis' },
  { value: 'diagnostic', label: 'Diagnostic' },
  { value: 'autre', label: 'Autre' },
]

interface ArchiveItem {
  id: string; nom: string; type: string; fichier_url: string
  taille_octets?: number; hash_sha256?: string
  date_document?: string; retention_jusqu_au: string; created_at: string
  copropriete?: { id: string; nom: string } | null
}

interface Copropriete { id: string; nom: string }

export default function ArchivesPage() {
  const [archives, setArchives] = useState<ArchiveItem[]>([])
  const [coproprietes, setCoproprietes] = useState<Copropriete[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [coproprieteFilter, setCoproprieteFilter] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadForm, setUploadForm] = useState({ nom: '', type: 'pv_ag', copropriete_id: '', date_document: '' })
  const [showUpload, setShowUpload] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [aRes, cRes] = await Promise.all([fetch('/api/archives'), fetch('/api/coproprietes')])
      const [aData, cData] = await Promise.all([aRes.json(), cRes.json()])
      setArchives(Array.isArray(aData) ? aData : [])
      setCoproprietes(Array.isArray(cData) ? cData : [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFile || !uploadForm.nom) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', selectedFile)
    fd.append('nom', uploadForm.nom)
    fd.append('type', uploadForm.type)
    if (uploadForm.copropriete_id) fd.append('copropriete_id', uploadForm.copropriete_id)
    if (uploadForm.date_document) fd.append('date_document', uploadForm.date_document)

    const res = await fetch('/api/archives', { method: 'POST', body: fd })
    setUploading(false)
    if (res.ok) {
      const data = await res.json()
      setArchives(prev => [data, ...prev])
      setShowUpload(false); setSelectedFile(null)
      setUploadForm({ nom: '', type: 'pv_ag', copropriete_id: '', date_document: '' })
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet archivage ? (vérification rétention légale)')) return
    const res = await fetch(`/api/archives/${id}`, { method: 'DELETE' })
    if (res.ok) setArchives(prev => prev.filter(a => a.id !== id))
    else { const d = await res.json(); alert(d.error) }
  }

  const filtered = archives.filter(a => {
    const q = search.toLowerCase()
    const matchSearch = !q || a.nom.toLowerCase().includes(q)
    const matchType = !typeFilter || a.type === typeFilter
    const matchCopro = !coproprieteFilter || a.copropriete?.id === coproprieteFilter
    return matchSearch && matchType && matchCopro
  })

  const totalSize = archives.reduce((s, a) => s + (a.taille_octets ?? 0), 0)

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-coplio-text flex items-center gap-2">
            <Archive className="w-6 h-6 text-coplio-green" />Archivage légal
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Conservation certifiée 10 ans — PV, convocations, contrats</p>
        </div>
        <button onClick={() => setShowUpload(v => !v)}
          className="flex items-center gap-2 bg-coplio-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-coplio-green/90 transition-colors">
          <Upload className="w-4 h-4" />Archiver un document
        </button>
      </div>

      <DocTabs />

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="coplio-card text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Documents archivés</p>
          <p className="text-xl font-bold text-coplio-text">{archives.length}</p>
        </div>
        <div className="coplio-card text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Volume total</p>
          <p className="text-xl font-bold text-coplio-text">{(totalSize / 1024 / 1024).toFixed(1)} MB</p>
        </div>
        <div className="coplio-card text-center bg-coplio-green-light border-coplio-green/20">
          <p className="text-xs text-coplio-green uppercase tracking-wide mb-1 font-medium">Rétention légale</p>
          <p className="text-xl font-bold text-coplio-green flex items-center justify-center gap-1">
            <Shield className="w-5 h-5" />10 ans
          </p>
        </div>
      </div>

      {/* Upload */}
      {showUpload && (
        <div className="coplio-card">
          <h2 className="font-semibold text-coplio-text mb-4">Archiver un document</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl py-8 text-center cursor-pointer hover:border-coplio-green transition-colors">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{selectedFile ? selectedFile.name : 'Cliquez pour choisir un fichier (PDF, max 20MB)'}</p>
              <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.png"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) { setSelectedFile(f); if (!uploadForm.nom) setUploadForm(prev => ({ ...prev, nom: f.name.replace(/\.[^.]+$/, '') })) }
                }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Nom *</label>
                <input value={uploadForm.nom} onChange={e => setUploadForm(f => ({ ...f, nom: e.target.value }))} required
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green" />
              </div>
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Type</label>
                <select value={uploadForm.type} onChange={e => setUploadForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green bg-white">
                  {TYPES_ARCHIVE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Copropriété</label>
                <select value={uploadForm.copropriete_id} onChange={e => setUploadForm(f => ({ ...f, copropriete_id: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green bg-white">
                  <option value="">— Toutes —</option>
                  {coproprietes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Date du document</label>
                <input type="date" value={uploadForm.date_document} onChange={e => setUploadForm(f => ({ ...f, date_document: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green" />
              </div>
            </div>
            <button type="submit" disabled={uploading || !selectedFile}
              className="flex items-center gap-2 bg-coplio-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-coplio-green/90 disabled:opacity-60">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
              {uploading ? 'Archivage...' : 'Archiver'}
            </button>
          </form>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green bg-white">
          <option value="">Tous les types</option>
          {TYPES_ARCHIVE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={coproprieteFilter} onChange={e => setCoproprieteFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green bg-white">
          <option value="">Toutes les copropriétés</option>
          {coproprietes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="coplio-card text-center py-12">
          <Archive className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-coplio-text mb-1">Aucun document archivé</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(a => (
            <div key={a.id} className="coplio-card flex items-center gap-3">
              <div className="w-9 h-9 bg-coplio-green-light rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-coplio-green" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-coplio-text text-sm truncate">{a.nom}</p>
                <div className="flex flex-wrap gap-2 mt-0.5 text-xs text-muted-foreground">
                  <span className="bg-coplio-bg px-1.5 py-0.5 rounded">{TYPES_ARCHIVE.find(t => t.value === a.type)?.label ?? a.type}</span>
                  {a.copropriete && <span>{a.copropriete.nom}</span>}
                  {a.date_document && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(a.date_document)}</span>}
                  {a.taille_octets && <span>{(a.taille_octets / 1024).toFixed(0)} KB</span>}
                  <span className="flex items-center gap-1 text-coplio-green"><Shield className="w-3 h-3" />Jusqu&apos;au {formatDate(a.retention_jusqu_au)}</span>
                </div>
                {a.hash_sha256 && <p className="text-[10px] text-muted-foreground mt-0.5 font-mono truncate">SHA256: {a.hash_sha256.slice(0, 32)}…</p>}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <a href={a.fichier_url} target="_blank" rel="noopener noreferrer"
                  className="p-1.5 text-muted-foreground hover:text-coplio-green transition-colors">
                  <Download className="w-4 h-4" />
                </a>
                <button onClick={() => handleDelete(a.id)} className="p-1.5 text-muted-foreground hover:text-coplio-red transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
