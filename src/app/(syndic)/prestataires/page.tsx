'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Wrench, Plus, Trash2, Phone, Mail, Edit2, Check, X, Search,
  Building2, Zap, Droplets, Flame, Shield, TreePine, Loader2
} from 'lucide-react'

const CATEGORIES = [
  { value: 'plomberie', label: 'Plomberie', icon: Droplets },
  { value: 'electricite', label: 'Électricité', icon: Zap },
  { value: 'chauffage', label: 'Chauffage', icon: Flame },
  { value: 'assurance', label: 'Assurance', icon: Shield },
  { value: 'jardinage', label: 'Jardinage', icon: TreePine },
  { value: 'batiment', label: 'Bâtiment / Maçonnerie', icon: Building2 },
  { value: 'autre', label: 'Autre', icon: Wrench },
]

interface Prestataire {
  id: string
  nom: string
  categorie: string
  email?: string
  telephone?: string
  siret?: string
  adresse?: string
  notes?: string
}

const emptyForm = { nom: '', categorie: 'autre', email: '', telephone: '', siret: '', adresse: '', notes: '' }

export default function PrestatairesPage() {
  const [items, setItems] = useState<Prestataire[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/prestataires')
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const url = editId ? `/api/prestataires/${editId}` : '/api/prestataires'
    const method = editId ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      const saved = await res.json()
      if (editId) setItems(prev => prev.map(p => p.id === editId ? saved : p))
      else setItems(prev => [saved, ...prev])
      setShowForm(false); setEditId(null); setForm(emptyForm)
    } else {
      const d = await res.json()
      setError(d.error ?? 'Erreur')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce prestataire ?')) return
    await fetch(`/api/prestataires/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(p => p.id !== id))
  }

  function startEdit(p: Prestataire) {
    setEditId(p.id)
    setForm({ nom: p.nom, categorie: p.categorie, email: p.email ?? '', telephone: p.telephone ?? '', siret: p.siret ?? '', adresse: p.adresse ?? '', notes: p.notes ?? '' })
    setShowForm(true)
  }

  const filtered = items.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q || p.nom.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.telephone?.includes(q)
    const matchCat = !catFilter || p.categorie === catFilter
    return matchSearch && matchCat
  })

  const getCatLabel = (val: string) => CATEGORIES.find(c => c.value === val)?.label ?? val
  const getCatIcon = (val: string) => {
    const Icon = CATEGORIES.find(c => c.value === val)?.icon ?? Wrench
    return <Icon className="w-4 h-4" />
  }

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Prestataires</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Annuaire des fournisseurs de votre cabinet</p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setEditId(null); setForm(emptyForm) }}
          className="flex items-center gap-2 bg-coplio-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-coplio-green/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="coplio-card">
          <h2 className="font-semibold text-coplio-text mb-4">{editId ? 'Modifier' : 'Nouveau prestataire'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-coplio-red">{error}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Nom *</label>
                <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} required
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green" placeholder="Ex: Plomberie Martin" />
              </div>
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Catégorie</label>
                <select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green bg-white">
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Téléphone</label>
                <input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green" placeholder="06 12 34 56 78" />
              </div>
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green" placeholder="contact@prestataire.fr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">SIRET</label>
                <input value={form.siret} onChange={e => setForm(f => ({ ...f, siret: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green" placeholder="123 456 789 00012" />
              </div>
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Adresse</label>
                <input value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green" placeholder="12 rue de la Paix, Paris" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green resize-none" placeholder="Remarques, tarifs habituels..." />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 bg-coplio-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-coplio-green/90 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editId ? 'Enregistrer' : 'Ajouter'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null) }}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-coplio-text px-4 py-2 rounded-lg border border-border">
                <X className="w-4 h-4" />Annuler
              </button>
            </div>
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
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCatFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!catFilter ? 'bg-coplio-green text-white' : 'bg-coplio-bg text-muted-foreground hover:text-coplio-text'}`}>
            Tous ({items.length})
          </button>
          {CATEGORIES.map(c => {
            const count = items.filter(p => p.categorie === c.value).length
            if (count === 0) return null
            return (
              <button key={c.value} onClick={() => setCatFilter(catFilter === c.value ? '' : c.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${catFilter === c.value ? 'bg-coplio-green text-white' : 'bg-coplio-bg text-muted-foreground hover:text-coplio-text'}`}>
                {c.label} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="coplio-card text-center py-12">
          <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-coplio-text mb-1">{items.length === 0 ? 'Aucun prestataire' : 'Aucun résultat'}</p>
          <p className="text-sm text-muted-foreground">{items.length === 0 ? 'Ajoutez vos prestataires habituels' : 'Modifiez votre recherche'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="coplio-card hover:border-coplio-green/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-coplio-green-light rounded-xl flex items-center justify-center flex-shrink-0 text-coplio-green">
                  {getCatIcon(p.categorie)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-coplio-text truncate">{p.nom}</p>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => startEdit(p)} className="p-1.5 text-muted-foreground hover:text-coplio-green transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 text-muted-foreground hover:text-coplio-red transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{getCatLabel(p.categorie)}</p>
                  <div className="mt-2 space-y-1">
                    {p.telephone && (
                      <a href={`tel:${p.telephone}`} className="flex items-center gap-1.5 text-sm text-coplio-text hover:text-coplio-green transition-colors">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />{p.telephone}
                      </a>
                    )}
                    {p.email && (
                      <a href={`mailto:${p.email}`} className="flex items-center gap-1.5 text-sm text-coplio-text hover:text-coplio-green transition-colors truncate">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />{p.email}
                      </a>
                    )}
                  </div>
                  {p.notes && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.notes}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
