'use client'

import { useState, useEffect } from 'react'
import { Plus, BookOpen, Wrench, Loader2, X, ChevronDown, CalendarDays, Euro, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'

interface Prestataire { id: string; nom: string; categorie?: string }
interface Copropriete { id: string; nom: string }
interface Entree {
  id: string; titre: string; description?: string
  categorie: string; statut: string
  date_intervention?: string; cout_prevu?: number; cout_reel?: number
  periodicite?: string; prochaine_echeance?: string
  prestataire_id?: string
  prestataire?: Prestataire | null
  copropriete_id?: string
  copropriete?: Copropriete | null
}

const CATEGORIES = [
  { value: 'entretien', label: 'Entretien', color: 'bg-blue-50 text-blue-600' },
  { value: 'reparation', label: 'Réparation', color: 'bg-amber-50 text-amber-600' },
  { value: 'controle', label: 'Contrôle', color: 'bg-purple-50 text-purple-600' },
  { value: 'renovation', label: 'Rénovation', color: 'bg-green-50 text-green-600' },
  { value: 'urgence', label: 'Urgence', color: 'bg-red-50 text-red-600' },
  { value: 'autre', label: 'Autre', color: 'bg-gray-50 text-gray-600' },
]

const STATUTS = [
  { value: 'planifie', label: 'Planifié', icon: Clock, color: 'text-blue-600 bg-blue-50' },
  { value: 'en_cours', label: 'En cours', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
  { value: 'realise', label: 'Réalisé', icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
  { value: 'annule', label: 'Annulé', icon: X, color: 'text-gray-400 bg-gray-50' },
]

const PERIODICITES = ['unique', 'mensuel', 'trimestriel', 'semestriel', 'annuel', 'pluriannuel']

function StatutBadge({ statut }: { statut: string }) {
  const s = STATUTS.find(x => x.value === statut) ?? STATUTS[0]
  const Icon = s.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
      <Icon className="w-3 h-3" /> {s.label}
    </span>
  )
}

function CategorieBadge({ cat }: { cat: string }) {
  const c = CATEGORIES.find(x => x.value === cat) ?? CATEGORIES[5]
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${c.color}`}>{c.label}</span>
}

function Modal({ open, onClose, onSave, coproprietes, prestataires }: {
  open: boolean; onClose: () => void
  onSave: (data: Partial<Entree>) => Promise<void>
  coproprietes: Copropriete[]; prestataires: Prestataire[]
}) {
  const [form, setForm] = useState({
    copropriete_id: '', prestataire_id: '', titre: '', description: '',
    categorie: 'entretien', statut: 'planifie', date_intervention: '',
    cout_prevu: '', periodicite: 'unique', prochaine_echeance: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) setForm({ copropriete_id: '', prestataire_id: '', titre: '', description: '',
      categorie: 'entretien', statut: 'planifie', date_intervention: '',
      cout_prevu: '', periodicite: 'unique', prochaine_echeance: '' })
  }, [open])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({
      ...form,
      cout_prevu: form.cout_prevu ? Number(form.cout_prevu) : undefined,
      prestataire_id: form.prestataire_id || undefined,
      prochaine_echeance: form.prochaine_echeance || undefined,
    })
    setSaving(false)
  }

  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div><label className="block text-sm font-medium text-coplio-text mb-1.5">{label}</label>{children}</div>
  )
  const inputCls = "w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green bg-white"

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white">
          <h2 className="font-semibold text-coplio-text">Nouvelle entrée</h2>
          <button onClick={onClose} className="p-1 hover:bg-coplio-bg rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <F label="Copropriété *">
            <select required value={form.copropriete_id} onChange={e => setForm(f => ({ ...f, copropriete_id: e.target.value }))} className={inputCls}>
              <option value="">Sélectionner…</option>
              {coproprietes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </F>
          <F label="Titre *">
            <input required value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} className={inputCls} />
          </F>
          <div className="grid grid-cols-2 gap-4">
            <F label="Catégorie">
              <select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))} className={inputCls}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </F>
            <F label="Statut">
              <select value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))} className={inputCls}>
                {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </F>
            <F label="Date intervention">
              <input type="date" value={form.date_intervention} onChange={e => setForm(f => ({ ...f, date_intervention: e.target.value }))} className={inputCls} />
            </F>
            <F label="Coût prévu (€)">
              <input type="number" min="0" step="0.01" value={form.cout_prevu} onChange={e => setForm(f => ({ ...f, cout_prevu: e.target.value }))} className={inputCls} />
            </F>
            <F label="Périodicité">
              <select value={form.periodicite} onChange={e => setForm(f => ({ ...f, periodicite: e.target.value }))} className={inputCls}>
                {PERIODICITES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </F>
            <F label="Prochaine échéance">
              <input type="date" value={form.prochaine_echeance} onChange={e => setForm(f => ({ ...f, prochaine_echeance: e.target.value }))} className={inputCls} />
            </F>
          </div>
          <F label="Prestataire">
            <select value={form.prestataire_id} onChange={e => setForm(f => ({ ...f, prestataire_id: e.target.value }))} className={inputCls}>
              <option value="">Aucun</option>
              {prestataires.map(p => <option key={p.id} value={p.id}>{p.nom}{p.categorie ? ` — ${p.categorie}` : ''}</option>)}
            </select>
          </F>
          <F label="Description">
            <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className={`${inputCls} resize-none`} />
          </F>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-coplio-bg">Annuler</button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-coplio-green text-white rounded-lg hover:bg-coplio-green/90 disabled:opacity-60">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? 'Enregistrement…' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CarnetEntretienPage() {
  const [entrees, setEntrees] = useState<Entree[]>([])
  const [coproprietes, setCoproprietes] = useState<Copropriete[]>([])
  const [prestataires, setPrestataires] = useState<Prestataire[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [filterStatut, setFilterStatut] = useState('')
  const [filterCopro, setFilterCopro] = useState('')

  async function load() {
    const [e, c, p] = await Promise.all([
      fetch('/api/carnet-entretien').then(r => r.json()),
      fetch('/api/coproprietes').then(r => r.json()),
      fetch('/api/prestataires').then(r => r.json()),
    ])
    setEntrees(e)
    setCoproprietes(Array.isArray(c) ? c : (c.coproprietes ?? []))
    setPrestataires(p)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave(data: Partial<Entree>) {
    await fetch('/api/carnet-entretien', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    setModalOpen(false)
    load()
  }

  async function handleStatut(id: string, statut: string) {
    await fetch(`/api/carnet-entretien/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut, ...(statut === 'realise' ? { date_realisation: new Date().toISOString().slice(0, 10) } : {}) }),
    })
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette entrée ?')) return
    await fetch(`/api/carnet-entretien/${id}`, { method: 'DELETE' })
    load()
  }

  const filtered = entrees.filter(e =>
    (!filterStatut || e.statut === filterStatut) &&
    (!filterCopro || e.copropriete?.id === filterCopro)
  )

  const stats = {
    total: entrees.length,
    planifie: entrees.filter(e => e.statut === 'planifie').length,
    en_cours: entrees.filter(e => e.statut === 'en_cours').length,
    realise: entrees.filter(e => e.statut === 'realise').length,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Carnet d&apos;entretien</h1>
          <p className="text-muted-foreground text-sm mt-1">Historique et planification des interventions</p>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-coplio-green text-white text-sm font-medium rounded-xl hover:bg-coplio-green/90 transition-colors">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Planifiés', value: stats.planifie, color: 'text-blue-600 bg-blue-50' },
          { label: 'En cours', value: stats.en_cours, color: 'text-amber-600 bg-amber-50' },
          { label: 'Réalisés', value: stats.realise, color: 'text-green-600 bg-green-50' },
        ].map(s => (
          <div key={s.label} className="coplio-card text-center py-4">
            <p className={`text-3xl font-bold ${s.color.split(' ')[0]}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-coplio-green">
          <option value="">Tous les statuts</option>
          {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={filterCopro} onChange={e => setFilterCopro(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-coplio-green">
          <option value="">Toutes les copropriétés</option>
          {coproprietes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="coplio-card text-center py-16">
          <div className="w-14 h-14 bg-coplio-green-light rounded-full flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-7 h-7 text-coplio-green" />
          </div>
          <p className="font-medium text-coplio-text">Carnet vide</p>
          <p className="text-sm text-muted-foreground mt-1">Ajoutez la première intervention pour commencer.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(e => (
            <div key={e.id} className="coplio-card">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-coplio-green-light rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Wrench className="w-5 h-5 text-coplio-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-coplio-text text-sm">{e.titre}</p>
                      {e.copropriete && <p className="text-xs text-muted-foreground mt-0.5">{e.copropriete.nom}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <CategorieBadge cat={e.categorie} />
                      <StatutBadge statut={e.statut} />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    {e.date_intervention && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="w-3 h-3" />
                        {new Date(e.date_intervention).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                    {e.cout_prevu && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Euro className="w-3 h-3" />
                        {e.cout_prevu.toLocaleString('fr-FR')} €
                      </span>
                    )}
                    {e.prestataire && (
                      <span className="text-xs text-muted-foreground">{e.prestataire.nom}</span>
                    )}
                    {e.prochaine_echeance && (
                      <span className="flex items-center gap-1 text-xs text-amber-600">
                        <Clock className="w-3 h-3" />
                        Prochain : {new Date(e.prochaine_echeance).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>

                  {e.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{e.description}</p>}
                </div>

                <div className="flex gap-1 flex-shrink-0">
                  {e.statut !== 'realise' && (
                    <button onClick={() => handleStatut(e.id, 'realise')}
                      className="p-1.5 hover:bg-green-50 rounded-lg transition-colors text-muted-foreground hover:text-green-600" title="Marquer réalisé">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(e.id)}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-muted-foreground hover:text-red-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        onSave={handleSave} coproprietes={coproprietes} prestataires={prestataires} />
    </div>
  )
}
