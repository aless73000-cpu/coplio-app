'use client'

import { useState, useEffect, useCallback } from 'react'
import { Receipt, Plus, Loader2, Download, Trash2, Info } from 'lucide-react'
import { ConfirmButton } from '@/components/ui/ConfirmButton'
import { formatEuro } from '@/lib/utils'

interface Copro { id: string; nom: string }

interface FactureHonoraires {
  id: string
  numero: string | null
  objet: string
  periode_type: string
  periode_label: string | null
  date_emission: string
  date_echeance: string | null
  montant_ht: number
  taux_tva: number
  montant_tva: number
  montant_ttc: number
  statut: string
  copropriete?: { nom?: string } | null
}

const STATUTS: Record<string, { label: string; cls: string }> = {
  brouillon: { label: 'Brouillon', cls: 'bg-slate-100 text-slate-600' },
  emise: { label: 'Émise', cls: 'bg-blue-50 text-blue-700' },
  payee: { label: 'Payée', cls: 'bg-emerald-50 text-emerald-700' },
  annulee: { label: 'Annulée', cls: 'bg-red-50 text-red-700' },
}

const PERIODE_LABELS: Record<string, string> = { mensuel: 'Mensuel', annuel: 'Annuel', ponctuel: 'Ponctuel' }

function emptyForm(coproId: string) {
  return {
    copropriete_id: coproId,
    objet: 'Honoraires de gestion',
    periode_type: 'mensuel',
    periode_label: '',
    montant_ht: '',
    taux_tva: '20',
    date_echeance: '',
    notes: '',
  }
}

