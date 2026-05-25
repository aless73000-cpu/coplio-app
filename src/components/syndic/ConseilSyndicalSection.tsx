'use client'

import { useState } from 'react'
import { Crown, Trash2, Loader2, CheckCircle2, Plus, X, ChevronDown } from 'lucide-react'

const CONSEIL_ROLES = [
  { value: 'president',      label: 'Président',      color: '#fef3c7', text: '#92400e' },
  { value: 'vice_president', label: 'Vice-président',  color: '#ede9fe', text: '#5b21b6' },
  { value: 'tresorier',      label: 'Trésorier',       color: '#dcfce7', text: '#166534' },
  { value: 'secretaire',     label: 'Secrétaire',      color: '#dbeafe', text: '#1e40af' },
  { value: 'membre',         label: 'Membre',          color: '#f1f5f9', text: '#334155' },
]

function getRoleBadge(role: string) {
  return CONSEIL_ROLES.find(r => r.value === role) ?? CONSEIL_ROLES[4]
}

interface ConseilEntry {
  id: string
  copropriete_id: string
  copropriete_nom: string
  role: string
}

interface Copropriete {
  id: string
  nom: string
}

interface ConseilSyndicalSectionProps {
  coproprietaireId: string
  prenom: string
  nom: string
  email: string | null
  telephone: string | null
  coproprietes: Copropriete[]            // copropriétés liées à ce copropriétaire
  memberships: ConseilEntry[]            // appartenance(s) au conseil déjà existantes
}

export function ConseilSyndicalSection({
  prenom, nom, email, telephone,
  coproprietes, memberships: initialMemberships,
}: ConseilSyndicalSectionProps) {
  const [memberships, setMemberships] = useState<ConseilEntry[]>(initialMemberships)
  const [showForm, setShowForm] = useState(false)
  const [selectedCopro, setSelectedCopro] = useState(coproprietes[0]?.id ?? '')
  const [selectedRole, setSelectedRole] = useState('membre')
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Copropriétés déjà dans le conseil pour ce membre
  const alreadyIn = new Set(memberships.map(m => m.copropriete_id))
  const available = coproprietes.filter(c => !alreadyIn.has(c.id))

  async function handleAdd() {
    if (!selectedCopro) return
    setSaving(true)
    setError(null)
    const res = await fetch('/api/conseil-syndical', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        copropriete_id: selectedCopro,
        prenom,
        nom,
        email: email ?? '',
        telephone: telephone ?? '',
        role: selectedRole,
        lot_numero: '',
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Erreur'); return }
    const copro = coproprietes.find(c => c.id === selectedCopro)
    setMemberships(prev => [...prev, {
      id: data.id,
      copropriete_id: selectedCopro,
      copropriete_nom: copro?.nom ?? '',
      role: selectedRole,
    }])
    setShowForm(false)
    setSelectedRole('membre')
    if (available.length > 1) setSelectedCopro(available.find(c => c.id !== selectedCopro)?.id ?? '')
  }

  async function handleRemove(id: string) {
    setRemovingId(id)
    await fetch(`/api/conseil-syndical/${id}`, { method: 'DELETE' })
    setMemberships(prev => prev.filter(m => m.id !== id))
    setRemovingId(null)
  }

  return (
    <div className="coplio-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
            <Crown className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h2 className="font-semibold text-coplio-text text-sm">Conseil syndical</h2>
            <p className="text-xs text-muted-foreground">
              {memberships.length === 0
                ? 'Non membre du conseil'
                : `Membre de ${memberships.length} conseil${memberships.length > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        {available.length > 0 && !showForm && (
          <button
            onClick={() => { setShowForm(true); setSelectedCopro(available[0].id) }}
            className="flex items-center gap-1.5 text-xs font-semibold bg-[#374151] text-white px-3 py-1.5 rounded-lg hover:bg-[#4B5563] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nommer
          </button>
        )}
      </div>

      {/* Memberships actuels */}
      {memberships.length > 0 && (
        <div className="space-y-2 mb-4">
          {memberships.map(m => {
            const badge = getRoleBadge(m.role)
            return (
              <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-coplio-text truncate">{m.copropriete_nom}</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ background: badge.color, color: badge.text }}>
                  {badge.label}
                </span>
                <button
                  onClick={() => handleRemove(m.id)}
                  disabled={removingId === m.id}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                  title="Retirer du conseil"
                >
                  {removingId === m.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* État vide */}
      {memberships.length === 0 && !showForm && (
        <p className="text-xs text-muted-foreground text-center py-3">
          Ce copropriétaire n&apos;est membre d&apos;aucun conseil syndical.
          {available.length > 0 && ' Cliquez sur "Nommer" pour l\'ajouter.'}
        </p>
      )}

      {/* Formulaire d'ajout */}
      {showForm && (
        <div className="border border-dashed border-amber-200 bg-amber-50/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-coplio-text">Nommer au conseil syndical</p>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-coplio-text">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Copropriété */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 block">Copropriété</label>
            <div className="relative">
              <select
                value={selectedCopro}
                onChange={e => setSelectedCopro(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#374151]/20 pr-8"
              >
                {available.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Rôle */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 block">Rôle</label>
            <div className="grid grid-cols-3 gap-2">
              {CONSEIL_ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setSelectedRole(r.value)}
                  className="px-2 py-2 rounded-lg text-xs font-semibold text-center transition-all border"
                  style={{
                    background: selectedRole === r.value ? r.color : '#f8fafc',
                    color: selectedRole === r.value ? r.text : '#94a3b8',
                    borderColor: selectedRole === r.value ? r.text + '40' : '#e2e8f0',
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            onClick={handleAdd}
            disabled={saving || !selectedCopro}
            className="w-full flex items-center justify-center gap-2 bg-[#374151] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#4B5563] transition-colors disabled:opacity-50"
          >
            {saving
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <><CheckCircle2 className="w-4 h-4" /> Confirmer la nomination</>
            }
          </button>
        </div>
      )}
    </div>
  )
}
