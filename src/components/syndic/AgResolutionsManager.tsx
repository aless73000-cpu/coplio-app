'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2, Check, X, Minus, ChevronDown, ChevronUp } from 'lucide-react'

const VOTE_TYPE_LABELS: Record<string, string> = {
  art_24: 'Art. 24 (majorité simple)',
  art_25: 'Art. 25 (majorité absolue)',
  art_26: 'Art. 26 (double majorité)',
  unanimite: 'Unanimité',
}

interface Resolution {
  id: string
  ordre: number
  titre: string
  description?: string
  type_vote: string
  voix_pour: number
  voix_contre: number
  voix_abstention: number
  adoptee?: boolean
}

interface Props {
  agId: string
  initialResolutions: Resolution[]
  canEdit: boolean
}

const inputClass = 'w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green focus:border-transparent placeholder:text-gray-400'

export function AgResolutionsManager({ agId, initialResolutions, canEdit }: Props) {
  const router = useRouter()
  const [resolutions, setResolutions] = useState<Resolution[]>(initialResolutions)
  const [showForm, setShowForm] = useState(false)
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [typeVote, setTypeVote] = useState('art_24')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await fetch(`/api/assemblees/${agId}/resolutions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre: titre.trim(),
          description: description.trim() || null,
          type_vote: typeVote,
          ordre: resolutions.length + 1,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erreur'); return }
      setResolutions(prev => [...prev, data])
      setTitre('')
      setDescription('')
      setTypeVote('art_24')
      setShowForm(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(resId: string) {
    setDeleting(resId)
    try {
      await fetch(`/api/assemblees/${agId}/resolutions?resolution_id=${resId}`, { method: 'DELETE' })
      setResolutions(prev => prev.filter(r => r.id !== resId))
      router.refresh()
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="coplio-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-coplio-text">
          Résolutions ({resolutions.length})
        </h2>
        {canEdit && (
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1 text-xs font-medium text-coplio-green hover:underline"
          >
            {showForm ? <ChevronUp className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            {showForm ? 'Annuler' : 'Ajouter'}
          </button>
        )}
      </div>

      {/* Formulaire ajout */}
      {showForm && (
        <form onSubmit={handleAdd} className="mb-4 p-4 bg-coplio-bg rounded-xl border border-border space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Titre *</label>
            <input
              value={titre}
              onChange={e => setTitre(e.target.value)}
              required
              placeholder="Ex : Approbation des comptes 2024"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Détails de la résolution (optionnel)"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Type de vote</label>
            <select value={typeVote} onChange={e => setTypeVote(e.target.value)} className={inputClass}>
              {Object.entries(VOTE_TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-xs text-coplio-red">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setShowForm(false); setError('') }}
              className="px-3 py-1.5 text-xs text-muted-foreground bg-white border border-border rounded-lg hover:bg-coplio-bg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !titre.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-coplio-green rounded-lg hover:bg-coplio-green/90 disabled:opacity-60"
            >
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              Ajouter la résolution
            </button>
          </div>
        </form>
      )}

      {/* Liste */}
      {resolutions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Aucune résolution</p>
          {canEdit && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 text-xs text-coplio-green hover:underline"
            >
              + Préparer l&apos;ordre du jour
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {resolutions.map((res, i) => {
            const total = res.voix_pour + res.voix_contre + res.voix_abstention
            return (
              <div key={res.id} className="border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="text-xs text-muted-foreground bg-coplio-bg px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5">
                      #{i + 1}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-medium text-coplio-text text-sm">{res.titre}</h3>
                      {res.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{res.description}</p>
                      )}
                      <span className="inline-block mt-1.5 text-[10px] text-muted-foreground bg-coplio-bg border border-border px-2 py-0.5 rounded-full">
                        {VOTE_TYPE_LABELS[res.type_vote] ?? res.type_vote}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {res.adoptee !== null && res.adoptee !== undefined && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        res.adoptee ? 'bg-coplio-green-light text-coplio-green' : 'bg-red-50 text-red-600'
                      }`}>
                        {res.adoptee ? 'Adoptée' : 'Rejetée'}
                      </span>
                    )}
                    {canEdit && (
                      <button
                        onClick={() => handleDelete(res.id)}
                        disabled={deleting === res.id}
                        className="p-1 text-muted-foreground hover:text-coplio-red transition-colors"
                        title="Supprimer"
                      >
                        {deleting === res.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />
                        }
                      </button>
                    )}
                  </div>
                </div>

                {/* Résultats */}
                {total > 0 && (
                  <div className="flex items-center gap-4 text-xs mt-2 pt-2 border-t border-border">
                    <span className="flex items-center gap-1 text-coplio-green">
                      <Check className="w-3 h-3" /> {res.voix_pour} pour
                    </span>
                    <span className="flex items-center gap-1 text-coplio-red">
                      <X className="w-3 h-3" /> {res.voix_contre} contre
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Minus className="w-3 h-3" /> {res.voix_abstention} abstention
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
