'use client'

import { useState } from 'react'
import {
  User, Crown, CheckCircle2, Loader2,
  FileText, CreditCard, MessageCircle, Building2,
  TrendingUp, Wrench, CalendarDays, ChevronDown,
} from 'lucide-react'

const CONSEIL_ROLES = [
  { value: 'president',      label: 'Président',      color: '#fef3c7', text: '#92400e' },
  { value: 'vice_president', label: 'Vice-président',  color: '#ede9fe', text: '#5b21b6' },
  { value: 'tresorier',      label: 'Trésorier',       color: '#dcfce7', text: '#166534' },
  { value: 'secretaire',     label: 'Secrétaire',      color: '#dbeafe', text: '#1e40af' },
  { value: 'membre',         label: 'Membre',          color: '#f1f5f9', text: '#475569' },
]

interface Copropriete { id: string; nom: string }

interface RoleManagerProps {
  prenom: string
  nom: string
  email: string | null
  telephone: string | null
  coproprietes: Copropriete[]
  // Membership actuel par copropriété : { copropriete_id, conseil_id, role }
  currentMemberships: { copropriete_id: string; conseil_id: string; role: string }[]
}

export function RoleManager({
  prenom, nom, email, telephone, coproprietes, currentMemberships,
}: RoleManagerProps) {
  const [selectedCopro, setSelectedCopro] = useState(coproprietes[0]?.id ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Membership actuel pour la copropriété sélectionnée
  const current = currentMemberships.find(m => m.copropriete_id === selectedCopro)
  const isConseil = !!current

  // États locaux
  const [planChoice, setPlanChoice] = useState<'standard' | 'conseil'>(isConseil ? 'conseil' : 'standard')
  const [roleChoice, setRoleChoice] = useState(current?.role ?? 'membre')

  // Re-sync quand on change de copropriété
  function handleCoproChange(id: string) {
    setSelectedCopro(id)
    const m = currentMemberships.find(m => m.copropriete_id === id)
    setPlanChoice(m ? 'conseil' : 'standard')
    setRoleChoice(m?.role ?? 'membre')
    setSaved(false)
    setError(null)
  }

  async function handleSave() {
    if (!selectedCopro) return
    setSaving(true)
    setSaved(false)
    setError(null)

    try {
      if (planChoice === 'conseil') {
        if (current) {
          // Déjà dans le conseil → si le rôle a changé, supprimer et recréer
          if (current.role !== roleChoice) {
            await fetch(`/api/conseil-syndical/${current.conseil_id}`, { method: 'DELETE' })
            const res = await fetch('/api/conseil-syndical', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                copropriete_id: selectedCopro,
                prenom, nom,
                email: email ?? '',
                telephone: telephone ?? '',
                role: roleChoice,
              }),
            })
            if (!res.ok) { setError('Erreur lors de la mise à jour'); return }
            const data = await res.json()
            // Update local state
            const idx = currentMemberships.findIndex(m => m.copropriete_id === selectedCopro)
            if (idx !== -1) { currentMemberships[idx] = { copropriete_id: selectedCopro, conseil_id: data.id, role: roleChoice } }
          }
          // Même rôle → rien à faire
        } else {
          // Pas encore dans le conseil → créer
          const res = await fetch('/api/conseil-syndical', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              copropriete_id: selectedCopro,
              prenom, nom,
              email: email ?? '',
              telephone: telephone ?? '',
              role: roleChoice,
            }),
          })
          if (!res.ok) { setError('Erreur lors de la nomination'); return }
          const data = await res.json()
          currentMemberships.push({ copropriete_id: selectedCopro, conseil_id: data.id, role: roleChoice })
        }
      } else {
        // Standard → retirer du conseil si présent
        if (current) {
          const res = await fetch(`/api/conseil-syndical/${current.conseil_id}`, { method: 'DELETE' })
          if (!res.ok) { setError('Erreur lors de la suppression'); return }
          const idx = currentMemberships.findIndex(m => m.copropriete_id === selectedCopro)
          if (idx !== -1) currentMemberships.splice(idx, 1)
        }
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const currentRole = CONSEIL_ROLES.find(r => r.value === roleChoice)

  return (
    <div className="coplio-card space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-coplio-text text-sm">Rôle dans le portail</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Définit les accès et fonctionnalités disponibles pour ce copropriétaire
          </p>
        </div>
        {saved && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 border border-green-100 px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> Enregistré
          </span>
        )}
      </div>

      {/* Sélecteur copropriété si plusieurs */}
      {coproprietes.length > 1 && (
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
            Copropriété
          </label>
          <div className="relative">
            <select
              value={selectedCopro}
              onChange={e => handleCoproChange(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#374151]/20 pr-8"
            >
              {coproprietes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      )}

      {/* Cards de choix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* Standard */}
        <button
          type="button"
          onClick={() => setPlanChoice('standard')}
          className={`relative text-left p-4 rounded-2xl border-2 transition-all ${
            planChoice === 'standard'
              ? 'border-[#374151] bg-slate-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          {planChoice === 'standard' && (
            <div className="absolute top-3 right-3 w-5 h-5 bg-[#374151] rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
          )}
          <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
            <User className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-sm font-bold text-slate-900 mb-1">Copropriétaire</p>
          <p className="text-xs text-slate-400 mb-3">Accès portail standard</p>
          <div className="space-y-1.5">
            {[
              { icon: CreditCard,    label: 'Ses charges' },
              { icon: FileText,      label: 'Ses documents' },
              { icon: CalendarDays,  label: 'Ses assemblées' },
              { icon: MessageCircle, label: 'Messagerie syndic' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-slate-500">
                <Icon className="w-3 h-3 text-slate-400 flex-shrink-0" />
                {label}
              </div>
            ))}
          </div>
        </button>

        {/* Conseil syndical */}
        <button
          type="button"
          onClick={() => setPlanChoice('conseil')}
          className={`relative text-left p-4 rounded-2xl border-2 transition-all ${
            planChoice === 'conseil'
              ? 'border-amber-400 bg-amber-50/50'
              : 'border-slate-200 bg-white hover:border-amber-200'
          }`}
        >
          {planChoice === 'conseil' && (
            <div className="absolute top-3 right-3 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
          )}
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center mb-3">
            <Crown className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-sm font-bold text-slate-900 mb-1">Conseil syndical</p>
          <p className="text-xs text-slate-400 mb-3">Accès élargi à la copropriété</p>
          <div className="space-y-1.5">
            {[
              { icon: TrendingUp,   label: 'Finances globales' },
              { icon: Wrench,       label: 'Tous les sinistres' },
              { icon: FileText,     label: 'Tous les documents' },
              { icon: Building2,    label: 'Vue d\'ensemble copro' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-amber-700">
                <Icon className="w-3 h-3 text-amber-500 flex-shrink-0" />
                {label}
              </div>
            ))}
          </div>
        </button>
      </div>

      {/* Sélecteur de rôle (visible seulement si conseil) */}
      {planChoice === 'conseil' && (
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
            Rôle au sein du conseil
          </label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {CONSEIL_ROLES.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRoleChoice(r.value)}
                className="px-2 py-2.5 rounded-xl text-xs font-bold text-center transition-all border"
                style={{
                  background: roleChoice === r.value ? r.color : '#f8fafc',
                  color: roleChoice === r.value ? r.text : '#94a3b8',
                  borderColor: roleChoice === r.value ? r.text + '40' : '#e2e8f0',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Résumé + bouton */}
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <div className="text-xs text-muted-foreground">
          {planChoice === 'standard' ? (
            <span>Accès portail standard</span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              <span style={{ color: currentRole?.text }}>
                {currentRole?.label} du conseil syndical
              </span>
            </span>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#374151] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#4B5563] transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Enregistrer
        </button>
      </div>
    </div>
  )
}
