'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Loader2, Trash2, ChevronDown, ChevronUp,
  HardHat, FileText, Vote, ShoppingCart, Hammer, CheckCircle2, Archive,
  AlertTriangle, Euro, Calendar
} from 'lucide-react'
import { formatEuro, formatDate } from '@/lib/utils'

const STATUTS = [
  { value: 'demande', label: 'Demande', icon: FileText, color: 'bg-blue-50 text-blue-600' },
  { value: 'devis', label: 'Devis', icon: Euro, color: 'bg-amber-50 text-amber-600' },
  { value: 'vote', label: 'Vote AG', icon: Vote, color: 'bg-purple-50 text-purple-600' },
  { value: 'commande', label: 'Commandé', icon: ShoppingCart, color: 'bg-orange-50 text-orange-600' },
  { value: 'realisation', label: 'En cours', icon: Hammer, color: 'bg-slate-100 text-[#374151]' },
  { value: 'reception', label: 'Réception', icon: CheckCircle2, color: 'bg-teal-50 text-teal-600' },
  { value: 'archive', label: 'Archivé', icon: Archive, color: 'bg-coplio-bg text-muted-foreground' },
]

const PRIORITES = [
  { value: 'basse', label: 'Basse', color: 'text-muted-foreground' },
  { value: 'normale', label: 'Normale', color: 'text-blue-600' },
  { value: 'haute', label: 'Haute', color: 'text-amber-600' },
  { value: 'urgente', label: 'Urgente', color: 'text-coplio-red' },
]

const ETAPE_TYPES = [
  { value: 'devis', label: '📄 Devis reçu' },
  { value: 'vote', label: '🗳️ Vote AG' },
  { value: 'commande', label: '🛒 Bon de commande' },
  { value: 'photo', label: '📷 Photo d\'avancement' },
  { value: 'facture', label: '🧾 Facture reçue' },
  { value: 'note', label: '📝 Note' },
]

interface Etape { id: string; type: string; description?: string; montant?: number; created_at: string }
interface Travail {
  id: string; titre: string; description?: string; statut: string; priorite: string
  montant_estime?: number; montant_final?: number; created_at: string
  prestataire?: { nom: string } | null; etapes: Etape[]
}
interface Prestataire { id: string; nom: string }

const WORKFLOW = ['demande', 'devis', 'vote', 'commande', 'realisation', 'reception', 'archive']

