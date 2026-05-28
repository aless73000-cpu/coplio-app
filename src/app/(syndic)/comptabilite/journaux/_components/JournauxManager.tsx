'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Loader2, BookMarked } from 'lucide-react'

interface Journal {
  id: string
  code: string
  libelle: string
  type_journal: string
  actif: boolean
}

const TYPE_LABELS: Record<string, string> = {
  achats:              'Achats',
  banque:              'Banque',
  caisse:              'Caisse',
  operations_diverses: 'Opérations diverses',
  a_nouveau:           'À-nouveaux',
}

const JOURNAUX_DEFAUT = [
  { code: 'AC', libelle: 'Achats',               type_journal: 'achats'              },
  { code: 'BQ', libelle: 'Banque',               type_journal: 'banque'              },
  { code: 'OD', libelle: 'Opérations diverses',  type_journal: 'operations_diverses' },
  { code: 'RG', libelle: 'Régularisations',      type_journal: 'operations_diverses' },
]

export function JournauxManager({ coproprieteId, journaux: initial }: {
  coproprieteId: string
  journaux: Journal[]
}) {
  const router = useRouter()
  const [journaux, setJournaux] = useState<Journal[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [form, setForm] = useState({ code: '', libelle: '', type_journal: 'operations_diverses' })
  const [error, setError] = useState<string | null>(null)

  async function creerJournal(e: React.FormEvent) {
    e.preventDefault()
    if (!form.code.trim() || !form.libelle.trim()) return
    setLoading('create')
    setError(null)
    const supabase = createClient()
    const { data, error: err } = await supabase
      .from('journaux')
      .insert({
        copropriete_id: coproprieteId,
        code:           form.code.toUpperCase(),
        libelle:        form.libelle,
        type_journal:   form.type_journal,
        actif:          true,
      })
      .select()
      .single()

    if (err) { setError(err.message); setLoading(null); return }
    setJournaux(p => [...p, data as Journal].sort((a, b) => a.code.localeCompare(b.code)))
    setForm({ code: '', libelle: '', type_journal: 'od' })
    setShowForm(false)
    setLoading(null)
  }

  async function supprimerJournal(id: string) {
    setLoading(id)
    const supabase = createClient()
    const { error: err } = await supabase.from('journaux').delete().eq('id', id)
    if (!err) setJournaux(p => p.filter(j => j.id !== id))
    setLoading(null)
  }

  async function creerDefauts() {
    setLoading('defauts')
    const supabase = createClient()
    const existingCodes = journaux.map(j => j.code)
    const aCreer = JOURNAUX_DEFAUT.filter(j => !existingCodes.includes(j.code))
    if (aCreer.length === 0) { setLoading(null); return }

    const { data, error: err } = await supabase
      .from('journaux')
      .insert(aCreer.map(j => ({ ...j, copropriete_id: coproprieteId, actif: true })))
      .select()

    if (!err && data) {
      setJournaux(p => [...p, ...data as Journal[]].sort((a, b) => a.code.localeCompare(b.code)))
    }
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Actions rapides */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {journaux.length} {journaux.length !== 1 ? 'journaux' : 'journal'}
        </p>
        <div className="flex gap-2">
          {journaux.length === 0 && (
            <button
              onClick={creerDefauts}
              disabled={loading === 'defauts'}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-slate-50 transition-colors"
            >
              {loading === 'defauts' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookMarked className="w-3.5 h-3.5" />}
              Créer les journaux standard
            </button>
          )}
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-[#374151] text-white rounded-lg hover:bg-[#374151]/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouveau journal
          </button>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <form onSubmit={creerJournal} className="coplio-card space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Code <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase().slice(0, 4) }))}
                placeholder="BQ"
                maxLength={4}
                required
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Libellé <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.libelle}
                onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))}
                placeholder="Banque"
                required
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <select
                value={form.type_journal}
                onChange={e => setForm(f => ({ ...f, type_journal: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20 bg-white"
              >
                {Object.entries(TYPE_LABELS).map(([val, lbl]) => (
                  <option key={val} value={val}>{lbl}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null) }}
              className="px-4 py-2 text-sm font-medium text-coplio-text border border-border rounded-lg hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading === 'create'}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-[#374151] text-white rounded-lg hover:bg-[#374151]/90 disabled:opacity-50 transition-colors"
            >
              {loading === 'create' && <Loader2 className="w-4 h-4 animate-spin" />}
              Créer
            </button>
          </div>
        </form>
      )}

      {/* Liste */}
      {journaux.length === 0 ? (
        <div className="coplio-card text-center py-12">
          <BookMarked className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-coplio-text mb-1">Aucun journal</p>
          <p className="text-sm text-muted-foreground">
            Créez les journaux standard (AC, BQ, OD) ou ajoutez-les manuellement.
          </p>
        </div>
      ) : (
        <div className="coplio-card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50/40">
                <th className="text-left py-2.5 px-5 text-xs text-muted-foreground font-medium w-20">Code</th>
                <th className="text-left py-2.5 px-3 text-xs text-muted-foreground font-medium">Libellé</th>
                <th className="text-left py-2.5 px-3 text-xs text-muted-foreground font-medium hidden sm:table-cell">Type</th>
                <th className="py-2.5 px-5 w-10" />
              </tr>
            </thead>
            <tbody>
              {journaux.map(j => (
                <tr key={j.id} className="border-b border-border last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-5 font-mono font-bold text-[#374151]">{j.code}</td>
                  <td className="py-3 px-3 text-coplio-text">{j.libelle}</td>
                  <td className="py-3 px-3 text-muted-foreground text-xs hidden sm:table-cell">
                    {TYPE_LABELS[j.type_journal] ?? j.type_journal}
                  </td>
                  <td className="py-3 px-5">
                    <button
                      onClick={() => supprimerJournal(j.id)}
                      disabled={loading === j.id}
                      className="text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      {loading === j.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
