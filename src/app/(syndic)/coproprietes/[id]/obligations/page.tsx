'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Shield, Loader2, Trash2, AlertTriangle, CheckCircle2, Clock, Edit2, Check, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const OBLIGATIONS_DEFAULT = [
  'DPE (Diagnostic de Performance Énergétique)',
  'Diagnostic amiante',
  'Diagnostic plomb (CREP)',
  'Contrôle ascenseur',
  'Assurance immeuble',
  'Vérification extincteurs',
  'Contrôle électrique parties communes',
  'Diagnostic termites',
  'Carnet d\'entretien (mise à jour)',
  'Fonds travaux (loi Alur)',
]

interface Obligation {
  id: string; type: string; description?: string
  date_realisation?: string; date_expiration?: string; notes?: string
}

function getStatut(exp?: string): 'ok' | 'bientot' | 'expire' | 'inconnu' {
  if (!exp) return 'inconnu'
  const diff = new Date(exp).getTime() - Date.now()
  const days = diff / (1000 * 60 * 60 * 24)
  if (days < 0) return 'expire'
  if (days < 60) return 'bientot'
  return 'ok'
}

const STATUT_CONFIG = {
  ok: { label: 'À jour', color: 'text-coplio-green bg-coplio-green-light', icon: CheckCircle2 },
  bientot: { label: 'Bientôt', color: 'text-amber-600 bg-amber-50', icon: Clock },
  expire: { label: 'Expiré', color: 'text-coplio-red bg-red-50', icon: AlertTriangle },
  inconnu: { label: 'Non renseigné', color: 'text-muted-foreground bg-coplio-bg', icon: Shield },
}

const emptyForm = { type: '', date_realisation: '', date_expiration: '', notes: '' }

export default function ObligationsPage() {
  const { id: coproprieteId } = useParams<{ id: string }>()
  const [items, setItems] = useState<Obligation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [customType, setCustomType] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/obligations-legales?copropriete_id=${coproprieteId}`)
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [coproprieteId])

  useEffect(() => { load() }, [load])

  // Générer la checklist complète (obligations existantes + manquantes)
  const existingTypes = new Set(items.map(i => i.type))
  const missing = OBLIGATIONS_DEFAULT.filter(o => !existingTypes.has(o))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const typeVal = form.type === '__custom' ? customType : form.type
    if (!typeVal) { setSaving(false); return }

    const url = editId ? `/api/obligations-legales/${editId}` : '/api/obligations-legales'
    const method = editId ? 'PATCH' : 'POST'
    const body = editId
      ? { date_realisation: form.date_realisation || null, date_expiration: form.date_expiration || null, notes: form.notes || undefined }
      : { copropriete_id: coproprieteId, type: typeVal, date_realisation: form.date_realisation || null, date_expiration: form.date_expiration || null, notes: form.notes || undefined }

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setSaving(false)
    if (res.ok) {
      const saved = await res.json()
      if (editId) setItems(prev => prev.map(i => i.id === editId ? saved : i))
      else setItems(prev => [...prev, saved])
      setShowForm(false); setEditId(null); setForm(emptyForm); setCustomType('')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ?')) return
    await fetch(`/api/obligations-legales/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function startEdit(item: Obligation) {
    setEditId(item.id)
    setForm({ type: item.type, date_realisation: item.date_realisation?.slice(0, 10) ?? '', date_expiration: item.date_expiration?.slice(0, 10) ?? '', notes: item.notes ?? '' })
    setShowForm(true)
  }

  async function addMissing(type: string) {
    const res = await fetch('/api/obligations-legales', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ copropriete_id: coproprieteId, type }),
    })
    if (res.ok) { const data = await res.json(); setItems(prev => [...prev, data]) }
  }

  const expireSoon = items.filter(i => getStatut(i.date_expiration) === 'expire' || getStatut(i.date_expiration) === 'bientot').length

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href={`/coproprietes/${coproprieteId}`} className="text-muted-foreground hover:text-coplio-text transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-coplio-text">Obligations légales</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Diagnostics, contrôles et assurances obligatoires</p>
        </div>
        <button onClick={() => { setShowForm(v => !v); setEditId(null); setForm(emptyForm) }}
          className="flex items-center gap-2 bg-coplio-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-coplio-green/90 transition-colors">
          <Plus className="w-4 h-4" />Ajouter
        </button>
      </div>

      {/* Alertes */}
      {expireSoon > 0 && (
        <div className="coplio-card border-amber-200 bg-amber-50 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-700 font-medium">{expireSoon} obligation{expireSoon > 1 ? 's' : ''} expirée{expireSoon > 1 ? 's' : ''} ou bientôt à renouveler</p>
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <div className="coplio-card">
          <h2 className="font-semibold text-coplio-text mb-4">{editId ? 'Modifier' : 'Nouvelle obligation'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editId && (
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} required
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green bg-white">
                  <option value="">— Sélectionner —</option>
                  {OBLIGATIONS_DEFAULT.map(o => <option key={o} value={o}>{o}</option>)}
                  <option value="__custom">Autre (personnalisé)</option>
                </select>
                {form.type === '__custom' && (
                  <input value={customType} onChange={e => setCustomType(e.target.value)} placeholder="Nom de l'obligation" required
                    className="w-full mt-2 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green" />
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Date de réalisation</label>
                <input type="date" value={form.date_realisation} onChange={e => setForm(f => ({ ...f, date_realisation: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green" />
              </div>
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Date d&apos;expiration</label>
                <input type="date" value={form.date_expiration} onChange={e => setForm(f => ({ ...f, date_expiration: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 bg-coplio-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-coplio-green/90 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editId ? 'Enregistrer' : 'Ajouter'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null) }}
                className="flex items-center gap-2 text-sm text-muted-foreground px-4 py-2 rounded-lg border border-border">
                <X className="w-4 h-4" />Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {/* Obligations existantes */}
          {items.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-coplio-text">Suivi ({items.length})</p>
              {items.map(item => {
                const statut = getStatut(item.date_expiration)
                const cfg = STATUT_CONFIG[statut]
                const CfgIcon = cfg.icon
                return (
                  <div key={item.id} className="coplio-card flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                      <CfgIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-coplio-text text-sm truncate">{item.type}</p>
                      <div className="flex flex-wrap gap-2 mt-0.5 text-xs text-muted-foreground">
                        {item.date_realisation && <span>Réalisé : {formatDate(item.date_realisation)}</span>}
                        {item.date_expiration && (
                          <span className={statut !== 'ok' ? 'font-medium text-amber-600' : ''}>
                            Expire : {formatDate(item.date_expiration)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.color}`}>{cfg.label}</span>
                    <button onClick={() => startEdit(item)} className="p-1.5 text-muted-foreground hover:text-coplio-green transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-muted-foreground hover:text-coplio-red transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Obligations manquantes */}
          {missing.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">À compléter ({missing.length})</p>
              {missing.map(type => (
                <div key={type} className="coplio-card flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                  <div className="w-9 h-9 rounded-xl bg-coplio-bg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="flex-1 text-sm text-coplio-text">{type}</p>
                  <button onClick={() => addMissing(type)}
                    className="text-xs text-coplio-green hover:bg-coplio-green-light px-2.5 py-1.5 rounded-lg transition-colors font-medium flex-shrink-0">
                    + Renseigner
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
