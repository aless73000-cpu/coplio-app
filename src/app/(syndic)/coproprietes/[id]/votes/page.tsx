'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Vote, Loader2, CheckCircle2, Clock, Lock,
  Trash2, ChevronDown, ChevronUp, Users
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface VoteOption {
  id: string
  label: string
  ordre: number
}

interface VoteReponse {
  id: string
  option_id: string
  coproprietaire_id: string
}

interface VoteItem {
  id: string
  titre: string
  description?: string
  date_debut: string
  date_fin: string
  statut: 'brouillon' | 'ouvert' | 'clos'
  options: VoteOption[]
  reponses: VoteReponse[]
}

const STATUT_LABELS = {
  brouillon: { label: 'Brouillon', color: 'text-muted-foreground bg-coplio-bg' },
  ouvert: { label: 'Ouvert', color: 'text-[#111827] bg-slate-100' },
  clos: { label: 'Clôturé', color: 'text-coplio-red bg-red-50' },
}

export default function VotesPage() {
  const { id: coproprieteId } = useParams<{ id: string }>()
  const [votes, setVotes] = useState<VoteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Form state
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [statut, setStatut] = useState<'brouillon' | 'ouvert'>('ouvert')
  const [options, setOptions] = useState(['Pour', 'Contre', 'Abstention'])
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/votes?copropriete_id=${coproprieteId}`)
    const data = await res.json()
    setVotes(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [coproprieteId])

  useEffect(() => { load() }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    const validOptions = options.filter(o => o.trim())
    if (validOptions.length < 2) { setFormError('Au moins 2 options requises'); return }
    if (!dateFin) { setFormError('Date de fin requise'); return }

    setCreating(true)
    const res = await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        copropriete_id: coproprieteId,
        titre,
        description,
        date_debut: new Date().toISOString(),
        date_fin: new Date(dateFin).toISOString(),
        statut,
        options: validOptions,
      }),
    })
    setCreating(false)
    if (res.ok) {
      const created = await res.json()
      setVotes(prev => [created, ...prev])
      setShowForm(false)
      setTitre(''); setDescription(''); setDateFin(''); setOptions(['Pour', 'Contre', 'Abstention'])
    } else {
      const d = await res.json()
      setFormError(d.error ?? 'Erreur')
    }
  }

  async function handleStatutChange(voteId: string, newStatut: 'ouvert' | 'clos') {
    await fetch(`/api/votes/${voteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: newStatut }),
    })
    setVotes(prev => prev.map(v => v.id === voteId ? { ...v, statut: newStatut } : v))
  }

  async function handleDelete(voteId: string) {
    if (!confirm('Supprimer ce vote ?')) return
    await fetch(`/api/votes/${voteId}`, { method: 'DELETE' })
    setVotes(prev => prev.filter(v => v.id !== voteId))
  }

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href={`/coproprietes/${coproprieteId}`} className="text-muted-foreground hover:text-coplio-text transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-coplio-text">Votes & consultations</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Créez des votes pour vos copropriétaires</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-[#111827] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#111827]/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau vote
        </button>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <div className="coplio-card">
          <h2 className="font-semibold text-coplio-text mb-4">Créer un vote</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            {formError && <p className="text-sm text-coplio-red">{formError}</p>}

            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">Titre</label>
              <input
                value={titre}
                onChange={e => setTitre(e.target.value)}
                required
                placeholder="Ex: Approbation des comptes 2025"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">Description (optionnel)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                placeholder="Contexte du vote..."
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Date de fin</label>
                <input
                  type="datetime-local"
                  value={dateFin}
                  onChange={e => setDateFin(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Statut initial</label>
                <select
                  value={statut}
                  onChange={e => setStatut(e.target.value as 'brouillon' | 'ouvert')}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20 bg-white"
                >
                  <option value="ouvert">Ouvert immédiatement</option>
                  <option value="brouillon">Brouillon</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-coplio-text mb-2">Options de vote</label>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={opt}
                      onChange={e => setOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
                    />
                    {options.length > 2 && (
                      <button type="button" onClick={() => setOptions(prev => prev.filter((_, j) => j !== i))} className="p-2 text-muted-foreground hover:text-coplio-red transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setOptions(prev => [...prev, ''])}
                  className="text-sm text-[#111827] hover:text-[#111827]/80 flex items-center gap-1 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" /> Ajouter une option
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={creating}
                className="flex items-center gap-2 bg-[#111827] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#111827]/90 disabled:opacity-60">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Créer le vote
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="text-sm text-muted-foreground hover:text-coplio-text px-4 py-2 rounded-lg border border-border">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des votes */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : votes.length === 0 ? (
        <div className="coplio-card text-center py-12">
          <Vote className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-coplio-text mb-1">Aucun vote créé</p>
          <p className="text-sm text-muted-foreground">Créez votre premier vote ci-dessus</p>
        </div>
      ) : (
        <div className="space-y-3">
          {votes.map(vote => {
            const totalVotes = vote.reponses?.length ?? 0
            const isExpanded = expandedId === vote.id
            const { label, color } = STATUT_LABELS[vote.statut]
            const isExpired = new Date(vote.date_fin) < new Date()

            return (
              <div key={vote.id} className="coplio-card">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Vote className="w-5 h-5 text-[#111827]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-coplio-text">{vote.titre}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>{label}</span>
                    </div>
                    {vote.description && <p className="text-sm text-muted-foreground mt-0.5 truncate">{vote.description}</p>}
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />{totalVotes} vote{totalVotes > 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        {isExpired ? <Lock className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        {isExpired ? 'Expiré le' : 'Jusqu\'au'} {formatDate(vote.date_fin)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {vote.statut === 'ouvert' && (
                      <button onClick={() => handleStatutChange(vote.id, 'clos')}
                        className="text-xs text-coplio-red hover:bg-red-50 px-2 py-1 rounded-lg transition-colors font-medium">
                        Clôturer
                      </button>
                    )}
                    {vote.statut === 'brouillon' && (
                      <button onClick={() => handleStatutChange(vote.id, 'ouvert')}
                        className="text-xs text-[#111827] hover:bg-slate-100 px-2 py-1 rounded-lg transition-colors font-medium">
                        Ouvrir
                      </button>
                    )}
                    <button onClick={() => handleDelete(vote.id)}
                      className="p-1.5 text-muted-foreground hover:text-coplio-red transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setExpandedId(isExpanded ? null : vote.id)}
                      className="p-1.5 text-muted-foreground hover:text-coplio-text transition-colors">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Résultats */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Résultats</p>
                    {(vote.options ?? []).sort((a, b) => a.ordre - b.ordre).map(option => {
                      const count = (vote.reponses ?? []).filter(r => r.option_id === option.id).length
                      const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
                      return (
                        <div key={option.id}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-coplio-text font-medium">{option.label}</span>
                            <span className="text-muted-foreground">{count} vote{count > 1 ? 's' : ''} — {pct}%</span>
                          </div>
                          <div className="h-2 bg-coplio-bg rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#111827] rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                    {totalVotes === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-2">Aucun vote pour l&apos;instant</p>
                    )}
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
