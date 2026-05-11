'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Users, UserPlus, Loader2, Trash2, Crown, CheckCircle2, AlertCircle, Zap } from 'lucide-react'
import type { QuotaResult } from '@/lib/plan-guard'

interface Member {
  id: string
  prenom: string | null
  nom: string | null
  email: string
  role: string
  created_at: string
}

interface Props {
  currentUserId: string
  isOwner: boolean
  quota: QuotaResult
}

export function EquipeClient({ currentUserId, isOwner, quota }: Props) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [prenom, setPrenom] = useState('')
  const [inviting, setInviting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)

  const loadMembers = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/gestionnaires')
    const data = await res.json()
    setMembers(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { loadMembers() }, [loadMembers])

  async function handleInvite() {
    if (!email) return
    setInviting(true)
    setError('')
    setSuccess('')

    const res = await fetch('/api/gestionnaires/inviter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, prenom }),
    })
    const data = await res.json()
    setInviting(false)

    if (!res.ok) {
      if (data.error === 'QUOTA_EXCEEDED') {
        setError(`Limite atteinte (${data.current}/${data.max}). Passez à un plan supérieur.`)
      } else {
        setError(data.error ?? 'Erreur lors de l\'invitation')
      }
    } else {
      setSuccess(`Invitation envoyée à ${email} !`)
      setEmail('')
      setPrenom('')
      setTimeout(() => setSuccess(''), 5000)
    }
  }

  async function handleRemove(id: string) {
    if (!confirm('Retirer ce gestionnaire du cabinet ?')) return
    setRemovingId(id)
    await fetch(`/api/gestionnaires/${id}`, { method: 'DELETE' })
    setRemovingId(null)
    loadMembers()
  }

  const inputCls = `w-full px-3 py-2.5 text-sm bg-white border border-border rounded-lg
    focus:outline-none focus:ring-2 focus:ring-coplio-green focus:border-transparent`

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/parametres" className="text-muted-foreground hover:text-coplio-text transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Mon équipe</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Gérez les accès à votre cabinet</p>
        </div>
      </div>

      {/* Quota */}
      <div className={`flex items-center justify-between p-4 rounded-xl border ${
        quota.allowed ? 'bg-coplio-green-light border-coplio-green/20' : 'bg-amber-50 border-amber-200'
      }`}>
        <div className="flex items-center gap-3">
          <Users className={`w-5 h-5 ${quota.allowed ? 'text-coplio-green' : 'text-amber-600'}`} />
          <div>
            <p className="text-sm font-semibold text-coplio-text">
              {quota.current} / {quota.max} gestionnaire{quota.max > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-muted-foreground capitalize">Plan {quota.plan}</p>
          </div>
        </div>
        {!quota.allowed && (
          <Link
            href="/facturation"
            className="flex items-center gap-1.5 bg-amber-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Zap className="w-3 h-3" />
            Upgrader
          </Link>
        )}
      </div>

      {/* Formulaire invitation */}
      {isOwner && (
        <div className="coplio-card">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-4 h-4 text-coplio-green" />
            <h2 className="font-semibold text-coplio-text">Inviter un gestionnaire</h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-coplio-green-light border border-coplio-green/20 rounded-lg flex items-center gap-2 text-coplio-green text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {success}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-coplio-text mb-1">Prénom</label>
              <input
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Jean"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-coplio-text mb-1">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jean@cabinet.fr"
                className={inputCls}
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              />
            </div>
          </div>

          <button
            onClick={handleInvite}
            disabled={inviting || !email || !quota.allowed}
            className="w-full flex items-center justify-center gap-2 bg-coplio-green text-white font-medium py-2.5 rounded-lg hover:bg-coplio-green/90 transition-colors disabled:opacity-50 text-sm"
          >
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {inviting ? 'Envoi en cours...' : "Envoyer l'invitation"}
          </button>
        </div>
      )}

      {/* Liste des membres */}
      <div className="coplio-card">
        <h2 className="font-semibold text-coplio-text mb-4">
          Membres ({members.length})
        </h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Aucun membre pour l'instant</p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-coplio-bg transition-colors">
                <div className="w-9 h-9 bg-coplio-green-light rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-coplio-green">
                    {(m.prenom?.[0] ?? m.email[0]).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-coplio-text truncate">
                      {m.prenom && m.nom ? `${m.prenom} ${m.nom}` : m.email}
                    </p>
                    {m.role === 'owner' && (
                      <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    )}
                    {m.id === currentUserId && (
                      <span className="text-xs text-muted-foreground">(vous)</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                  m.role === 'owner'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-coplio-blue-bg text-coplio-blue'
                }`}>
                  {m.role === 'owner' ? 'Propriétaire' : 'Gestionnaire'}
                </span>
                {isOwner && m.id !== currentUserId && m.role !== 'owner' && (
                  <button
                    onClick={() => handleRemove(m.id)}
                    disabled={removingId === m.id}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors flex-shrink-0"
                    title="Retirer du cabinet"
                  >
                    {removingId === m.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />
                    }
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
