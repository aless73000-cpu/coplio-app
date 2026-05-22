'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Building2, MapPin, Home, AlertTriangle, CreditCard, Map, List, Plus, Wand2, FileSpreadsheet, Loader2, Trash2, Target, TrendingUp, Phone, Mail } from 'lucide-react'
import { formatEuro } from '@/lib/utils'
import type { Copropriete } from '@/types'

interface Prospect {
  id: string
  nom: string
  adresse?: string
  ville?: string
  nb_lots: number
  contact_nom?: string
  contact_email?: string
  contact_telephone?: string
  statut: string
  probabilite: number
  montant_potentiel: number
  notes?: string
  prochain_rdv?: string
}

const STATUT_PIPELINE = [
  { key: 'lead', label: 'Lead', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { key: 'contact', label: 'Contact établi', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'proposition', label: 'Proposition', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'nego', label: 'Négociation', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { key: 'gagne', label: 'Gagné', color: 'bg-coplio-green-light text-coplio-green border-coplio-green/20' },
  { key: 'perdu', label: 'Perdu', color: 'bg-red-50 text-red-700 border-red-200' },
]

interface Props {
  coproprietes: Copropriete[]
}

export function CoproprietesClient({ coproprietes }: Props) {
  const [view, setView] = useState<'liste' | 'carte' | 'prospects'>('liste')
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loadingProspects, setLoadingProspects] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nom: '', adresse: '', ville: '', nb_lots: '', contact_nom: '', contact_email: '', contact_telephone: '', statut: 'lead', probabilite: '20', montant_potentiel: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const loadProspects = useCallback(async () => {
    setLoadingProspects(true)
    try {
      const res = await fetch('/api/prospects')
      const data = await res.json()
      setProspects(Array.isArray(data) ? data : [])
    } finally {
      setLoadingProspects(false)
    }
  }, [])

  useEffect(() => {
    if (view === 'prospects') loadProspects()
  }, [view, loadProspects])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/prospects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, nb_lots: Number(form.nb_lots) || 0, probabilite: Number(form.probabilite) || 0, montant_potentiel: Number(form.montant_potentiel) || 0 }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) {
      setProspects(prev => [data, ...prev])
      setShowForm(false)
      setForm({ nom: '', adresse: '', ville: '', nb_lots: '', contact_nom: '', contact_email: '', contact_telephone: '', statut: 'lead', probabilite: '20', montant_potentiel: '', notes: '' })
    }
  }

  async function handleUpdateStatut(id: string, statut: string) {
    await fetch(`/api/prospects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ statut }) })
    setProspects(prev => prev.map(p => p.id === id ? { ...p, statut } : p))
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce prospect ?')) return
    await fetch(`/api/prospects/${id}`, { method: 'DELETE' })
    setProspects(prev => prev.filter(p => p.id !== id))
  }

  const totalPotentiel = prospects.filter(p => p.statut !== 'perdu').reduce((s, p) => s + p.montant_potentiel, 0)
  const nbGagnes = prospects.filter(p => p.statut === 'gagne').length

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 bg-coplio-bg p-1 rounded-xl">
          <button onClick={() => setView('liste')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === 'liste' ? 'bg-white text-coplio-text shadow-sm' : 'text-muted-foreground hover:text-coplio-text'}`}>
            <List className="w-4 h-4" />Liste
          </button>
          <button onClick={() => setView('carte')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === 'carte' ? 'bg-white text-coplio-text shadow-sm' : 'text-muted-foreground hover:text-coplio-text'}`}>
            <Map className="w-4 h-4" />Carte
          </button>
          <button onClick={() => setView('prospects')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === 'prospects' ? 'bg-white text-coplio-text shadow-sm' : 'text-muted-foreground hover:text-coplio-text'}`}>
            <Target className="w-4 h-4" />Prospects
          </button>
        </div>
      </div>

      {/* LISTE */}
      {view === 'liste' && (
        coproprietes.length === 0 ? (
          <div className="coplio-card text-center py-16">
            <div className="w-16 h-16 bg-coplio-green-light rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-coplio-green" />
            </div>
            <h3 className="text-lg font-semibold text-coplio-text mb-2">Aucune copropriété</h3>
            <p className="text-muted-foreground text-sm mb-6">Ajoutez votre première copropriété pour commencer.</p>
            <Link href="/coproprietes/new" className="inline-flex items-center gap-2 bg-coplio-green text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-coplio-green/90 transition-colors">
              <Plus className="w-4 h-4" />Ajouter
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {coproprietes.map(c => <CoproprieteCard key={c.id} copropriete={c} />)}
          </div>
        )
      )}

      {/* CARTE */}
      {view === 'carte' && (
        <div className="space-y-4">
          <div className="coplio-card bg-gradient-to-br from-blue-50 to-coplio-green-light border-blue-200/50 relative overflow-hidden min-h-[400px]">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-semibold text-coplio-text mb-4 flex items-center gap-2">
                <Map className="w-4 h-4 text-coplio-green" />{coproprietes.length} copropriété{coproprietes.length > 1 ? 's' : ''} dans votre portefeuille
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {coproprietes.map(c => {
                  const cfg = c.statut === 'urgent' ? 'bg-red-500' : c.statut === 'attention' ? 'bg-amber-400' : 'bg-coplio-green'
                  return (
                    <Link key={c.id} href={`/coproprietes/${c.id}`}
                      className="bg-white rounded-xl p-3 border border-white/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group">
                      <div className="flex items-start gap-2">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${cfg}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-coplio-text group-hover:text-coplio-green transition-colors truncate">{c.nom}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{c.ville ? `${c.code_postal ?? ''} ${c.ville}`.trim() : c.adresse ?? '—'}</span>
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-0.5"><Home className="w-3 h-3" />{c.nb_lots}</span>
                            {(c.montant_impayes ?? 0) > 0 && <span className="text-coplio-red font-medium">{formatEuro(c.montant_impayes ?? 0)}</span>}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-coplio-green inline-block" /> À jour</span>
            {' · '}
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Attention</span>
            {' · '}
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Urgent</span>
          </p>
        </div>
      )}

      {/* PROSPECTS */}
      {view === 'prospects' && (
        <div className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <div className="coplio-card text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Prospects actifs</p>
              <p className="text-xl font-bold text-coplio-text">{prospects.filter(p => p.statut !== 'perdu').length}</p>
            </div>
            <div className="coplio-card text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Potentiel pipeline</p>
              <p className="text-xl font-bold text-coplio-green">{formatEuro(totalPotentiel)}</p>
            </div>
            <div className="coplio-card text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Gagnés</p>
              <p className="text-xl font-bold text-coplio-green">{nbGagnes}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-coplio-text flex items-center gap-2">
              <Target className="w-4 h-4 text-coplio-green" />CRM Prospects
            </h3>
            <button onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-2 bg-coplio-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-coplio-green/90 transition-colors">
              <Plus className="w-4 h-4" />Nouveau prospect
            </button>
          </div>

          {showForm && (
            <div className="coplio-card">
              <h3 className="font-semibold text-coplio-text mb-4">Nouveau prospect</h3>
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Nom de la copropriété *" required
                    className="col-span-2 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green" />
                  <input value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} placeholder="Adresse"
                    className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green" />
                  <input value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))} placeholder="Ville"
                    className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green" />
                  <input type="number" value={form.nb_lots} onChange={e => setForm(f => ({ ...f, nb_lots: e.target.value }))} placeholder="Nombre de lots"
                    className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green" />
                  <select value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}
                    className="px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-coplio-green">
                    {STATUT_PIPELINE.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                  <input value={form.contact_nom} onChange={e => setForm(f => ({ ...f, contact_nom: e.target.value }))} placeholder="Contact (nom)"
                    className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green" />
                  <input value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} placeholder="Email contact" type="email"
                    className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green" />
                  <input value={form.contact_telephone} onChange={e => setForm(f => ({ ...f, contact_telephone: e.target.value }))} placeholder="Téléphone"
                    className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green" />
                  <input type="number" value={form.montant_potentiel} onChange={e => setForm(f => ({ ...f, montant_potentiel: e.target.value }))} placeholder="Honoraires potentiels (€/an)"
                    className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green" />
                </div>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes"
                  rows={2} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green resize-none" />
                <div className="flex gap-2">
                  <button type="submit" disabled={saving}
                    className="flex items-center gap-2 bg-coplio-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-coplio-green/90 disabled:opacity-60">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}Ajouter
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="text-sm text-muted-foreground px-4 py-2 border border-border rounded-lg">Annuler</button>
                </div>
              </form>
            </div>
          )}

          {loadingProspects ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : prospects.length === 0 ? (
            <div className="coplio-card text-center py-12">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-coplio-text">Aucun prospect</p>
              <p className="text-sm text-muted-foreground mt-1">Ajoutez les copropriétés que vous souhaitez conquérir</p>
            </div>
          ) : (
            <div className="space-y-3">
              {STATUT_PIPELINE.filter(s => prospects.some(p => p.statut === s.key)).map(stage => (
                <div key={stage.key}>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{stage.label} ({prospects.filter(p => p.statut === stage.key).length})</h4>
                  <div className="space-y-2">
                    {prospects.filter(p => p.statut === stage.key).map(p => (
                      <div key={p.id} className="coplio-card flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${stage.color}`}>
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-coplio-text text-sm">{p.nom}</p>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-0.5">
                            {p.ville && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{p.ville}</span>}
                            {p.nb_lots > 0 && <span className="flex items-center gap-0.5"><Home className="w-3 h-3" />{p.nb_lots} lots</span>}
                            {p.montant_potentiel > 0 && <span className="flex items-center gap-0.5 text-coplio-green font-medium"><TrendingUp className="w-3 h-3" />{formatEuro(p.montant_potentiel)}/an</span>}
                          </div>
                          {p.contact_nom && (
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-0.5">
                              <span>{p.contact_nom}</span>
                              {p.contact_email && <span className="flex items-center gap-0.5"><Mail className="w-3 h-3" />{p.contact_email}</span>}
                              {p.contact_telephone && <span className="flex items-center gap-0.5"><Phone className="w-3 h-3" />{p.contact_telephone}</span>}
                            </div>
                          )}
                          {p.notes && <p className="text-xs text-muted-foreground mt-1 italic">{p.notes}</p>}
                        </div>
                        <div className="flex flex-col gap-1 flex-shrink-0 items-end">
                          <select value={p.statut} onChange={e => handleUpdateStatut(p.id, e.target.value)}
                            className="text-xs border border-border rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-coplio-green">
                            {STATUT_PIPELINE.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                          </select>
                          <button onClick={() => handleDelete(p.id)} className="p-1 text-muted-foreground hover:text-coplio-red transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CoproprieteCard({ copropriete }: { copropriete: Copropriete }) {
  const statusConfig = {
    a_jour: { cls: 'badge-a-jour', label: 'À jour' },
    attention: { cls: 'badge-attention', label: 'Attention' },
    urgent: { cls: 'badge-urgent', label: 'Urgent' },
  }
  const { cls, label } = statusConfig[copropriete.statut as keyof typeof statusConfig] ?? statusConfig.a_jour

  return (
    <div className="coplio-card hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col">
      <Link href={`/coproprietes/${copropriete.id}`} className="flex-1 group">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 bg-coplio-green-light rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-coplio-green" />
          </div>
          <span className={cls}>{label}</span>
        </div>
        <h3 className="font-semibold text-coplio-text group-hover:text-coplio-green transition-colors mb-1">{copropriete.nom}</h3>
        {(copropriete.ville || copropriete.adresse) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
            <MapPin className="w-3 h-3" />
            {copropriete.ville ? `${copropriete.code_postal ? copropriete.code_postal + ' ' : ''}${copropriete.ville}` : copropriete.adresse}
          </div>
        )}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
          <StatItem icon={Home} label="Lots" value={copropriete.nb_lots ?? 0} />
          <StatItem icon={AlertTriangle} label="Sinistres" value={copropriete.nb_sinistres_ouverts ?? 0} alert={(copropriete.nb_sinistres_ouverts ?? 0) > 0} />
          <StatItem icon={CreditCard} label="Impayés" value={(copropriete.montant_impayes ?? 0) > 0 ? formatEuro(copropriete.montant_impayes ?? 0) : '0'} alert={(copropriete.montant_impayes ?? 0) > 0} />
        </div>
      </Link>
      <div className="flex gap-2 mt-3 pt-3 border-t border-border">
        <Link href={`/coproprietes/${copropriete.id}/lots/generer`}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-coplio-blue bg-coplio-blue-bg px-2.5 py-1.5 rounded-lg hover:bg-coplio-blue/10 transition-colors">
          <Wand2 className="w-3 h-3" />Génération lots
        </Link>
        <Link href={`/coproprietes/${copropriete.id}/lots/import`}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground bg-coplio-bg border border-border px-2.5 py-1.5 rounded-lg hover:bg-border transition-colors">
          <FileSpreadsheet className="w-3 h-3" />Import Excel
        </Link>
      </div>
    </div>
  )
}

function StatItem({ icon: Icon, label, value, alert }: { icon: React.ElementType; label: string; value: string | number; alert?: boolean }) {
  return (
    <div className="text-center">
      <Icon className={`w-3.5 h-3.5 mx-auto mb-1 ${alert ? 'text-coplio-amber' : 'text-muted-foreground'}`} />
      <p className={`text-sm font-bold ${alert ? 'text-coplio-amber' : 'text-coplio-text'}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  )
}