export function FacturesHonorairesClient({ coprops, initialCopropriete }: { coprops: Copro[]; initialCopropriete: string | null }) {
  const defaultCopro = initialCopropriete ?? coprops[0]?.id ?? ''
  const [coproFilter, setCoproFilter] = useState<string>('all')
  const [factures, setFactures] = useState<FactureHonoraires[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm(defaultCopro))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFactures = useCallback(async () => {
    setLoading(true)
    try {
      const url = coproFilter === 'all' ? '/api/factures-honoraires' : `/api/factures-honoraires?copropriete=${coproFilter}`
      const res = await fetch(url)
      const data = await res.json()
      setFactures(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [coproFilter])

  useEffect(() => { loadFactures() }, [loadFactures])

  const ht = Number(form.montant_ht) || 0
  const taux = Number(form.taux_tva) || 0
  const ttcPreview = Math.round((ht + Math.round(ht * taux) / 100) * 100) / 100

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.copropriete_id) { setError('Sélectionnez une copropriété.'); return }
    setSaving(true)
    const res = await fetch('/api/factures-honoraires', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, montant_ht: ht, taux_tva: taux }),
    })
    setSaving(false)
    if (res.ok) {
      const data = await res.json()
      setFactures(prev => [data, ...prev])
      setShowForm(false)
      setForm(emptyForm(defaultCopro))
    } else {
      const err = await res.json().catch(() => ({}))
      setError(err.error ?? 'Erreur lors de la création.')
    }
  }

  async function handleStatut(id: string, statut: string) {
    await fetch(`/api/factures-honoraires/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
    })
    setFactures(prev => prev.map(f => (f.id === id ? { ...f, statut } : f)))
  }

  async function handleDelete(id: string) {
    await fetch(`/api/factures-honoraires/${id}`, { method: 'DELETE' })
    setFactures(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div className="space-y-4">
      {/* Explication du modèle à deux niveaux */}
      <div className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
        <Info className="w-4 h-4 text-[#374151] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-coplio-text">
          Cette facture forfaitaire est émise <span className="font-semibold">au syndicat</span>. La répartition de ce montant
          <span className="font-semibold"> entre les lots</span> se fait par tantièmes, via le budget voté et les appels de charges.
        </p>
      </div>

      {/* Barre d'actions */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <select
          value={coproFilter}
          onChange={e => setCoproFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#374151]/20"
        >
          <option value="all">Toutes les copropriétés</option>
          {coprops.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
        <button
          onClick={() => { setShowForm(v => !v); setError(null) }}
          disabled={coprops.length === 0}
          className="flex items-center gap-2 bg-[#374151] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#374151]/90 transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />Nouvelle facture
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <form onSubmit={handleCreate} className="coplio-card space-y-3">
          <h3 className="font-semibold text-coplio-text">Nouvelle facture d&apos;honoraires</h3>
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 text-xs text-muted-foreground">
              Copropriété
              <select value={form.copropriete_id} onChange={e => setForm(f => ({ ...f, copropriete_id: e.target.value }))}
                className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#374151]/20">
                {coprops.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </label>
            <label className="col-span-2 text-xs text-muted-foreground">
              Objet
              <input value={form.objet} onChange={e => setForm(f => ({ ...f, objet: e.target.value }))}
                className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20" />
            </label>
            <label className="text-xs text-muted-foreground">
              Périodicité
              <select value={form.periode_type} onChange={e => setForm(f => ({ ...f, periode_type: e.target.value }))}
                className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#374151]/20">
                {Object.entries(PERIODE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="text-xs text-muted-foreground">
              Période (libellé)
              <input value={form.periode_label} onChange={e => setForm(f => ({ ...f, periode_label: e.target.value }))} placeholder="Juin 2026"
                className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20" />
            </label>
            <label className="text-xs text-muted-foreground">
              Montant HT (€)
              <input type="number" step="0.01" min="0" value={form.montant_ht} onChange={e => setForm(f => ({ ...f, montant_ht: e.target.value }))} required
                className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20" />
            </label>
            <label className="text-xs text-muted-foreground">
              TVA (%)
              <input type="number" step="0.1" min="0" value={form.taux_tva} onChange={e => setForm(f => ({ ...f, taux_tva: e.target.value }))}
                className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20" />
            </label>
            <label className="text-xs text-muted-foreground">
              Échéance
              <input type="date" value={form.date_echeance} onChange={e => setForm(f => ({ ...f, date_echeance: e.target.value }))}
                className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20" />
            </label>
            <div className="flex items-end text-sm">
              <span className="text-muted-foreground">Total TTC&nbsp;:&nbsp;</span>
              <span className="font-semibold text-coplio-text">{formatEuro(ttcPreview)}</span>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 bg-[#374151] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#374151]/90 disabled:opacity-60">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}Créer la facture
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-muted-foreground px-4 py-2 border border-border rounded-lg">Annuler</button>
          </div>
        </form>
      )}

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : factures.length === 0 ? (
        <div className="coplio-card text-center py-12">
          <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-coplio-text">Aucune facture d&apos;honoraires</p>
          <p className="text-sm text-muted-foreground mt-1">Émettez votre première facture forfaitaire au syndicat.</p>
        </div>
      ) : (
        <div className="coplio-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground font-medium text-xs">Numéro</th>
                <th className="text-left py-2 text-muted-foreground font-medium text-xs hidden md:table-cell">Copropriété</th>
                <th className="text-left py-2 text-muted-foreground font-medium text-xs hidden lg:table-cell">Période</th>
                <th className="text-right py-2 text-muted-foreground font-medium text-xs hidden md:table-cell">HT</th>
                <th className="text-right py-2 text-muted-foreground font-medium text-xs">TTC</th>
                <th className="text-left py-2 text-muted-foreground font-medium text-xs">Statut</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {factures.map(f => {
                const st = STATUTS[f.statut] ?? STATUTS.brouillon
                return (
                  <tr key={f.id} className="border-b border-border hover:bg-coplio-bg transition-colors">
                    <td className="py-3 font-medium text-coplio-text">{f.numero ?? '—'}</td>
                    <td className="py-3 text-muted-foreground hidden md:table-cell">{f.copropriete?.nom ?? '—'}</td>
                    <td className="py-3 text-muted-foreground hidden lg:table-cell">
                      {f.periode_label || PERIODE_LABELS[f.periode_type] || '—'}
                    </td>
                    <td className="py-3 text-right text-muted-foreground hidden md:table-cell">{formatEuro(f.montant_ht)}</td>
                    <td className="py-3 text-right font-medium text-coplio-text">{formatEuro(f.montant_ttc)}</td>
                    <td className="py-3">
                      <select value={f.statut} onChange={e => handleStatut(f.id, e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded-lg border-0 focus:outline-none focus:ring-1 focus:ring-[#374151]/20 cursor-pointer ${st.cls}`}>
                        {Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a href={`/api/factures-honoraires/${f.id}/pdf`} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-md hover:bg-border text-muted-foreground hover:text-coplio-text transition-colors inline-flex" title="Télécharger le PDF">
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        {f.statut === 'brouillon' && (
                          <ConfirmButton
                            label={<Trash2 className="w-3.5 h-3.5" />}
                            message="Supprimer ?"
                            confirmLabel="Supprimer"
                            className="p-1.5 text-muted-foreground hover:text-coplio-red transition-colors inline-flex"
                            onConfirm={() => handleDelete(f.id)}
                          />
                        )}
                      </div>
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
