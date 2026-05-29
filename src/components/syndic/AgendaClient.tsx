'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CalendarDays, Clock, MapPin, CreditCard, Wrench, ChevronRight,
  Plus, X, Loader2, User, CalendarCheck, Bell, Car, Coffee, Route, GripVertical, CheckCircle2
} from 'lucide-react'

interface SystemEvent {
  id: string
  type: 'ag' | 'echeance' | 'sinistre'
  titre: string
  sous_titre?: string
  date: string
  lien: string
  statut?: string
}

interface CustomEvent {
  id: string
  titre: string
  description?: string
  type: string
  date_debut: string
  date_fin?: string
  lieu?: string
  assignee?: { id: string; prenom: string; nom: string } | null
  copropriete?: { id: string; nom: string } | null
}

interface Props {
  systemEvents: SystemEvent[]
  customEvents: CustomEvent[]
  coproprietes: { id: string; nom: string }[]
  gestionnaires: { id: string; prenom: string; nom: string }[]
}

const TYPES_CUSTOM = [
  { value: 'visite', label: 'Visite', icon: Car },
  { value: 'ag', label: 'AG', icon: CalendarDays },
  { value: 'intervention', label: 'Intervention', icon: Wrench },
  { value: 'rdv', label: 'Rendez-vous', icon: Coffee },
  { value: 'rappel', label: 'Rappel', icon: Bell },
  { value: 'autre', label: 'Autre', icon: CalendarCheck },
]

const SYSTEM_CONFIG = {
  ag: { icon: CalendarDays, color: 'bg-blue-50 text-blue-600', label: 'AG' },
  echeance: { icon: CreditCard, color: 'bg-amber-50 text-amber-600', label: 'Échéance' },
  sinistre: { icon: Wrench, color: 'bg-red-50 text-red-600', label: 'Sinistre' },
}

const CUSTOM_COLORS: Record<string, string> = {
  visite: 'bg-purple-50 text-purple-600',
  ag: 'bg-blue-50 text-blue-600',
  intervention: 'bg-orange-50 text-orange-600',
  rdv: 'bg-teal-50 text-teal-600',
  rappel: 'bg-yellow-50 text-yellow-600',
  autre: 'bg-slate-100 text-[#374151]',
}

const emptyForm = { titre: '', description: '', type: 'visite', date_debut: '', date_fin: '', lieu: '', assignee_id: '', copropriete_id: '' }

