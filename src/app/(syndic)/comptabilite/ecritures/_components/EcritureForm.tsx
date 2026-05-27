'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface Journal   { id: string; code: string; libelle: string; type_journal: string }
interface Exercice  { id: string; annee: number }
interface Compte    { id: string; numero: string; libelle: string }

interface LigneForm {
  compte_id:  string
  libelle:    string
  debit:      string
  credit:     string
}

const emptyLigne = (): LigneForm => ({
  compte_id: '', libelle: '', debit: '', credit: '',
})

function fmt2(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function EcritureForm({
  coproprieteId,
  journaux,
  exercices,
  comptes,
  defaultJournalId,
}: {
  coproprieteId: string
  journaux:  Journal[]
  exercices: Exercice[]
  comptes:   Compte[]
  defaultJournalId?: string
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const [journalId,   setJournalId]   = useState(defaultJournalId ?? journaux[0]?.id ?? '')
  const [exerciceId,  setExerciceId]  = useState(exercices[0]?.id ?? '')
  const [date,        setDate]        = useState(new Date().toISOString().slice(0, 10))
  const [libelle,     setLibelle]     = useState('')
  const [numeroPiece, setNumeroPiece] = useState('')
  const [lignes, setLignes] = useState<LigneForm[]>([emptyLigne(), emptyLigne()])

  const totalDebit  = lignes.reduce((s, l) => s + (parseFloat(l.debit)  || 0), 0)
  const totalCredit = lignes.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0)
  const equilibre   = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0

  function updateLigne(i: number, key: keyof LigneForm, val: string) {
    setLignes(prev => prev.map((l, idx) => idx === i ? { ...l, [key]: val } : l))
  }

  function setDebit(i: number, val: string) {
    setLignes(prev => prev.map((l, idx) =>
      idx === i ? { ...l, debit: val, credit: val ? '' : l.credit } : l
    ))
  }

  function setCredit(i: number, val: string) {
    setLignes(prev => prev.map((l, idx) =>
      idx === i ? { ...l, credit: val, debit: val ? '' : l.debit } : l
    ))
  }

  const addLigne = useCallback(() => setLignes(p => [...p, emptyLigne()]), [])

  function removeLigne(i: number) {
    if (lignes.length <= 2) return
    setLignes(prev => prev.filter((_, idx) => idx !== i))
  }

  // Suggestion automatique contrepartie
  function suggestContrepartie(i: number) {
    const filled = lignes.filter((l, idx) => idx !== i && l.compte_id)
    if (filled.length !== 1) return
    const other = filled[0]
    const otherDebit = parseFloat(other.debit) || 0
    const otherCredit = parseFloat(other.credit) || 0
    if (otherDebit > 0 && !lignes[i].debit && !lignes[i].credit) {
      updateLigne(i, 'credit', String(otherDebit))
    } else if (otherCredit > 0 && !lignes[i].debit && !lignes[i].credit) {
      updateLigne(i, 'debit', String(otherCredit))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!journalId) { setError('Sélectionnez un journal.'); return }
    if (!libelle.trim()) { setError('Le libellé est obligatoire.'); return }
    const validLignes = lignes.filter(l => l.compte_id && ((parseFloat(l.debit)||0) > 0 || (parseFloat(l.credit)||0) > 0))
    if (validLignes.length < 2) { setError('Saisissez au moins 2 lignes.'); return }
    if (!equilibre) { setError(`Écriture non équilibrée — écart de ${fmt2(Math.abs(totalDebit - totalCredit))} €.`); return }

    setSaving(true)
    setError(null)
    const supabase = createClient()

    const { data: ecriture, error: ecErr } = await supabase
      .from('ecritures_comptables')
      .insert({
        copropriete_id: coproprieteId,
        journal_id:     journalId,
        exercice_id:    exerciceId || null,
        date_ecriture:  date,
        libelle,
        numero_piece:   numeroPiece || null,
        statut:         'brouillon',
      })
      .select('id')
      .single()

    if (ecErr || !ecriture) {
      setError(ecErr?.message ?? 'Erreur création écriture.')
      setSaving(false)
      return
    }

    const lignesData = validLignes.map((l, i) => ({
      ecriture_id: ecriture.id,
      compte_id:   l.compte_id,
      libelle:     l.libelle || null,
      debit:       parseFloat(l.debit)  || 0,
      credit:      parseFloat(l.credit) || 0,
      ordre:       i,
    }))

    const { error: ligErr } = await supabase.from('lignes_ecriture').insert(lignesData)
    if (ligErr) { setError(ligErr.message); setSaving(false); return }

    router.push(`/comptabilite/ecritures/${ecriture.id}?copropriete=${coproprieteId}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* En-tête */}
      <div className="coplio-card space-y-4">
        <h2 className="text-sm font-semibold text-coplio-text">Informations générales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Journal <span className="text-red-500">*</span></label>
            <select
              value={journalId}
              onChange={e => setJournalId(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20 bg-white"
            >
              <option value="">— Choisir —</option>
              {journaux.map(j => (
                <option key={j.id} value={j.id}>{j.code} — {j.libelle}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20 bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">N° pièce</label>
            <input
              type="text"
              value={numeroPiece}
              onChange={e => setNumeroPiece(e.target.value)}
              placeholder="FAC-001"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20 bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Exercice</label>
            <select
              value={exerciceId}
              onChange={e => setExerciceId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20 bg-white"
            >
              <option value="">— Aucun —</option>
              {exercices.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.annee}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Libellé <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={libelle}
            onChange={e => setLibelle(e.target.value)}
            required
            placeholder="Règlement facture entretien ascenseur"
            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20 bg-white"
          />
        </div>
      </div>

      {/* Lignes */}
      <div className="coplio-card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-coplio-text">Lignes comptables</h2>
          <div className="flex items-center gap-3">
            {/* Indicateur équilibre */}
            <div className={`flex items-center gap-1.5 text-xs font-medium ${equilibre ? 'text-emerald-600' : totalDebit > 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
              {equilibre
                ? <><CheckCircle2 className="w-3.5 h-3.5" />Équilibrée</>
                : totalDebit > 0
                  ? <><AlertCircle className="w-3.5 h-3.5" />Écart {fmt2(Math.abs(totalDebit - totalCredit))} €</>
                  : null
              }
            </div>
            <button
              type="button"
              onClick={addLigne}
              className="flex items-center gap-1.5 text-xs font-medium text-[#374151] hover:text-[#374151]/70 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Ajouter
            </button>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-slate-50/40">
              <th className="text-left py-2 px-4 text-xs text-muted-foreground font-medium w-8">#</th>
              <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Compte</th>
              <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium hidden md:table-cell">Libellé ligne</th>
              <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium w-32">Débit (€)</th>
              <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium w-32">Crédit (€)</th>
              <th className="w-8 py-2 px-4" />
            </tr>
          </thead>
          <tbody>
            {lignes.map((ligne, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="py-2 px-4 text-xs text-muted-foreground">{i + 1}</td>
                <td className="py-2 px-3">
                  <select
                    value={ligne.compte_id}
                    onChange={e => { updateLigne(i, 'compte_id', e.target.value); }}
                    onBlur={() => suggestContrepartie(i)}
                    className="w-full px-2 py-1.5 text-xs border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#374151]/30 bg-white max-w-[220px]"
                  >
                    <option value="">— Compte —</option>
                    {comptes.map(c => (
                      <option key={c.id} value={c.id}>{c.numero} — {c.libelle}</option>
                    ))}
                  </select>
                </td>
                <td className="py-2 px-3 hidden md:table-cell">
                  <input
                    type="text"
                    value={ligne.libelle}
                    onChange={e => updateLigne(i, 'libelle', e.target.value)}
                    placeholder="Libellé optionnel"
                    className="w-full px-2 py-1.5 text-xs border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#374151]/30 bg-white"
                  />
                </td>
                <td className="py-2 px-3">
                  <input
                    type="number"
                    value={ligne.debit}
                    onChange={e => setDebit(i, e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    disabled={!!ligne.credit}
                    className="w-full px-2 py-1.5 text-xs text-right border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-red-300 bg-white disabled:bg-slate-50 disabled:text-muted-foreground font-mono"
                  />
                </td>
                <td className="py-2 px-3">
                  <input
                    type="number"
                    value={ligne.credit}
                    onChange={e => setCredit(i, e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    disabled={!!ligne.debit}
                    className="w-full px-2 py-1.5 text-xs text-right border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-300 bg-white disabled:bg-slate-50 disabled:text-muted-foreground font-mono"
                  />
                </td>
                <td className="py-2 px-4">
                  <button
                    type="button"
                    onClick={() => removeLigne(i)}
                    disabled={lignes.length <= 2}
                    className="text-muted-foreground hover:text-red-500 disabled:opacity-20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          {/* Totaux */}
          <tfoot>
            <tr className={`border-t-2 ${equilibre ? 'border-emerald-200 bg-emerald-50/30' : totalDebit > 0 ? 'border-red-200 bg-red-50/20' : 'border-border bg-slate-50'}`}>
              <td colSpan={3} className="py-2.5 px-4 text-xs font-semibold text-coplio-text">
                Totaux
              </td>
              <td className="py-2.5 px-3 text-right font-mono text-sm font-bold text-red-600">
                {totalDebit > 0 ? fmt2(totalDebit) : '—'}
              </td>
              <td className="py-2.5 px-3 text-right font-mono text-sm font-bold text-emerald-600">
                {totalCredit > 0 ? fmt2(totalCredit) : '—'}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-coplio-text border border-border rounded-lg hover:bg-slate-50 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={saving || !equilibre}
          className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-[#374151] text-white rounded-lg hover:bg-[#374151]/90 disabled:opacity-50 transition-colors"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Enregistrer en brouillon
        </button>
      </div>
    </form>
  )
}
