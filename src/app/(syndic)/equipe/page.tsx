'use client'

import { useState, useEffect } from 'react'
import { Users, Mail, Trash2, Loader2, CheckCircle2, Crown, UserPlus, AlertTriangle, Link as LinkIcon, Building2, Plus } from 'lucide-react'
import Link from 'next/link'

interface Membre {
  id: string
  prenom: string | null
  nom: string | null
  email: string
  role: 'owner' | 'manager'
  created_at: string
}

interface Copropriete { id: string; nom: string }
interface ConseilMembre {
  id: string
  prenom: string
  nom: string
  email?: string
  telephone?: string
  role: string
  lot_numero?: string
}

const CONSEIL_ROLES = [
  { value: 'president', label: 'Président' },
  { value: 'vice_president', label: 'Vice-président' },
  { value: 'secretaire', label: 'Secrétaire' },
  { value: 'tresorier', label: 'Trésorier' },
  { value: 'membre', label: 'Membre' },
]

export default function EquipePage() {
  const [membres, setMembres] = useState<Membre[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteStatus, setInviteStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [tab, setTab] = useState<'equipe' | 'conseil'>('equipe')
  const [coproprietes, setCoproprietes] = useState<Copropriete[]>([])
  const [selectedCopro, setSelectedCopro] = useState('')
  const [conseilMembres, setConseilMembres] = useState<ConseilMembre[]>([])
  const [loadingConseil, setLoadingConseil] = useState(false)
  const [showConseilForm, setShowConseilForm] = useState(false)
  const [conseilForm, setConseilForm] = useState({ prenom: '', nom: '', email: '', telephone: '', role: 'membre', lot_numero: '' })
  const [savingConseil, setSavingConseil] = useState(false)

  useEffect(() => {
    fetch('/api/equipe')
      .then((r) => r.json())
      .then((data) => {
        setMembres(data ?? [])
        setIsOwner(data?.some((m: Membre) => m.role === 'owner'))
      })
      .finally(() => setLoading(false))
    fetch('/api/coproprietes')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) { setCoproprietes(d); if (d[0]) setSelectedCopro(d[0].id) } })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedCopro || tab !== 'conseil') return
    setLoadingConseil(true)
    fetch(`/api/conseil-syndical?copropriete_id=${selectedCopro}`)
      .then(r => r.json())
      .then(d => setConseilMembres(Array.isArray(d) ? d : []))
      .finally(() => setLoadingConseil(false))
  }, [selectedCopro, tab])

  async function handleAddConseil(e: React.FormEvent) {
    e.preventDefault()
    setSavingConseil(true)
    const res = await fetch('/api/conseil-syndical', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...conseilForm, copropriete_id: selectedCopro }),
    })
    const data = await res.json()
    setSavingConseil(false)
    if (res.ok) {
      setConseilMembres(prev => [...prev, data])
      setShowConseilForm(false)
      setConseilForm({ prenom: '', nom: '', email: '', telephone: '', role: 'membre', lot_numero: '' })
    }
  }

  async function handleRemoveConseil(id: string) {
    if (!confirm('Retirer ce membre du conseil ?')) return
    await fetch(`/api/conseil-syndical/${id}`, { method: 'DELETE' })
    setConseilMembres(prev => prev.filter(m => m.id !== id))
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    setInviteStatus(null)

    try {
      const res = await fetch('/api/equipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setInviteStatus({ type: 'error', message: data.error ?? 'Erreur lors de l\'invitation' })
      } else {
        setInviteStatus({ type: 'success', message: `Invitation envoyée à ${inviteEmail}` })
        setInviteEmail('')
        // Refresh
        fetch('/api/equipe').then((r) => r.json()).then(setMembres)
      }
    } catch {
      setInviteStatus({ type: 'error', message: 'Erreur réseau' })
    } finally {
      setInviting(false)
    }
  }

  async function handleRemove(memberId: string) {
    if (!confirm('Retirer ce gestionnaire de votre cabinet ?')) return
    setRemovingId(memberId)
    try {
      await fetch('/api/equipe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      })
      setMembres((prev) => prev.filter((m) => m.id !== memberId))
    } catch {
      alert('Erreur lors de la suppression')
    } finally {
      setRemovingId(null)
    }
  }

  const initials = (m: Membre) =>
    `${m.prenom?.[0] ?? ''}${m.nom?.[0] ?? ''}`.toUpperCase() || m.email[0].toUpperCase()

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-coplio-text">Équipe & conseil syndical</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestionnaires du cabinet et membres du conseil syndical</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-coplio-bg p-1 rounded-xl w-fit">
        <button onClick={() => setTab('equipe')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'equipe' ? 'bg-white text-coplio-text shadow-sm' : 'text-muted-foreground hover:text-coplio-text'}`}>
          <Users className="w-4 h-4" />Mon équipe
        </button>
        <button onClick={() => setTab('conseil')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'conseil' ? 'bg-white text-coplio-text shadow-sm' : 'text-muted-foreground hover:text-coplio-text'}`}>
          <Building2 className="w-4 h-4" />Conseil syndical
        </button>
      </div>

      {tab === 'conseil' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select value={selectedCopro} onChange={e => setSelectedCopro(e.target.value)}
              className="flex-1 px-3 py-2.5 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]/20">
              {coproprietes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
            <button onClick={() => setShowConseilForm(v => !v)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#111827] text-white text-sm font-medium rounded-xl hover:bg-[#111827]/90 transition-colors">
              <Plus className="w-4 h-4" />Ajouter
            </button>
          </div>

          {showConseilForm && (
            <div className="coplio-card">
              <h3 className="font-semibold text-coplio-text mb-3">Nouveau membre du conseil</h3>
              <form onSubmit={handleAddConseil} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input value={conseilForm.prenom} onChange={e => setConseilForm(f => ({ ...f, prenom: e.target.value }))} placeholder="Prénom *" required
                    className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20" />
                  <input value={conseilForm.nom} onChange={e => setConseilForm(f => ({ ...f, nom: e.target.value }))} placeholder="Nom *" required
                    className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20" />
                  <input value={conseilForm.email} onChange={e => setConseilForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" type="email"
                    className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20" />
                  <input value={conseilForm.telephone} onChange={e => setConseilForm(f => ({ ...f, telephone: e.target.value }))} placeholder="Téléphone"
                    className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20" />
                  <select value={conseilForm.role} onChange={e => setConseilForm(f => ({ ...f, role: e.target.value }))}
                    className="px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]/20">
                    {CONSEIL_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  <input value={conseilForm.lot_numero} onChange={e => setConseilForm(f => ({ ...f, lot_numero: e.target.value }))} placeholder="N° lot"
                    className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={savingConseil}
                    className="flex items-center gap-2 bg-[#111827] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#111827]/90 disabled:opacity-60">
                    {savingConseil ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}Ajouter
                  </button>
                  <button type="button" onClick={() => setShowConseilForm(false)} className="text-sm text-muted-foreground px-4 py-2 border border-border rounded-lg">Annuler</button>
                </div>
              </form>
            </div>
          )}

          <div className="coplio-card p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-coplio-text">Membres du conseil syndical ({conseilMembres.length})</h2>
            </div>
            {loadingConseil ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : conseilMembres.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">Aucun membre du conseil syndical pour cette copropriété</div>
            ) : (
              <div className="divide-y divide-border">
                {conseilMembres.map(m => (
                  <div key={m.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 text-sm font-bold">{m.prenom[0]}{m.nom[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-coplio-text">{m.prenom} {m.nom}</p>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                          {CONSEIL_ROLES.find(r => r.value === m.role)?.label ?? m.role}
                        </span>
                        {m.lot_numero && <span className="text-xs text-muted-foreground">Lot {m.lot_numero}</span>}
                      </div>
                      {m.email && (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Mail className="w-3 h-3" />{m.email}
                        </p>
                      )}
                    </div>
                    <button onClick={() => handleRemoveConseil(m.id)} className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'equipe' && (<>

      {/* Liste des membres */}
      <div className="coplio-card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-coplio-text flex items-center gap-2">
            <Users className="w-4 h-4" />
            Membres ({membres.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : membres.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Aucun membre
          </div>
        ) : (
          <div className="divide-y divide-border">
            {membres.map((m) => (
              <div key={m.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#111827] text-sm font-bold">{initials(m)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-coplio-text truncate">
                      {m.prenom} {m.nom}
                      {!m.prenom && !m.nom && <span className="text-muted-foreground italic">En attente d&apos;activation</span>}
                    </p>
                    {m.role === 'owner' && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-coplio-amber-bg text-coplio-amber">
                        <Crown className="w-3 h-3" /> Propriétaire
                      </span>
                    )}
                    {m.role === 'manager' && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                        Gestionnaire
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {m.email}
                  </p>
                </div>
                {isOwner && m.role !== 'owner' && (
                  <button
                    onClick={() => handleRemove(m.id)}
                    disabled={removingId === m.id}
                    className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                    title="Retirer"
                  >
                    {removingId === m.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite form */}
      <div className="coplio-card space-y-4">
        <h2 className="font-semibold text-coplio-text flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Inviter un gestionnaire
        </h2>
        <p className="text-sm text-muted-foreground">
          Un email d&apos;invitation sera envoyé. La personne aura accès à toutes les copropriétés de votre cabinet.
        </p>

        {inviteStatus && (
          <div className={`flex items-start gap-2 p-3 rounded-xl text-sm ${
            inviteStatus.type === 'success'
              ? 'bg-slate-100 text-[#111827]'
              : 'bg-red-50 text-red-700'
          }`}>
            {inviteStatus.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              : <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
            {inviteStatus.message}
          </div>
        )}

        <form onSubmit={handleInvite} className="flex gap-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="prenom.nom@cabinet.fr"
            required
            className="flex-1 px-3 py-2.5 text-sm bg-white border border-border rounded-xl
              focus:outline-none focus:ring-2 focus:ring-[#111827]/20 focus:border-transparent
              placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={inviting || !inviteEmail}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#111827] text-white text-sm font-medium rounded-xl
              hover:bg-[#111827]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Inviter
          </button>
        </form>
      </div>

      {/* Plan info */}
      <div className="flex items-center gap-3 p-4 bg-coplio-bg rounded-xl border border-border text-sm">
        <LinkIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <p className="text-muted-foreground">
          Le nombre de gestionnaires dépend de votre plan.{' '}
          <Link href="/facturation" className="text-[#111827] font-medium hover:underline">
            Voir les limites
          </Link>
        </p>
      </div>
      </>)}
    </div>
  )
}
