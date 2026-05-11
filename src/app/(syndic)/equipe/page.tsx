'use client'

import { useState, useEffect } from 'react'
import { Users, Mail, Trash2, Loader2, CheckCircle2, Crown, UserPlus, AlertTriangle, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'

interface Membre {
  id: string
  prenom: string | null
  nom: string | null
  email: string
  role: 'owner' | 'manager'
  created_at: string
}

export default function EquipePage() {
  const [membres, setMembres] = useState<Membre[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteStatus, setInviteStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    fetch('/api/equipe')
      .then((r) => r.json())
      .then((data) => {
        setMembres(data ?? [])
        // On détecte si l'utilisateur courant est owner via la liste
        setIsOwner(data?.some((m: Membre) => m.role === 'owner'))
      })
      .finally(() => setLoading(false))
  }, [])

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
        <h1 className="text-2xl font-bold text-coplio-text">Mon équipe</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gérez les gestionnaires qui ont accès à votre cabinet Coplio
        </p>
      </div>

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
                <div className="w-10 h-10 rounded-full bg-coplio-green-light flex items-center justify-center flex-shrink-0">
                  <span className="text-coplio-green text-sm font-bold">{initials(m)}</span>
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
              ? 'bg-coplio-green-light text-coplio-green'
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
              focus:outline-none focus:ring-2 focus:ring-coplio-green focus:border-transparent
              placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={inviting || !inviteEmail}
            className="flex items-center gap-2 px-4 py-2.5 bg-coplio-green text-white text-sm font-medium rounded-xl
              hover:bg-coplio-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          <Link href="/facturation" className="text-coplio-green font-medium hover:underline">
            Voir les limites
          </Link>
        </p>
      </div>
    </div>
  )
}
