'use client'

import { useState, useEffect, useCallback } from 'react'
import { PenLine, Plus, Loader2, CheckCircle2, Clock, X, AlertTriangle, ExternalLink, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { DocTabs } from '@/components/syndic/DocTabs'

const TYPES_DOC = [
  { value: 'pv_ag', label: 'PV d\'AG' },
  { value: 'mandat', label: 'Mandat de gestion' },
  { value: 'devis', label: 'Devis' },
  { value: 'contrat', label: 'Contrat' },
  { value: 'autre', label: 'Autre' },
]

const STATUT_CONFIG = {
  brouillon: { label: 'Brouillon', color: 'text-muted-foreground bg-coplio-bg', icon: Clock },
  en_attente: { label: 'En attente', color: 'text-amber-600 bg-amber-50', icon: Clock },
  signe: { label: 'Signé', color: 'text-coplio-green bg-coplio-green-light', icon: CheckCircle2 },
  expire: { label: 'Expiré', color: 'text-muted-foreground bg-coplio-bg', icon: AlertTriangle },
  refuse: { label: 'Refusé', color: 'text-coplio-red bg-red-50', icon: X },
  annule: { label: 'Annulé', color: 'text-muted-foreground bg-coplio-bg', icon: X },
}

interface Signataire { prenom: string; nom: string; email: string }
interface SignatureItem {
  id: string; nom: string; type_document: string; statut: string
  signataires: Signataire[]; lien_signature?: string
  created_at: string; copropriete?: { nom: string } | null
}
interface Copropriete { id: string; nom: string }

const emptySignataire = { prenom: '', nom: '', email: '' }

export default function SignaturesPage() {
  const [items, setItems] = useState<SignatureItem[]>([])
  const [coproprietes, setCoproprietes] = useState<Copropriete[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nom: '', type_document: 'pv_ag', copropriete_id: '', fichier_url: '' })
  const [signataires, setSignataires] = useState<Signataire[]>([{ ...emptySignataire }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [hasYousign, setHasYousign] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [sRes, cRes, cfgRes] = await Promise.all([
        fetch('/api/signatures'),
        fetch('/api/coproprietes'),
        fetch('/api/signatures/config'),
      ])
      const [sData, cData, cfgData] = await Promise.all([sRes.json(), cRes.json(), cfgRes.json()])
      setItems(Array.isArray(sData) ? sData : [])
      setCoproprietes(Array.isArray(cData) ? cData : [])
      setHasYousign(cfgData.yousign_configured === true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSaving(true)
    const validSignataires = signataires.filter(s => s.email)
    if (validSignataires.length === 0) { setError('Au moins un signataire requis'); setSaving(false); return }

    const res = await fetch('/api/signatures', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, copropriete_id: form.copropriete_id || null, fichier_url: form.fichier_url || null, signataires: validSignataires }),
    })
    setSaving(false)
    if (res.ok) {
      const data = await res.json()
      setItems(prev => [data, ...prev]); setShowForm(false)
      setForm({ nom: '', type_document: 'pv_ag', copropriete_id: '', fichier_url: '' })
      setSignataires([{ ...emptySignataire }])
    } else { const d = await res.json(); setError(d.error ?? 'Erreur') }
  }

  const pending = items.filter(i => i.statut === 'en_attente').length
  const signed = items.filter(i => i.statut === 'signe').length

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-coplio-text flex items-center gap-2">
            <PenLine className="w-6 h-6 text-coplio-green" />Signatures électroniques
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">PV d&apos;AG, mandats, devis — conformes eIDAS via Yousign</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-coplio-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-coplio-green/90 transition-colors">
          <Plus className="w-4 h-4" />Nouvelle demande
        </button>
      </div>

      <DocTabs />

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="coplio-card text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total</p>
          <p className="text-xl font-bold text-coplio-text">{items.length}</p>
        </div>
        <div className="coplio-card text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">En attente</p>
          <p className="text-xl font-bold text-amber-600">{pending}</p>
        </div>
        <div className="coplio-card text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Signés</p>
          <p className="text-xl font-bold text-coplio-green">{signed}</p>
        </div>
      </div>

      {/* Info Yousign — affiché uniquement si non configuré */}
      {!hasYousign && (
        <div className="coplio-card bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <PenLine className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-800">Intégration Yousign non configurée</p>
              <p className="text-xs text-blue-600 mt-0.5">
                Pour activer les signatures électroniques, ajoutez <code className="bg-blue-100 px-1 rounded">YOUSIGN_API_KEY</code> dans vos variables Vercel.
                Créez un compte sur <strong>yousign.com</strong> pour obtenir votre clé API.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <div className="coplio-card">
          <h2 className="font-semibold text-coplio-text mb-4">Nouvelle demande de signature</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            {error && <p className="text-sm text-coplio-red">{error}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Nom du document *</label>
                <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} required
                  placeholder="Ex: PV AG 2026" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green" />
              </div>
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Type</label>
                <select value={form.type_document} onChange={e => setForm(f => ({ ...f, type_document: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green bg-white">
                  {TYPES_DOC.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Copropriété</label>
                <select value={form.copropriete_id} onChange={e => setForm(f => ({ ...f, copropriete_id: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green bg-white">
                  <option value="">— Aucune —</option>
                  {coproprietes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">URL du document (PDF)</label>
                <input value={form.fichier_url} onChange={e => setForm(f => ({ ...f, fichier_url: e.target.value }))}
                  placeholder="https://..." className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-coplio-text mb-2">Signataires</label>
              <div className="space-y-2">
                {signataires.map((s, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2">
                    <input value={s.prenom} onChange={e => setSignataires(prev => prev.map((x, j) => j === i ? { ...x, prenom: e.target.value } : x))}
                      placeholder="Prénom" className="px-2.5 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-coplio-green" />
                    <input value={s.nom} onChange={e => setSignataires(prev => prev.map((x, j) => j === i ? { ...x, nom: e.target.value } : x))}
                      placeholder="Nom" className="px-2.5 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-coplio-green" />
                    <div className="flex gap-1">
                      <input value={s.email} onChange={e => setSignataires(prev => prev.map((x, j) => j === i ? { ...x, email: e.target.value } : x))}
                        placeholder="email@..." type="email" className="flex-1 px-2.5 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-coplio-green min-w-0" />
                      {signataires.length > 1 && (
                        <button type="button" onClick={() => setSignataires(prev => prev.filter((_, j) => j !== i))}
                          className="p-2 text-muted-foreground hover:text-coplio-red"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => setSignataires(prev => [...prev, { ...emptySignataire }])}
                  className="text-sm text-coplio-green font-medium flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" />Ajouter un signataire
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 bg-coplio-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-coplio-green/90 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
                {hasYousign ? 'Envoyer pour signature' : 'Créer (brouillon)'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-muted-foreground px-4 py-2 rounded-lg border border-border">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="coplio-card text-center py-12">
          <PenLine className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-coplio-text">Aucune demande de signature</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const cfg = STATUT_CONFIG[item.statut as keyof typeof STATUT_CONFIG] ?? STATUT_CONFIG.brouillon
            const CfgIcon = cfg.icon
            return (
              <div key={item.id} className="coplio-card flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                  <CfgIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-coplio-text">{item.nom}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                    <span className="text-xs text-muted-foreground">{TYPES_DOC.find(t => t.value === item.type_document)?.label}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                    {item.copropriete && <span>{item.copropriete.nom}</span>}
                    <span>{formatDate(item.created_at)}</span>
                    <span>{(item.signataires as Signataire[]).length} signataire{(item.signataires as Signataire[]).length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(item.signataires as Signataire[]).map((s, i) => (
                      <span key={i} className="text-xs bg-coplio-bg px-2 py-0.5 rounded-full text-muted-foreground">{s.prenom} {s.nom}</span>
                    ))}
                  </div>
                </div>
                {item.lien_signature && (
                  <a href={item.lien_signature} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-coplio-green font-medium hover:underline flex-shrink-0">
                    <ExternalLink className="w-3.5 h-3.5" />Signer
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
