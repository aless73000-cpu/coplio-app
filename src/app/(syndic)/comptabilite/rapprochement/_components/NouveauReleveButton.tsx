'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Loader2 } from 'lucide-react'

interface Props {
  compteBancaireId: string
  coproprieteId: string
}

export function NouveauReleveButton({ compteBancaireId, coproprieteId }: Props) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  // Calculer la plage du mois précédent par défaut
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastOfPrevMonth = new Date(firstOfMonth.getTime() - 86400000)
  const firstOfPrevMonth = new Date(lastOfPrevMonth.getFullYear(), lastOfPrevMonth.getMonth(), 1)

  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  const [form, setForm] = useState({
    date_debut:  fmt(firstOfPrevMonth),
    date_fin:    fmt(lastOfPrevMonth),
    solde_debut: '',
    solde_fin:   '',
  })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()

    const { data: releve, error } = await supabase
      .from('releves_bancaires')
      .insert({
        compte_bancaire_id: compteBancaireId,
        copropriete_id:     coproprieteId,
        date_debut:         form.date_debut,
        date_fin:           form.date_fin,
        solde_debut:        parseFloat(form.solde_debut) || 0,
        solde_fin:          parseFloat(form.solde_fin)   || 0,
        statut:             'en_cours',
      })
      .select('id')
      .single()

    setSaving(false)
    if (!error && releve) {
      setShowModal(false)
      router.push(`/comptabilite/rapprochement/${releve.id}?copropriete=${coproprieteId}`)
      router.refresh()
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 bg-[#374151] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#374151]/90 transition-colors flex-shrink-0"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Nouveau relevé</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-coplio-text">Nouveau relevé bancaire</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-coplio-text">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Date début</label>
                  <input
                    type="date"
                    value={form.date_debut}
                    onChange={e => setForm(f => ({ ...f, date_debut: e.target.value }))}
                    required
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Date fin</label>
                  <input
                    type="date"
                    value={form.date_fin}
                    onChange={e => setForm(f => ({ ...f, date_fin: e.target.value }))}
                    required
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Solde début (€)</label>
                  <input
                    type="number"
                    value={form.solde_debut}
                    onChange={e => setForm(f => ({ ...f, solde_debut: e.target.value }))}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Solde fin (€)</label>
                  <input
                    type="number"
                    value={form.solde_fin}
                    onChange={e => setForm(f => ({ ...f, solde_fin: e.target.value }))}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Vous pourrez saisir les lignes du relevé sur la page suivante.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-coplio-text border border-border rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-[#374151] text-white rounded-xl hover:bg-[#374151]/90 disabled:opacity-50 transition-colors"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
