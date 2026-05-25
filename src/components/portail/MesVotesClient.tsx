'use client'

import { useState } from 'react'
import { Vote, Clock, CheckCircle2, Loader2, Lock } from 'lucide-react'
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
  date_fin: string
  options: VoteOption[]
  reponses: VoteReponse[]
}

interface Props {
  userId: string
  votes: VoteItem[]
}

export function MesVotesClient({ userId, votes: initialVotes }: Props) {
  const [votes, setVotes] = useState(initialVotes)
  const [voting, setVoting] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleVote(voteId: string, optionId: string) {
    setVoting(optionId)
    setErrors(prev => ({ ...prev, [voteId]: '' }))
    const res = await fetch(`/api/votes/${voteId}/repondre`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ option_id: optionId }),
    })
    if (res.ok) {
      setVotes(prev => prev.map(v =>
        v.id === voteId
          ? { ...v, reponses: [...v.reponses, { id: Date.now().toString(), option_id: optionId, coproprietaire_id: userId }] }
          : v
      ))
    } else {
      const d = await res.json()
      setErrors(prev => ({ ...prev, [voteId]: d.error ?? 'Erreur' }))
    }
    setVoting(null)
  }

  if (votes.length === 0) {
    return (
      <div className="coplio-card text-center py-16">
        <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Vote className="w-7 h-7 text-[#374151]" />
        </div>
        <p className="font-semibold text-coplio-text mb-1">Aucun vote en cours</p>
        <p className="text-sm text-muted-foreground">Votre syndic n&apos;a pas de consultation ouverte pour le moment.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {votes.map(vote => {
        const myReponse = vote.reponses.find(r => r.coproprietaire_id === userId)
        const hasVoted = !!myReponse
        const totalVotes = vote.reponses.length
        const isExpired = new Date(vote.date_fin) < new Date()
        const sortedOptions = [...(vote.options ?? [])].sort((a, b) => a.ordre - b.ordre)

        return (
          <div key={vote.id} className="coplio-card">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Vote className="w-5 h-5 text-[#374151]" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-coplio-text">{vote.titre}</h2>
                {vote.description && <p className="text-sm text-muted-foreground mt-0.5">{vote.description}</p>}
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  {isExpired ? <Lock className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  <span>{isExpired ? 'Clôturé le' : 'Jusqu\'au'} {formatDate(vote.date_fin)}</span>
                </div>
              </div>
              {hasVoted && (
                <div className="flex items-center gap-1 text-[#374151] text-xs font-medium flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                  Voté
                </div>
              )}
            </div>

            {errors[vote.id] && <p className="text-sm text-coplio-red mb-3">{errors[vote.id]}</p>}

            <div className="space-y-2">
              {sortedOptions.map(option => {
                const count = vote.reponses.filter(r => r.option_id === option.id).length
                const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
                const isMyChoice = myReponse?.option_id === option.id
                const canVote = !hasVoted && !isExpired

                return (
                  <div key={option.id}>
                    {canVote ? (
                      <button
                        onClick={() => handleVote(vote.id, option.id)}
                        disabled={voting === option.id}
                        className="w-full text-left px-4 py-3 rounded-xl border-2 border-border hover:border-[#374151] hover:bg-slate-100 transition-all text-sm font-medium text-coplio-text flex items-center justify-between group disabled:opacity-60"
                      >
                        <span>{option.label}</span>
                        {voting === option.id
                          ? <Loader2 className="w-4 h-4 animate-spin text-[#374151]" />
                          : <span className="text-xs text-muted-foreground group-hover:text-[#374151]">Voter →</span>
                        }
                      </button>
                    ) : (
                      <div className={`px-4 py-3 rounded-xl border-2 transition-all ${
                        isMyChoice ? 'border-[#374151] bg-slate-100' : 'border-border bg-coplio-bg'
                      }`}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className={`font-medium ${isMyChoice ? 'text-[#374151]' : 'text-coplio-text'}`}>
                            {option.label}
                            {isMyChoice && ' ✓'}
                          </span>
                          <span className="text-muted-foreground text-xs">{count} vote{count > 1 ? 's' : ''} — {pct}%</span>
                        </div>
                        <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isMyChoice ? 'bg-[#374151]' : 'bg-muted-foreground/30'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {(hasVoted || isExpired) && (
              <p className="text-xs text-muted-foreground mt-3 text-center">
                {totalVotes} participant{totalVotes > 1 ? 's' : ''} au total
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