export function AgendaClient({ systemEvents, customEvents: initialCustom, coproprietes, gestionnaires }: Props) {
  const [activeTab, setActiveTab] = useState<'agenda' | 'tournees'>('agenda')
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>(initialCustom)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [tourneeVisites, setTourneeVisites] = useState<{ id: string; copropriete_id: string; nom: string; adresse: string; fait: boolean }[]>([])
  const [tourneeDate, setTourneeDate] = useState(new Date().toISOString().split('T')[0])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (!form.date_debut) { setError('Date requise'); return }
    setSaving(true)
    const res = await fetch('/api/evenements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titre: form.titre,
        description: form.description || undefined,
        type: form.type,
        date_debut: new Date(form.date_debut).toISOString(),
        date_fin: form.date_fin ? new Date(form.date_fin).toISOString() : null,
        lieu: form.lieu || undefined,
        assignee_id: form.assignee_id || null,
        copropriete_id: form.copropriete_id || null,
      }),
    })
    setSaving(false)
    if (res.ok) {
      const created = await res.json()
      setCustomEvents(prev => [...prev, created].sort((a, b) => new Date(a.date_debut).getTime() - new Date(b.date_debut).getTime()))
      setShowForm(false); setForm(emptyForm)
    } else {
      const d = await res.json(); setError(d.error ?? 'Erreur')
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/evenements/${id}`, { method: 'DELETE' })
    setCustomEvents(prev => prev.filter(e => e.id !== id))
  }

  // Fusionner tous les événements
  type AnyEvent = { id: string; date: string; isCustom: boolean; data: SystemEvent | CustomEvent }
  const allEvents: AnyEvent[] = [
    ...systemEvents.map(e => ({ id: e.id, date: e.date, isCustom: false, data: e })),
    ...customEvents.map(e => ({ id: e.id, date: e.date_debut, isCustom: true, data: e })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const grouped = allEvents.reduce((acc, ev) => {
    const month = new Date(ev.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    if (!acc[month]) acc[month] = []
    acc[month].push(ev)
    return acc
  }, {} as Record<string, AnyEvent[]>)

  function addToTournee(copro: { id: string; nom: string; adresse?: string }) {
    if (tourneeVisites.some(v => v.copropriete_id === copro.id)) return
    setTourneeVisites(prev => [...prev, { id: Date.now().toString(), copropriete_id: copro.id, nom: copro.nom, adresse: copro.adresse ?? '', fait: false }])
  }

  function toggleVisite(id: string) {
    setTourneeVisites(prev => prev.map(v => v.id === id ? { ...v, fait: !v.fait } : v))
  }

  function removeVisite(id: string) {
    setTourneeVisites(prev => prev.filter(v => v.id !== id))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Agenda</h1>
          <p className="text-muted-foreground text-sm mt-0.5">AG, échéances, sinistres, événements et tournées</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-coplio-bg p-1 rounded-xl">
            <button onClick={() => setActiveTab('agenda')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'agenda' ? 'bg-white text-coplio-text shadow-sm' : 'text-muted-foreground'}`}>
              <CalendarDays className="w-4 h-4" />Agenda
            </button>
            <button onClick={() => setActiveTab('tournees')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'tournees' ? 'bg-white text-coplio-text shadow-sm' : 'text-muted-foreground'}`}>
              <Route className="w-4 h-4" />Tournées
            </button>
          </div>
          {activeTab === 'agenda' && (
            <button onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-2 bg-[#374151] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#374151]/90 transition-colors">
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? 'Annuler' : 'Ajouter'}
            </button>
          )}
        </div>
      </div>

      {/* TOURNÉES */}
      {activeTab === 'tournees' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="coplio-card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-coplio-text flex items-center gap-2">
                    <Route className="w-4 h-4 text-[#374151]" />Tournée du
                    <input type="date" value={tourneeDate} onChange={e => setTourneeDate(e.target.value)}
                      className="px-2 py-1 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#374151]/20" />
                  </h2>
                  <span className="text-xs text-muted-foreground">{tourneeVisites.filter(v => v.fait).length}/{tourneeVisites.length} effectuées</span>
                </div>

                {tourneeVisites.length === 0 ? (
                  <div className="text-center py-8">
                    <Route className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                    <p className="text-sm text-muted-foreground">Ajoutez des copropriétés à visiter depuis la liste ci-contre</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tourneeVisites.map((v, i) => (
                      <div key={v.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${v.fait ? 'bg-slate-100 border-[#374151]/20 opacity-75' : 'bg-white border-border'}`}>
                        <div className="w-7 h-7 rounded-full bg-coplio-bg flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                          {i + 1}
                        </div>
                        <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0 cursor-grab" />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${v.fait ? 'line-through text-muted-foreground' : 'text-coplio-text'}`}>{v.nom}</p>
                          {v.adresse && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{v.adresse}</p>}
                        </div>
                        <button onClick={() => toggleVisite(v.id)}
                          className={`p-1.5 rounded-lg transition-colors ${v.fait ? 'text-[#374151] hover:bg-[#374151]/10' : 'text-muted-foreground hover:text-[#374151] hover:bg-slate-100'}`}>
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => removeVisite(v.id)} className="p-1.5 text-muted-foreground hover:text-coplio-red transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {tourneeVisites.length > 0 && (
                <div className="coplio-card bg-coplio-bg border-dashed">
                  <p className="text-sm text-muted-foreground text-center">
                    {tourneeVisites.length} visite{tourneeVisites.length > 1 ? 's' : ''} planifiée{tourneeVisites.length > 1 ? 's' : ''} · {tourneeVisites.filter(v => v.fait).length} effectuée{tourneeVisites.filter(v => v.fait).length > 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>

            <div className="coplio-card">
              <h3 className="font-semibold text-coplio-text mb-3">Ajouter à la tournée</h3>
              <div className="space-y-2">
                {coproprietes.map(c => {
                  const already = tourneeVisites.some(v => v.copropriete_id === c.id)
                  return (
                    <button key={c.id} onClick={() => addToTournee(c)} disabled={already}
                      className={`w-full text-left p-2.5 rounded-xl border-2 transition-all text-sm ${already ? 'border-[#374151] bg-slate-100 opacity-60 cursor-default' : 'border-border hover:border-[#374151]/40 hover:bg-coplio-bg'}`}>
                      <p className="font-medium text-coplio-text text-sm">{c.nom}</p>
                      {(c as { adresse?: string }).adresse && <p className="text-xs text-muted-foreground mt-0.5">{(c as { adresse?: string }).adresse}</p>}
                      {already && <span className="text-xs text-[#374151]">✓ Ajoutée</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'agenda' && (<>

      {/* Formulaire création */}
      {showForm && (
        <div className="coplio-card">
          <h2 className="font-semibold text-coplio-text mb-4">Nouvel événement</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            {error && <p className="text-sm text-coplio-red">{error}</p>}

            {/* Types */}
            <div>
              <label className="block text-sm font-medium text-coplio-text mb-2">Type</label>
              <div className="flex flex-wrap gap-2">
                {TYPES_CUSTOM.map(t => (
                  <button key={t.value} type="button" onClick={() => setForm(f => ({ ...f, type: t.value }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border-2 transition-all ${form.type === t.value ? 'border-[#374151] bg-slate-100 text-[#374151]' : 'border-border text-muted-foreground hover:border-[#374151]/30'}`}>
                    <t.icon className="w-3.5 h-3.5" />{t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Titre *</label>
                <input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} required
                  placeholder="Ex: Visite copropriété Les Lilas"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Début *</label>
                <input type="datetime-local" value={form.date_debut} onChange={e => setForm(f => ({ ...f, date_debut: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Fin (optionnel)</label>
                <input type="datetime-local" value={form.date_fin} onChange={e => setForm(f => ({ ...f, date_fin: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Lieu</label>
                <input value={form.lieu} onChange={e => setForm(f => ({ ...f, lieu: e.target.value }))} placeholder="Adresse ou salle"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Copropriété</label>
                <select value={form.copropriete_id} onChange={e => setForm(f => ({ ...f, copropriete_id: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20 bg-white">
                  <option value="">— Toutes —</option>
                  {coproprietes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Assigner à</label>
                <select value={form.assignee_id} onChange={e => setForm(f => ({ ...f, assignee_id: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20 bg-white">
                  <option value="">— Non assigné —</option>
                  {gestionnaires.map(g => <option key={g.id} value={g.id}>{g.prenom} {g.nom}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 bg-[#374151] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#374151]/90 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Créer l&apos;événement
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Légende */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'AG', color: 'bg-blue-50 text-blue-600' },
          { label: 'Échéance', color: 'bg-amber-50 text-amber-600' },
          { label: 'Sinistre', color: 'bg-red-50 text-red-600' },
          { label: 'Événement', color: 'bg-slate-100 text-[#374151]' },
        ].map(l => (
          <span key={l.label} className={`text-xs font-medium px-2.5 py-1 rounded-full ${l.color}`}>{l.label}</span>
        ))}
        <span className="text-xs text-muted-foreground self-center ml-auto">{allEvents.length} événement{allEvents.length > 1 ? 's' : ''}</span>
      </div>

      {allEvents.length === 0 ? (
        <div className="coplio-card text-center py-16">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CalendarDays className="w-7 h-7 text-[#374151]" />
          </div>
          <p className="font-medium text-coplio-text">Rien à l&apos;horizon</p>
          <p className="text-sm text-muted-foreground mt-1">Aucun événement. Ajoutez-en un ci-dessus.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([month, items]) => (
            <div key={month}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 capitalize">{month}</h2>
              <div className="space-y-2">
                {items.map(({ id, date, isCustom, data }) => {
                  const d = new Date(date)
                  const isToday = d.toDateString() === new Date().toDateString()
                  const isSoon = d.getTime() > Date.now() && d.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
                  const isDateOnly = d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0

                  if (!isCustom) {
                    const ev = data as SystemEvent
                    const { icon: Icon, color, label } = SYSTEM_CONFIG[ev.type]
                    return (
                      <Link key={`sys-${id}`} href={ev.lien}
                        className="coplio-card flex items-center gap-4 hover:shadow-md transition-shadow group p-4">
                        <div className={`flex-shrink-0 w-14 text-center rounded-xl py-2 ${isToday ? 'bg-[#374151] text-white' : 'bg-coplio-bg'}`}>
                          <p className={`text-xl font-bold leading-none ${isToday ? 'text-white' : 'text-coplio-text'}`}>{d.getDate()}</p>
                          <p className={`text-xs mt-0.5 ${isToday ? 'text-white/80' : 'text-muted-foreground'}`}>{d.toLocaleDateString('fr-FR', { month: 'short' })}</p>
                        </div>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-coplio-text text-sm truncate">{ev.titre}</p>
                            {isSoon && !isToday && <span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">Bientôt</span>}
                            {isToday && <span className="text-xs bg-[#374151] text-white px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">Aujourd&apos;hui</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            {ev.sous_titre && <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.sous_titre}</span>}
                            {!isDateOnly && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${color}`}>{label}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[#374151] transition-colors flex-shrink-0" />
                      </Link>
                    )
                  }

                  // Événement personnalisé
                  const ev = data as CustomEvent
                  const typeConfig = TYPES_CUSTOM.find(t => t.value === ev.type)
                  const Icon = typeConfig?.icon ?? CalendarCheck
                  const color = CUSTOM_COLORS[ev.type] ?? 'bg-slate-100 text-[#374151]'

                  return (
                    <div key={`custom-${id}`} className="coplio-card flex items-center gap-4 p-4">
                      <div className={`flex-shrink-0 w-14 text-center rounded-xl py-2 ${isToday ? 'bg-[#374151] text-white' : 'bg-coplio-bg'}`}>
                        <p className={`text-xl font-bold leading-none ${isToday ? 'text-white' : 'text-coplio-text'}`}>{d.getDate()}</p>
                        <p className={`text-xs mt-0.5 ${isToday ? 'text-white/80' : 'text-muted-foreground'}`}>{d.toLocaleDateString('fr-FR', { month: 'short' })}</p>
                      </div>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-coplio-text text-sm truncate">{ev.titre}</p>
                          {isToday && <span className="text-xs bg-[#374151] text-white px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">Aujourd&apos;hui</span>}
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${color}`}>{typeConfig?.label ?? ev.type}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          {!isDateOnly && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
                          {ev.lieu && <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.lieu}</span>}
                          {ev.copropriete && <span className="text-xs text-muted-foreground">{ev.copropriete.nom}</span>}
                          {ev.assignee && <span className="text-xs text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" />{ev.assignee.prenom} {ev.assignee.nom}</span>}
                        </div>
                      </div>
                      <button onClick={() => handleDelete(ev.id)} className="p-1.5 text-muted-foreground hover:text-coplio-red transition-colors flex-shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      </>)}
    </div>
  )
}
