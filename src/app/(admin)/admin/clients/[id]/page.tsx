'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Loader2, Trash2, Ban, CheckCircle } from 'lucide-react'

const PLAN_OPTIONS = ['trial', 'starter', 'pro', 'expert'] as const
const PLAN_LABELS: Record<string, string> = { trial: 'Essai', starter: 'Starter', pro: 'Pro', expert: 'Expert' }
const PLAN_PRICES: Record<string, number> = { trial: 0, starter: 79, pro: 149, expert: 299 }
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Actif', color: 'bg-green-100 text-green-700' },
  trialing: { label: 'Essai', color: 'bg-blue-100 text-blue-700' },
  past_due: { label: 'En retard', color: 'bg-orange-100 text-orange-700' },
  canceled: { label: 'Annulé', color: 'bg-red-100 text-red-700' },
  incomplete: { label: 'Incomplet', color: 'bg-gray-100 text-gray-600' },
}

interface Cabinet {
  id: string; nom: string; email_contact: string; plan: string
  subscription_status: string; created_at: string; trial_ends_at?: string
  current_period_end?: string; addon_portail_actif: boolean; max_lots: number
  siret?: string; telephone?: string; ville?: string
}

interface Profile { id: string; prenom: string; nom: string; email: string; role: string }

export default function AdminClientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [cabinet, setCabinet] = useState<Cabinet | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('')

  useEffect(() => {
    fetch(`/api/admin/clients/${params.id}`)
      .then(r => r.json())
      .then(({ cabinet, profiles }) => {
        setCabinet(cabinet)
        setProfiles(profiles ?? [])
        setSelectedPlan(cabinet?.plan ?? 'trial')
        setLoading(false)
      })
  }, [params.id])

  async function updatePlan() {
    setSaving(true); setError('')
    const res = await fetch(`/api/admin/clients/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: selectedPlan }),
    })
    if (!res.ok) { const d = await res.json(); setError(d.error); setSaving(false); return }
    const updated = await res.json()
    setCabinet(updated)
    setSaving(false)
  }

  async function suspendre() {
    if (!confirm('Suspendre ce client ? Il perdra l\'accès immédiatement.')) return
    setSaving(true); setError('')
    const res = await fetch(`/api/admin/clients/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription_status: 'canceled' }),
    })
    if (!res.ok) { const d = await res.json(); setError(d.error); setSaving(false); return }
    const updated = await res.json()
    setCabinet(updated)
    setSaving(false)
  }

  async function reactiver() {
    setSaving(true); setError('')
    const res = await fetch(`/api/admin/clients/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription_status: 'active' }),
    })
    if (!res.ok) { const d = await res.json(); setError(d.error); setSaving(false); return }
    const updated = await res.json()
    setCabinet(updated)
    setSaving(false)
  }

  async function supprimer() {
    if (!confirm(`Supprimer définitivement ${cabinet?.nom} ? Cette action est irréversible.`)) return
    setSaving(true)
    const res = await fetch(`/api/admin/clients/${params.id}`, { method: 'DELETE' })
    if (!res.ok) { const d = await res.json(); setError(d.error); setSaving(false); return }
    router.push('/admin/clients')
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-[#374151]" />
    </div>
  )

  if (!cabinet) return <p className="text-muted-foreground text-sm">Cabinet introuvable.</p>

  const status = STATUS_LABELS[cabinet.subscription_status] ?? STATUS_LABELS.incomplete
  const isSuspended = cabinet.subscription_status === 'canceled'

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/clients" className="text-muted-foreground hover:text-coplio-text transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-coplio-text">{cabinet.nom}</h1>
          <p className="text-muted-foreground text-sm">{cabinet.email_contact}</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.color}`}>{status.label}</span>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">{error}</div>}

      <div className="grid gap-5">
        {/* Infos cabinet */}
        <div className="coplio-card space-y-2">
          <h2 className="font-semibold text-coplio-text mb-3">Informations</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Inscription</dt>
            <dd className="text-coplio-text">{new Date(cabinet.created_at).toLocaleDateString('fr-FR')}</dd>
            {cabinet.siret && <><dt className="text-muted-foreground">SIRET</dt><dd className="text-coplio-text">{cabinet.siret}</dd></>}
            {cabinet.ville && <><dt className="text-muted-foreground">Ville</dt><dd className="text-coplio-text">{cabinet.ville}</dd></>}
            {cabinet.telephone && <><dt className="text-muted-foreground">Téléphone</dt><dd className="text-coplio-text">{cabinet.telephone}</dd></>}
            <dt className="text-muted-foreground">Max lots</dt>
            <dd className="text-coplio-text">{cabinet.max_lots}</dd>
            <dt className="text-muted-foreground">Portail brandé</dt>
            <dd className={cabinet.addon_portail_actif ? 'text-[#374151] font-medium' : 'text-muted-foreground'}>
              {cabinet.addon_portail_actif ? 'Actif' : 'Inactif'}
            </dd>
            {cabinet.current_period_end && (
              <><dt className="text-muted-foreground">Fin période</dt>
              <dd className="text-coplio-text">{new Date(cabinet.current_period_end).toLocaleDateString('fr-FR')}</dd></>
            )}
          </dl>
        </div>

        {/* Changer de plan */}
        <div className="coplio-card">
          <h2 className="font-semibold text-coplio-text mb-4">Abonnement</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {PLAN_OPTIONS.map(plan => (
              <label
                key={plan}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedPlan === plan ? 'border-[#374151] bg-[#374151]/5' : 'border-border hover:bg-coplio-bg'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input type="radio" name="plan" value={plan} checked={selectedPlan === plan} onChange={() => setSelectedPlan(plan)} className="accent-[#374151]" />
                  <span className="text-sm font-medium text-coplio-text">{PLAN_LABELS[plan]}</span>
                </div>
                <span className="text-xs text-muted-foreground">{PLAN_PRICES[plan] > 0 ? `${PLAN_PRICES[plan]}€/mo` : 'Gratuit'}</span>
              </label>
            ))}
          </div>
          <button
            onClick={updatePlan}
            disabled={saving || selectedPlan === cabinet.plan}
            className="w-full bg-[#374151] text-white font-medium py-2.5 rounded-lg hover:bg-[#374151]/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Enregistrer le plan
          </button>
        </div>

        {/* Utilisateurs */}
        <div className="coplio-card">
          <h2 className="font-semibold text-coplio-text mb-4">Utilisateurs ({profiles.length})</h2>
          {profiles.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">Aucun utilisateur</p>
          ) : (
            <div className="space-y-2">
              {profiles.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-2 bg-coplio-bg rounded-lg">
                  <div className="w-8 h-8 bg-[#374151]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-[#374151]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-coplio-text">{p.prenom} {p.nom}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" />{p.email}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{p.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions dangereuses */}
        <div className="coplio-card border-red-200">
          <h2 className="font-semibold text-coplio-text mb-4">Actions</h2>
          <div className="flex gap-3">
            {isSuspended ? (
              <button
                onClick={reactiver}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-[#374151] text-white font-medium py-2.5 rounded-lg hover:bg-[#374151]/90 transition-colors disabled:opacity-60 text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                Réactiver
              </button>
            ) : (
              <button
                onClick={suspendre}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-orange-500 text-white font-medium py-2.5 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-60 text-sm"
              >
                <Ban className="w-4 h-4" />
                Suspendre
              </button>
            )}
            <button
              onClick={supprimer}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white font-medium py-2.5 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
