'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Save, CheckCircle2, Loader2, TrendingUp, PiggyBank, Download } from 'lucide-react'
import type { Budget, BudgetLigne, BudgetCategorie } from '@/types'
import { BUDGET_CATEGORIE_LABELS } from '@/types'

function formatEuro(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

const CATEGORIES: BudgetCategorie[] = [
  'charges_generales', 'entretien', 'travaux', 'assurances', 'honoraires', 'reserves', 'autre'
]

type LigneForm = Omit<BudgetLigne, 'id' | 'budget_id' | 'created_at'> & { tempId: string }

export default function BudgetPage() {
  const { id: coproprieteId } = useParams<{ id: string }>()
  const router = useRouter()
  const currentYear = new Date().getFullYear()

  const [budgets, setBudgets] = useState<Budget[]>([])
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null)
  const [lignes, setLignes] = useState<LigneForm[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [creating, setCreating] = useState(false)

  const loadBudgets = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/budgets?copropriete_id=${coproprieteId}`)
    const data = await res.json()
    setBudgets(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [coproprieteId])

  useEffect(() => { loadBudgets() }, [loadBudgets])

  useEffect(() => {
    const budget = budgets.find((b) => b.annee === selectedYear) ?? null
    setCurrentBudget(budget)
    if (budget?.lignes) {
      setLignes(budget.lignes.map((l) => ({ ...l, tempId: l.id })))
    } else {
      setLignes([])
    }
  }, [budgets, selectedYear])

  async function createBudget() {
    setCreating(true)
    const res = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ copropriete_id: coproprieteId, annee: selectedYear }),
    })
    const data = await res.json()
    setCreating(false)
    if (res.ok) {
      setBudgets((prev) => [data, ...prev])
      setCurrentBudget(data)
      setLignes([])
    }
  }

  function addLigne() {
    setLignes((prev) => [
      ...prev,
      {
        tempId: Date.now().toString(),
        poste: '',
        categorie: 'charges_generales',
        montant_previsionnel: 0,
        montant_reel: undefined,
        commentaire: '',
        ordre: prev.length,
      },
    ])
  }

  function updateLigne(tempId: string, field: keyof LigneForm, value: string | number | undefined) {
    setLignes((prev) =>
      prev.map((l) => (l.tempId === tempId ? { ...l, [field]: value } : l))
    )
  }

  function removeLigne(tempId: string) {
    setLignes((prev) => prev.filter((l) => l.tempId !== tempId))
  }

  async function save() {
    if (!currentBudget) return
    setSaving(true)
    await fetch(`/api/budgets/${currentBudget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lignes: lignes.map((l, i) => ({
          poste: l.poste,
          categorie: l.categorie,
          montant_previsionnel: l.montant_previsionnel,
          montant_reel: l.montant_reel,
          commentaire: l.commentaire,
          ordre: i,
        })),
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const totalPrev = lignes.reduce((s, l) => s + (l.montant_previsionnel || 0), 0)
  const totalReel = lignes.reduce((s, l) => s + (l.montant_reel || 0), 0)
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i)

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/coproprietes/${coproprieteId}`}
          className="text-muted-foreground hover:text-coplio-text transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-coplio-text">Budget prévisionnel</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Planifiez les charges annuelles</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#374151]/20"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <a
            href={`/api/exports/fec?copropriete_id=${coproprieteId}&annee=${selectedYear}`}
            download={`FEC_${selectedYear}.txt`}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-lg bg-white hover:bg-coplio-bg transition-colors text-muted-foreground hover:text-coplio-text"
            title="Exporter le Fichier des Écritures Comptables (FEC) — norme DGFiP"
          >
            <Download className="w-4 h-4" />
            Export FEC
          </a>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : !currentBudget ? (
        /* No budget for this year */
        <div className="coplio-card text-center py-12">
          <PiggyBank className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-semibold text-coplio-text mb-2">Aucun budget pour {selectedYear}</h2>
          <p className="text-sm text-muted-foreground mb-6">Créez le budget prévisionnel de cette copropriété</p>
          <button
            onClick={createBudget}
            disabled={creating}
            className="flex items-center gap-2 mx-auto bg-[#374151] text-white font-medium px-5 py-2.5 rounded-lg hover:bg-[#374151]/90 transition-colors disabled:opacity-60"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Créer le budget {selectedYear}
          </button>
        </div>
      ) : (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <div className="coplio-card text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total prévisionnel</p>
              <p className="text-xl font-bold text-coplio-text">{formatEuro(totalPrev)}</p>
            </div>
            <div className="coplio-card text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Réel à date</p>
              <p className="text-xl font-bold text-coplio-text">{formatEuro(totalReel)}</p>
            </div>
            <div className="coplio-card text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Écart</p>
              <p className={`text-xl font-bold ${totalReel > totalPrev ? 'text-coplio-red' : 'text-[#374151]'}`}>
                {formatEuro(totalReel - totalPrev)}
              </p>
            </div>
          </div>

          {/* Lignes */}
          <div className="coplio-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-coplio-text flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#374151]" />
                Postes budgétaires ({lignes.length})
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex items-center gap-1.5 bg-[#374151] text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-[#374151]/90 transition-colors disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  {saved ? 'Enregistré' : 'Enregistrer'}
                </button>
              </div>
            </div>

            {lignes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucun poste budgétaire. Ajoutez-en ci-dessous.
              </p>
            ) : (
              <div className="space-y-2 mb-4">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 px-2 pb-1 border-b border-border">
                  <div className="col-span-4 text-xs font-medium text-muted-foreground">Poste</div>
                  <div className="col-span-3 text-xs font-medium text-muted-foreground">Catégorie</div>
                  <div className="col-span-2 text-xs font-medium text-muted-foreground text-right">Prévisionnel</div>
                  <div className="col-span-2 text-xs font-medium text-muted-foreground text-right">Réel</div>
                  <div className="col-span-1" />
                </div>

                {lignes.map((ligne) => (
                  <div key={ligne.tempId} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <input
                        value={ligne.poste}
                        onChange={(e) => updateLigne(ligne.tempId, 'poste', e.target.value)}
                        placeholder="Ex: Ascenseur"
                        className="w-full px-2 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#374151]/20"
                      />
                    </div>
                    <div className="col-span-3">
                      <select
                        value={ligne.categorie}
                        onChange={(e) => updateLigne(ligne.tempId, 'categorie', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#374151]/20 bg-white"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{BUDGET_CATEGORIE_LABELS[c]}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={ligne.montant_previsionnel || ''}
                        onChange={(e) => updateLigne(ligne.tempId, 'montant_previsionnel', Number(e.target.value))}
                        placeholder="0"
                        className="w-full px-2 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#374151]/20 text-right"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={ligne.montant_reel ?? ''}
                        onChange={(e) => updateLigne(ligne.tempId, 'montant_reel', e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="—"
                        className="w-full px-2 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#374151]/20 text-right"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => removeLigne(ligne.tempId)}
                        className="p-1 rounded text-muted-foreground hover:text-coplio-red transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Totals row */}
                <div className="grid grid-cols-12 gap-2 pt-2 border-t border-border">
                  <div className="col-span-7 text-sm font-semibold text-coplio-text px-2">Total</div>
                  <div className="col-span-2 text-sm font-semibold text-coplio-text text-right">{formatEuro(totalPrev)}</div>
                  <div className="col-span-2 text-sm font-semibold text-coplio-text text-right">{formatEuro(totalReel)}</div>
                  <div className="col-span-1" />
                </div>
              </div>
            )}

            <button
              onClick={addLigne}
              className="flex items-center gap-2 text-sm text-[#374151] hover:text-[#374151]/80 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Ajouter un poste
            </button>
          </div>
        </>
      )}
    </div>
  )
}
