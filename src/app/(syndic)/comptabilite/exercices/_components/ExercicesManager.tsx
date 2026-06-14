'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Lock, Loader2, CalendarDays, CheckCircle2, Clock } from 'lucide-react'

interface Exercice {
  id: string
  annee: number
  date_debut: string
  date_fin: string
  statut: string
  date_cloture: string | null
}

const STATUT_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  en_cours: { label: 'En cours',   color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
  cloture:  { label: 'Clôturé',   color: 'bg-slate-100 text-slate-500 border-border',         icon: Lock },
  prepare:  { label: 'Préparation', color: 'bg-amber-50 text-amber-700 border-amber-100',     icon: Clock },
}

const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

export function ExercicesManager({ coproprieteId, exercices: initial }: {
  coproprieteId: string
  exercices: Exercice[]
}) {
  const router = useRouter()
  const [exercices, setExercices] = useState<Exercice[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const nextAnnee = (exercices[0]?.annee ?? new Date().getFullYear() - 1) + 1
  const [form, setForm] = useState({
    annee:      String(nextAnnee),
    date_debut: `${nextAnnee}-01-01`,
    date_fin:   `${nextAnnee}-12-31`,
  })

  async function creer(e: React.FormEvent) {
    e.preventDefault()
    const annee = parseInt(form.annee)
    if (isNaN(annee)) { setError('Année invalide'); return }
    setLoading('create')
    setError(null)

    const res = await fetch('/api/exercices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        copropriete_id: coproprieteId,
        annee,
        date_debut: form.date_debut,
        date_fin:   form.date_fin,
      }),
    })

    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Erreur création')
      setLoading(null)
      return
    }

    const data = await res.json()
    setExercices(p => [data, ...p])
    setShowForm(false)
    setLoading(null)
    router.refresh()
  }

  async function cloturerExercice(id: string) {
    setLoading(id)
    const res = await fetch(`/api/exercices/${id}/cloture`, {
      method: 'POST',
    })
    if (res.ok) {
      setExercices(p => p.map(ex => ex.id === id ? { ...ex, statut: 'cloture', date_cloture: new Date().toISOString() } : ex))
    }
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{exercices.length} exercice{exercices.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-[#374151] text-white rounded-lg hover:bg-[#374151]/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nouvel exercice
        </button>
      </div>

      {showForm && (
        <form onSubmit={creer} className="coplio-card space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Année <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={form.annee}
                onChange={e => {
                  const y = e.target.value
                  setForm(f => ({ ...f, annee: y, date_debut: `${y}-01-01`, date_fin: `${y}-12-31` }))
                }}
                min="2000"
                max="2100"
                required
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Date début</label>
              <input
                type="date"
                value={form.date_debut}
                onChange={e => setForm(f => ({ ...f, date_debut: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Date fin</label>
              <input
                type="date"
                value={form.date_fin}
                onChange={e => setForm(f => ({ ...f, date_fin: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => { setShowForm(false); setError(null) }}
              className="px-4 py-2 text-sm font-medium text-coplio-text border border-border rounded-lg hover:bg-slate-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={loading === 'create'}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-[#374151] text-white rounded-lg hover:bg-[#374151]/90 disabled:opacity-50 transition-colors">
              {loading === 'create' && <Loader2 className="w-4 h-4 animate-spin" />}
              Créer
            </button>
          </div>
        </form>
      )}

      {exercices.length === 0 ? (
        <div className="coplio-card text-center py-12">
          <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-coplio-text mb-1">Aucun exercice</p>
          <p className="text-sm text-muted-foreground">Créez l&apos;exercice de l&apos;année en cours pour commencer la saisie.</p>
        </div>
      ) : (
        <div className="coplio-card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50/40">
                <th className="text-left py-2.5 px-5 text-xs text-muted-foreground font-medium">Année</th>
                <th className="text-left py-2.5 px-3 text-xs text-muted-foreground font-medium hidden sm:table-cell">Période</th>
                <th className="text-left py-2.5 px-3 text-xs text-muted-foreground font-medium">Statut</th>
                <th className="text-left py-2.5 px-3 text-xs text-muted-foreground font-medium hidden md:table-cell">Clôturé le</th>
                <th className="py-2.5 px-5 w-32" />
              </tr>
            </thead>
            <tbody>
              {exercices.map(ex => {
                const st = STATUT_CONFIG[ex.statut] ?? STATUT_CONFIG['en_cours']
                const StIcon = st.icon
                return (
                  <tr key={ex.id} className="border-b border-border last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-5 font-bold text-[#374151] text-base">{ex.annee}</td>
                    <td className="py-3 px-3 text-muted-foreground text-xs hidden sm:table-cell">
                      {fmt(ex.date_debut)} → {fmt(ex.date_fin)}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`flex items-center gap-1 w-fit text-xs font-medium px-2.5 py-1 rounded-full border ${st.color}`}>
                        <StIcon className="w-3 h-3" />
                        {st.label}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground text-xs hidden md:table-cell">
                      {ex.date_cloture ? fmt(ex.date_cloture) : '—'}
                    </td>
                    <td className="py-3 px-5">
                      {ex.statut !== 'cloture' && (
                        <button
                          onClick={() => cloturerExercice(ex.id)}
                          disabled={loading === ex.id}
                          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-[#374151] transition-colors"
                        >
                          {loading === ex.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lock className="w-3 h-3" />}
                          Clôturer
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