export default function TravauxPage() {
  const { id: coproprieteId } = useParams<{ id: string }>()
  const [travaux, setTravaux] = useState<Travail[]>([])
  const [prestataires, setPrestataires] = useState<Prestataire[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ titre: '', description: '', priorite: 'normale', montant_estime: '', prestataire_id: '' })
  const [saving, setSaving] = useState(false)
  const [etapeForm, setEtapeForm] = useState<Record<string, { type: string; description: string; montant: string }>>({})
  const [filterStatut, setFilterStatut] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const [tRes, pRes] = await Promise.all([
      fetch(`/api/travaux?copropriete_id=${coproprieteId}`),
      fetch('/api/prestataires'),
    ])
    const [tData, pData] = await Promise.all([tRes.json(), pRes.json()])
    setTravaux(Array.isArray(tData) ? tData : [])
    setPrestataires(Array.isArray(pData) ? pData : [])
    setLoading(false)
  }, [coproprieteId])

  useEffect(() => { load() }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const res = await fetch('/api/travaux', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        copropriete_id: coproprieteId, titre: form.titre, description: form.description || undefined,
        priorite: form.priorite, montant_estime: form.montant_estime ? parseFloat(form.montant_estime) : null,
        prestataire_id: form.prestataire_id || null,
      }),
    })
    setSaving(false)
    if (res.ok) {
      const created = await res.json()
      setTravaux(prev => [created, ...prev]); setShowForm(false)
      setForm({ titre: '', description: '', priorite: 'normale', montant_estime: '', prestataire_id: '' })
    }
  }

  async function handleStatut(id: string, statut: string) {
    const res = await fetch(`/api/travaux/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
    })
    if (res.ok) { const data = await res.json(); setTravaux(prev => prev.map(t => t.id === id ? data : t)) }
  }

  async function handleAddEtape(travailId: string) {
    const ef = etapeForm[travailId]
    if (!ef?.type) return
    const res = await fetch(`/api/travaux/${travailId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _etape: { type: ef.type, description: ef.description || undefined, montant: ef.montant ? parseFloat(ef.montant) : null } }),
    })
    if (res.ok) {
      const data = await res.json()
      setTravaux(prev => prev.map(t => t.id === travailId ? data : t))
      setEtapeForm(prev => ({ ...prev, [travailId]: { type: 'note', description: '', montant: '' } }))
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce chantier ?')) return
    await fetch(`/api/travaux/${id}`, { method: 'DELETE' })
    setTravaux(prev => prev.filter(t => t.id !== id))
  }

  const filtered = filterStatut ? travaux.filter(t => t.statut === filterStatut) : travaux

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href={`/coproprietes/${coproprieteId}`} className="text-muted-foreground hover:text-coplio-text transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-coplio-text">Suivi des travaux</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Workflow demande → réception</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-[#374151] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#374151]/90 transition-colors">
          <Plus className="w-4 h-4" />Nouveau chantier
        </button>
      </div>

      {/* Pipeline visuel */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {STATUTS.map((s, i) => {
          const count = travaux.filter(t => t.statut === s.value).length
          return (
            <button key={s.value} onClick={() => setFilterStatut(filterStatut === s.value ? '' : s.value)}
              className={`flex-1 min-w-20 text-center py-2 px-2 rounded-xl text-xs font-medium transition-all border-2 ${
                filterStatut === s.value ? 'border-[#374151]' : 'border-transparent'
              } ${s.color}`}>
              <p className="font-bold text-base">{count}</p>
              <p>{s.label}</p>
              {i < STATUTS.length - 1 && <span className="text-xs opacity-50">→</span>}
            </button>
          )
        })}
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="coplio-card">
          <h2 className="font-semibold text-coplio-text mb-4">Nouveau chantier</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Titre *</label>
                <input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} required
                  placeholder="Ex: Ravalement façade nord" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Priorité</label>
                <select value={form.priorite} onChange={e => setForm(f => ({ ...f, priorite: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20 bg-white">
                  {PRIORITES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Budget estimé (€)</label>
                <input type="number" value={form.montant_estime} onChange={e => setForm(f => ({ ...f, montant_estime: e.target.value }))}
                  placeholder="0" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Prestataire pressenti</label>
                <select value={form.prestataire_id} onChange={e => setForm(f => ({ ...f, prestataire_id: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20 bg-white">
                  <option value="">— Non assigné —</option>
                  {prestataires.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20 resize-none" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 bg-[#374151] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#374151]/90 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Créer
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-muted-foreground px-4 py-2 rounded-lg border border-border">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="coplio-card text-center py-12">
          <HardHat className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-coplio-text mb-1">Aucun chantier</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => {
            const statut = STATUTS.find(s => s.value === t.statut)!
            const priorite = PRIORITES.find(p => p.value === t.priorite)
            const isExpanded = expandedId === t.id
            const StatutIcon = statut.icon
            const workflowIdx = WORKFLOW.indexOf(t.statut)
            const nextStatut = WORKFLOW[workflowIdx + 1]

            return (
              <div key={t.id} className="coplio-card">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${statut.color}`}>
                    <StatutIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-coplio-text">{t.titre}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statut.color}`}>{statut.label}</span>
                      {priorite && t.priorite !== 'normale' && (
                        <span className={`text-xs font-medium ${priorite.color}`}>
                          {t.priorite === 'urgente' && '🔴'}{t.priorite === 'haute' && '🟡'} {priorite.label}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(t.created_at)}</span>
                      {t.prestataire && <span>{t.prestataire.nom}</span>}
                      {t.montant_estime && <span className="flex items-center gap-1"><Euro className="w-3.5 h-3.5" />Estimé : {formatEuro(t.montant_estime)}</span>}
                      {t.montant_final && <span className="flex items-center gap-1 font-medium text-coplio-text">Final : {formatEuro(t.montant_final)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {nextStatut && (
                      <button onClick={() => handleStatut(t.id, nextStatut)}
                        className="text-xs text-[#374151] hover:bg-slate-100 px-2 py-1 rounded-lg transition-colors font-medium whitespace-nowrap">
                        → {STATUTS.find(s => s.value === nextStatut)?.label}
                      </button>
                    )}
                    <button onClick={() => handleDelete(t.id)} className="p-1.5 text-muted-foreground hover:text-coplio-red transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setExpandedId(isExpanded ? null : t.id)} className="p-1.5 text-muted-foreground hover:text-coplio-text transition-colors">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border space-y-4">
                    {/* Timeline étapes */}
                    {t.etapes?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Historique</p>
                        {t.etapes.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map(e => (
                          <div key={e.id} className="flex gap-3 text-sm">
                            <div className="w-2 h-2 bg-[#374151] rounded-full mt-1.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium text-coplio-text">{ETAPE_TYPES.find(et => et.value === e.type)?.label ?? e.type}</span>
                              {e.montant && <span className="text-muted-foreground ml-2">{formatEuro(e.montant)}</span>}
                              {e.description && <p className="text-muted-foreground text-xs mt-0.5">{e.description}</p>}
                              <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(e.created_at)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Ajouter étape */}
                    <div className="bg-coplio-bg rounded-xl p-3 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">Ajouter une étape</p>
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          value={etapeForm[t.id]?.type ?? 'note'}
                          onChange={e => setEtapeForm(prev => ({ ...prev, [t.id]: { ...prev[t.id], type: e.target.value } }))}
                          className="col-span-1 px-2 py-1.5 text-xs border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#374151]/20 bg-white">
                          {ETAPE_TYPES.map(et => <option key={et.value} value={et.value}>{et.label}</option>)}
                        </select>
                        <input
                          value={etapeForm[t.id]?.description ?? ''}
                          onChange={e => setEtapeForm(prev => ({ ...prev, [t.id]: { ...prev[t.id], description: e.target.value } }))}
                          placeholder="Description..." className="col-span-1 px-2 py-1.5 text-xs border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#374151]/20" />
                        <div className="flex gap-1">
                          <input type="number"
                            value={etapeForm[t.id]?.montant ?? ''}
                            onChange={e => setEtapeForm(prev => ({ ...prev, [t.id]: { ...prev[t.id], montant: e.target.value } }))}
                            placeholder="Montant €" className="flex-1 px-2 py-1.5 text-xs border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#374151]/20 min-w-0" />
                          <button onClick={() => handleAddEtape(t.id)}
                            className="px-2 py-1.5 bg-[#374151] text-white text-xs rounded-lg hover:bg-[#374151]/90 flex-shrink-0">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
