'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, UserPlus, Trash2, Mail, CheckCircle2, Clock } from 'lucide-react'

interface Tenant {
  id: string
  prenom: string | null
  nom: string | null
  email: string
}

export function LocataireManager({ tenant }: { tenant: Tenant | null }) {
  const router = useRouter()
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [revoking, setRevoking] = useState(false)

  async function invite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/portail/locataire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom, nom, email }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Erreur lors de l\'invitation')
        return
      }
      if (data.emailSent) {
        toast.success('Invitation envoyée', { description: `${prenom} recevra ses identifiants par email.` })
      } else {
        toast.warning('Locataire créé, email non envoyé', {
          description: 'Le compte est actif mais l\'email d\'invitation n\'a pas pu partir (service email non configuré).',
          duration: 7000,
        })
      }
      setPrenom(''); setNom(''); setEmail('')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function revoke() {
    setRevoking(true)
    try {
      const res = await fetch('/api/portail/locataire', { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Erreur lors de la révocation')
        return
      }
      toast.success('Accès locataire révoqué')
      router.refresh()
    } finally {
      setRevoking(false)
    }
  }

  // ── Locataire existant ──────────────────────────────────────────
  if (tenant) {
    const fullName = [tenant.prenom, tenant.nom].filter(Boolean).join(' ') || tenant.email
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-4" style={{ background: '#0f172a' }}>
          <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">
              {(tenant.prenom?.[0] ?? '') + (tenant.nom?.[0] ?? '') || tenant.email[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/50 font-medium uppercase tracking-wider">Locataire actif</p>
            <p className="text-base font-bold text-white mt-0.5 truncate">{fullName}</p>
            <p className="text-xs text-white/60 truncate">{tenant.email}</p>
          </div>
          <span className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-green-400/20 text-green-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Actif
          </span>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-slate-500 mb-4">
            Votre locataire peut signaler des problèmes, consulter les contacts et les documents utiles.
            Il n&apos;a accès à <strong>aucune donnée financière</strong> ni aux votes.
          </p>
          <button
            onClick={revoke}
            disabled={revoking}
            className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {revoking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Révoquer l&apos;accès
          </button>
        </div>
      </div>
    )
  }

  // ── Formulaire d'invitation ─────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
          <UserPlus className="w-3.5 h-3.5 text-blue-600" />
        </div>
        <h2 className="text-sm font-bold text-slate-900">Inviter mon locataire</h2>
      </div>
      <form onSubmit={invite} className="px-5 py-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Prénom</label>
            <input
              value={prenom} onChange={e => setPrenom(e.target.value)} required
              placeholder="Marie"
              className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-900 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Nom</label>
            <input
              value={nom} onChange={e => setNom(e.target.value)} required
              placeholder="Durand"
              className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-900 transition-all"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Email du locataire</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)} required
            placeholder="marie.durand@email.com"
            className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-900 transition-all"
          />
        </div>
        <button
          type="submit" disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          Envoyer l&apos;invitation
        </button>
        <p className="text-xs text-slate-400 flex items-start gap-1.5">
          <Clock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          Votre locataire recevra un email avec ses identifiants pour accéder à son espace.
        </p>
      </form>
    </div>
  )
}
