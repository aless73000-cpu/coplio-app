'use client'

import { useState, useEffect } from 'react'
import { Plus, Wrench, Phone, Mail, Star, Pencil, Trash2, Loader2, X, Building2 } from 'lucide-react'

interface Prestataire {
  id: string
  nom: string
  metier?: string
  telephone?: string
  email?: string
  adresse?: string
  siret?: string
  note?: number
  commentaire?: string
  actif: boolean
}

const METIERS = [
  'Plomberie', 'Électricité', 'Menuiserie', 'Peinture', 'Maçonnerie',
  'Serrurerie', 'Ascensoriste', 'Chauffage/Climatisation', 'Jardinage',
  'Nettoyage', 'Assurance', 'Avocat', 'Autre',
]

function StarRating({ value, onChange }: { value?: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" onClick={() => onChange?.(s)}
          className={`transition-colors ${s <= (value ?? 0) ? 'text-amber-400' : 'text-gray-200'} ${onChange ? 'hover:text-amber-300 cursor-pointer' : 'cursor-default'}`}>
          <Star className="w-4 h-4 fill-current" />
        </button>
      ))}
    </div>
  )
}

function Modal({ open, onClose, onSave, initial }: {
  open: boolean; onClose: () => void
  onSave: (data: Partial<Prestataire>) => Promise<void>
  initial?: Prestataire | null
}) {
  const [form, setForm] = useState({
    nom: '', metier: '', telephone: '', email: '', adresse: '', siret: '', note: 0, commentaire: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initial) {
      setForm({
        nom: initial.nom, metier: initial.metier ?? '', telephone: initial.telephone ?? '',
        email: initial.email ?? '', adresse: initial.adresse ?? '', siret: initial.siret ?? '',
        note: initial.note ?? 0, commentaire: initial.commentaire ?? '',
      })
    } else {
      setForm({ nom: '', metier: '', telephone: '', email: '', adresse: '', siret: '', note: 0, commentaire: '' })
    }
  }, [initial, open])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({ ...form, note: form.note || undefined })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white">
          <h2 className="font-semibold text-coplio-text">{initial ? 'Modifier' : 'Ajouter'} un prestataire</h2>
          <button onClick={onClose} className="p-1 hover:bg-coplio-bg rounded-lg transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-coplio-text mb-1.5">Nom *</label>
              <input required value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">Métier</label>
              <select value={form.metier} onChange={e => setForm(f => ({ ...f, metier: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20 bg-white">
                <option value="">Sélectionner…</option>
                {METIERS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">SIRET</label>
              <input value={form.siret} onChange={e => setForm(f => ({ ...f, siret: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">Téléphone</label>
              <input type="tel" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-coplio-text mb-1.5">Adresse</label>
              <input value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-coplio-text mb-1.5">Note</label>
              <StarRating value={form.note} onChange={v => setForm(f => ({ ...f, note: v === f.note ? 0 : v }))} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-coplio-text mb-1.5">Commentaire</label>
              <textarea rows={3} value={form.commentaire} onChange={e => setForm(f => ({ ...f, commentaire: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20 resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-coplio-bg transition-colors">Annuler</button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-[#374151] text-white rounded-lg hover:bg-[#374151]/90 transition-colors disabled:opacity-60">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? 'Enregistrement…' : initial ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PrestatairesPage() {
  const [prestataires, setPrestataires] = useState<Prestataire[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Prestataire | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  async function load() {
    const res = await fetch('/api/prestataires')
    const data = await res.json()
    setPrestataires(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave(form: Partial<Prestataire>) {
    if (editing) {
      await fetch(`/api/prestataires/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
    } else {
      await fetch('/api/prestataires', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
    }
    setModalOpen(false)
    setEditing(null)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce prestataire ?')) return
    setDeleting(id)
    await fetch(`/api/prestataires/${id}`, { method: 'DELETE' })
    setDeleting(null)
    load()
  }

  const filtered = prestataires.filter(p =>
    p.nom.toLowerCase().includes(search.toLowerCase()) ||
    (p.metier ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Prestataires</h1>
          <p className="text-muted-foreground text-sm mt-1">Annuaire de vos fournisseurs et intervenants</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-[#374151] text-white text-sm font-medium rounded-xl hover:bg-[#374151]/90 transition-colors">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher par nom ou métier…"
        className="w-full max-w-sm px-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#374151]/20 bg-white" />

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="coplio-card text-center py-16">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Wrench className="w-7 h-7 text-[#374151]" />
          </div>
          <p className="font-medium text-coplio-text">{search ? 'Aucun résultat' : 'Aucun prestataire'}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {search ? 'Modifiez votre recherche' : 'Ajoutez votre premier prestataire pour constituer votre annuaire.'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="coplio-card space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-[#374151]" />
                  </div>
                  <div>
                    <p className="font-semibold text-coplio-text text-sm">{p.nom}</p>
                    {p.metier && <p className="text-xs text-muted-foreground">{p.metier}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(p); setModalOpen(true) }}
                    className="p-1.5 hover:bg-coplio-bg rounded-lg transition-colors text-muted-foreground hover:text-coplio-text">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-muted-foreground hover:text-red-500">
                    {deleting === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {p.note && <StarRating value={p.note} />}

              <div className="space-y-1.5">
                {p.telephone && (
                  <a href={`tel:${p.telephone}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-[#374151] transition-colors">
                    <Phone className="w-3.5 h-3.5" /> {p.telephone}
                  </a>
                )}
                {p.email && (
                  <a href={`mailto:${p.email}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-[#374151] transition-colors">
                    <Mail className="w-3.5 h-3.5" /> {p.email}
                  </a>
                )}
              </div>

              {p.commentaire && (
                <p className="text-xs text-muted-foreground border-t border-border pt-2 line-clamp-2">{p.commentaire}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={handleSave} initial={editing} />
    </div>
  )
}
