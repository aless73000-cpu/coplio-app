'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Key, Badge, Lock, Radio, Loader2, Trash2, Check, RotateCcw } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const TYPES = [
  { value: 'cle', label: 'Clé', icon: Key },
  { value: 'badge', label: 'Badge', icon: Badge },
  { value: 'code', label: 'Code', icon: Lock },
  { value: 'telecommande', label: 'Télécommande', icon: Radio },
  { value: 'autre', label: 'Autre', icon: Key },
]

interface CleAcces {
  id: string; type: string; description: string; localisation?: string
  detenteur_nom?: string; detenteur?: { prenom: string; nom: string } | null
  date_remise?: string; retourne: boolean; notes?: string
}

const emptyForm = { type: 'cle', description: '', localisation: '', detenteur_nom: '', date_remise: '', notes: '' }

export default function ClesPage() {
  const { id: coproprieteId } = useParams<{ id: string }>()
  const [items, setItems] = useState<CleAcces[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterRetourne, setFilterRetourne] = useState<boolean | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/cles-acces?copropriete_id=${coproprieteId}`)
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [coproprieteId])

  useEffect(() => { load() }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const res = await fetch('/api/cles-acces', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        copropriete_id: coproprieteId, type: form.type, description: form.description,
        localisation: form.localisation || undefined, detenteur_nom: form.detenteur_nom || undefined,
        date_remise: form.date_remise ? new Date(form.date_remise).toISOString() : null,
        notes: form.notes || undefined,
      }),
    })
    setSaving(false)
    if (res.ok) { const data = await res.json(); setItems(prev => [data, ...prev]); setShowForm(false); setForm(emptyForm) }
  }

  async function toggleRetourne(id: string, current: boolean) {
    const res = await fetch(`/api/cles-acces/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ retourne: !current }),
    })
    if (res.ok) { const data = await res.json(); setItems(prev => prev.map(i => i.id === id ? data : i)) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet accès ?')) return
    await fetch(`/api/cles-acces/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const filtered = items.filter(i => filterRetourne === null || i.retourne === filterRetourne)
  const enCirculation = items.filter(i => !i.retourne).length
  const retournes = items.filter(i => i.retourne).length

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href={`/coproprietes/${coproprieteId}`} className="text-muted-foreground hover:text-coplio-text transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-coplio-text">Clés & accès</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Registre numérique des accès</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-coplio-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-coplio-green/90 transition-colors">
          <Plus className="w-4 h-4" />Ajouter
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="coplio-card text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total</p>
          <p className="text-xl font-bold text-coplio-text">{items.length}</p>
        </div>
        <div className="coplio-card text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">En circulation</p>
          <p className="text-xl font-bold text-amber-600">{enCirculation}</p>
        </div>
        <div className="coplio-card text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Retournés</p>
          <p className="text-xl font-bold text-coplio-green">{retournes}</p>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="coplio-card">
          <h2 className="font-semibold text-coplio-text mb-4">Nouvel accès</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-coplio-text mb-2">Type</label>
              <div className="flex flex-wrap gap-2">
                {TYPES.map(t => (
                  <button key={t.value} type="button" onClick={() => setForm(f => ({ ...f, type: t.value }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border-2 transition-all ${form.type === t.value ? 'border-coplio-green bg-coplio-green-light text-coplio-green' : 'border-border text-muted-foreground'}`}>
                    <t.icon className="w-3.5 h-3.5" />{t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Description *</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required
                  placeholder="Ex: Clé cave n°3" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green" />
              </div>
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Localisation</label>
                <input value={form.localisation} onChange={e => setForm(f => ({ ...f, localisation: e.target.value }))}
                  placeholder="Ex: Parking, local vélos..." className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green" />
              </div>
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Détenteur</label>
                <input value={form.detenteur_nom} onChange={e => setForm(f => ({ ...f, detenteur_nom: e.target.value }))}
                  placeholder="Nom du détenteur" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green" />
              </div>
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Date de remise</label>
                <input type="date" value={form.date_remise} onChange={e => setForm(f => ({ ...f, date_remise: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 bg-coplio-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-coplio-green/90 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Enregistrer
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-muted-foreground px-4 py-2 rounded-lg border border-border">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2">
        {[{ label: 'Tous', val: null }, { label: 'En circulation', val: false }, { label: 'Retournés', val: true }].map(f => (
          <button key={String(f.val)} onClick={() => setFilterRetourne(f.val)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filterRetourne === f.val ? 'bg-coplio-green text-white' : 'bg-coplio-bg text-muted-foreground hover:text-coplio-text'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="coplio-card text-center py-12">
          <Key className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-coplio-text">Aucun accès enregistré</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => {
            const typeConfig = TYPES.find(t => t.value === item.type) ?? TYPES[0]
            const TypeIcon = typeConfig.icon
            return (
              <div key={item.id} className={`coplio-card flex items-center gap-3 ${item.retourne ? 'opacity-60' : ''}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.retourne ? 'bg-coplio-bg' : 'bg-coplio-green-light'}`}>
                  <TypeIcon className={`w-4 h-4 ${item.retourne ? 'text-muted-foreground' : 'text-coplio-green'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-coplio-text text-sm">{item.description}</p>
                  <div className="flex flex-wrap gap-2 mt-0.5 text-xs text-muted-foreground">
                    {item.localisation && <span>{item.localisation}</span>}
                    {(item.detenteur_nom || item.detenteur) && (
                      <span>→ {item.detenteur ? `${item.detenteur.prenom} ${item.detenteur.nom}` : item.detenteur_nom}</span>
                    )}
                    {item.date_remise && <span>Remis le {formatDate(item.date_remise)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => toggleRetourne(item.id, item.retourne)}
                    className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                      item.retourne ? 'bg-coplio-bg text-muted-foreground hover:bg-coplio-green-light hover:text-coplio-green' : 'bg-coplio-green-light text-coplio-green hover:bg-coplio-green hover:text-white'
                    }`}>
                    {item.retourne ? <><RotateCcw className="w-3.5 h-3.5" />Redonner</> : <><Check className="w-3.5 h-3.5" />Retourné</>}
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 text-muted-foreground hover:text-coplio-red transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
