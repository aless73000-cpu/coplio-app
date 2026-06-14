'use client'
import { ConfirmButton } from '@/components/ui/ConfirmButton'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Wrench, Loader2, CheckCircle2, AlertTriangle,
  Trash2, ChevronDown, ChevronUp, Euro, Calendar, User
} from 'lucide-react'
import { formatDate, formatEuro } from '@/lib/utils'

const TYPES = [
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'travaux', label: 'Travaux' },
  { value: 'urgence', label: 'Urgence' },
  { value: 'autre', label: 'Autre' },
]

const STATUTS = [
  { value: 'planifie', label: 'Planifié', color: 'text-blue-600 bg-blue-50' },
  { value: 'realise', label: 'Réalisé', color: 'text-[#374151] bg-slate-100' },
  { value: 'annule', label: 'Annulé', color: 'text-muted-foreground bg-coplio-bg' },
]

interface Prestataire { id: string; nom: string; categorie: string; telephone?: string }
interface Entretien {
  id: string; titre: string; description?: string; type: string
  date_intervention: string; cout?: number; statut: string
  prestataire?: Prestataire
}

const emptyForm = { titre: '', description: '', type: 'maintenance', date_intervention: '', cout: '', prestataire_id: '', statut: 'planifie' }

export default function CarnetEntretienPage() {
  const { id: coproprieteId } = useParams<{ id: string }>()
  const [entretiens, setEntretiens] = useState<Entretien[]>([])
  const [prestataires, setPrestataires] = useState<Prestataire[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const [eRes, pRes] = await Promise.all([
      fetch(`/api/entretiens?copropriete_id=${coproprieteId}`),
      fetch('/api/prestataires'),
    ])
    const [eData, pData] = await Promise.all([eRes.json(), pRes.json()])
    setEntretiens(Array.isArray(eData) ? eData : [])
    setPrestataires(Array.isArray(pData) ? pData : [])
    setLoading(false)
  }, [coproprieteId])

  useEffect(() => { load() }, [load])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (!form.date_intervention) { setError('Date requise'); return }
    setSaving(true)
    const res = await fetch('/api/entretiens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        copropriete_id: coproprieteId,
        titre: form.titre,
        description: form.description || undefined,
        type: form.type,
        date_intervention: new Date(form.date_intervention).toISOString(),
        cout: form.cout ? parseFloat(form.cout) : null,
        prestataire_id: form.prestataire_id || null,
        statut: form.statut,
      }),
    })
    setSaving(false)
    if (res.ok) {
      const created = await res.json()
      setEntretiens(prev => [created, ...prev])
      setShowForm(false); setForm(emptyForm)
    } else {
      const d = await res.json(); setError(d.error ?? 'Erreur')
    }
  }

  async function handleStatut(id: string, statut: string) {
    await fetch(`/api/entretiens/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
    })
    setEntretiens(prev => prev.map(e => e.id === id ? { ...e, statut } : e))
  }

  async function handleDelete(id: string) {

    await fetch(`/api/entretiens/${id}`, { method: 'DELETE' })
    setEntretiens(prev => prev.filter(e => e.id !== id))
  }

  const filtered = typeFilter ? entretiens.filter(e => e.type === typeFilter) : entretiens
  const totalCout = entretiens.filter(e => e.statut === 'realise').reduce((s, e) => s + (e.cout ?? 0), 0)

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href={`/coproprietes/${coproprieteId}`} className="text-muted-foreground hover:text-coplio-text transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-coplio-text">Carnet d&apos;entretien</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Suivi des interventions et maintenances</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-[#374151] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#374151]/90 transition-colors">
          <Plus className="w-4 h-4" />Ajouter
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="coplio-card text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total interventions</p>
          <p className="text-xl font-bold text-coplio-text">{entretiens.length}</p>
        </div>
        <div className="coplio-card text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Réalisées</p>
          <p className="text-xl font-bold text-[#374151]">{entretiens.filter(e => e.statut === 'realise').length}</p>
        </div>
        <div className="coplio-card text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Coût total</p>
          <p className="text-xl font-bold text-coplio-text">{formatEuro(totalCout)}</p>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="coplio-card">
          <h2 className="font-semibold text-coplio-text mb-4">Nouvelle intervention</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-coplio-red">{error}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Titre *</label>
                <input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} required
                  placeholder="Ex: Révision chaudière" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20 bg-white">
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Statut</label>
                <select value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20 bg-white">
                  {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Date *</label>
                <input type="datetime-local" value={form.date_intervention} onChange={e => setForm(f => ({ ...f, date_intervention: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Coût (€)</label>
                <input type="number" value={form.cout} onChange={e => setForm(f => ({ ...f, cout: e.target.value }))} placeholder="0"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Prestataire</label>
                <select value={form.prestataire_id} onChange={e => setForm(f => ({ ...f, prestataire_id: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20 bg-white">
                  <option value="">— Aucun —</option>
                  {prestataires.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20 resize-none" placeholder="Détails de l'intervention..." />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 bg-[#374151] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#374151]/90 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Enregistrer
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="text-sm text-muted-foreground hover:text-coplio-text px-4 py-2 rounded-lg border border-border">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setTypeFilter('')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${!typeFilter ? 'bg-[#374151] text-white' : 'bg-coplio-bg text-muted-foreground hover:text-coplio-text'}`}>
          Tous ({entretiens.length})
        </button>
        {TYPES.map(t => {
          const count = entretiens.filter(e => e.type === t.value).length
          if (count === 0) return null
          return (
            <button key={t.value} onClick={() => setTypeFilter(typeFilter === t.value ? '' : t.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${typeFilter === t.value ? 'bg-[#374151] text-white' : 'bg-coplio-bg text-muted-foreground hover:text-coplio-text'}`}>
              {t.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="coplio-card text-center py-12">
          <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-coplio-text mb-1">Aucune intervention</p>
          <p className="text-sm text-muted-foreground">Commencez à tracer les interventions de cette copropriété</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(e => {
            const statut = STATUTS.find(s => s.value === e.statut)
            const isExpanded = expandedId === e.id
            return (
              <div key={e.id} className="coplio-card">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    e.statut === 'realise' ? 'bg-slate-100' : e.type === 'urgence' ? 'bg-red-50' : 'bg-coplio-bg'
                  }`}>
                    {e.statut === 'realise' ? <CheckCircle2 className="w-5 h-5 text-[#374151]" />
                      : e.type === 'urgence' ? <AlertTriangle className="w-5 h-5 text-coplio-red" />
                      : <Wrench className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-coplio-text">{e.titre}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statut?.color}`}>{statut?.label}</span>
                      <span className="text-xs text-muted-foreground bg-coplio-bg px-2 py-0.5 rounded-full">{TYPES.find(t => t.value === e.type)?.label}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(e.date_intervention)}</span>
                      {e.prestataire && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{e.prestataire.nom}</span>}
                      {e.cout != null && e.cout > 0 && <span className="flex items-center gap-1"><Euro className="w-3.5 h-3.5" />{formatEuro(e.cout)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {e.statut === 'planifie' && (
                      <button onClick={() => handleStatut(e.id, 'realise')}
                        className="text-xs text-[#374151] hover:bg-slate-100 px-2 py-1 rounded-lg transition-colors font-medium">
                        ✓ Réalisé
                      </button>
                    )}
                    <ConfirmButton label={<Trash2 className="w-4 h-4" />} message="Supprimer cet entretien ?" confirmLabel="Supprimer" className="p-1.5 text-muted-foreground hover:text-coplio-red transition-colors" onConfirm={() => handleDelete(e.id)} />
                    {e.description && (
                      <button onClick={() => setExpandedId(isExpanded ? null : e.id)} className="p-1.5 text-muted-foreground hover:text-coplio-text transition-colors">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
                {isExpanded && e.description && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-sm text-coplio-text">{e.description}</p>
                    {e.prestataire?.telephone && (
                      <a href={`tel:${e.prestataire.telephone}`} className="text-sm text-[#374151] hover:underline mt-1 inline-block">
                        📞 {e.prestataire.telephone}
                      </a>
                    )}
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
