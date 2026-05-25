'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Loader2, PiggyBank, TrendingUp, ArrowDownCircle, ArrowUpCircle, Save, CheckCircle2 } from 'lucide-react'

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

interface Mouvement {
  id: string
  type: 'cotisation' | 'retrait' | 'interet' | 'autre'
  montant: number
  libelle?: string
  date_mouvement: string
}

interface FondsTravaux {
  id: string
  annee: number
  cotisation_annuelle: number
  solde_actuel: number
  objectif_5ans: number
  compte_bancaire?: string
  notes?: string
  mouvements: Mouvement[]
}

const ROLE_LABELS: Record<string, string> = {
  cotisation: 'Cotisation',
  retrait: 'Retrait',
  interet: 'Intérêts',
  autre: 'Autre',
}

export default function FondsTravauxPage() {
  const { id: coproprieteId } = useParams<{ id: string }>()
  const currentYear = new Date().getFullYear()
  const [fonds, setFonds] = useState<FondsTravaux[]>([])
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [current, setCurrent] = useState<FondsTravaux | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showMvt, setShowMvt] = useState(false)
  const [mvtForm, setMvtForm] = useState({ type: 'cotisation', montant: '', libelle: '', date_mouvement: new Date().toISOString().split('T')[0] })
  const [savingMvt, setSavingMvt] = useState(false)
  const [editForm, setEditForm] = useState({ cotisation_annuelle: '', objectif_5ans: '', compte_bancaire: '', notes: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/fonds-travaux?copropriete_id=${coproprieteId}`)
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      setFonds(list)
      const ft = list.find((f: FondsTravaux) => f.annee === selectedYear) ?? null
      setCurrent(ft)
      if (ft) setEditForm({ cotisation_annuelle: String(ft.cotisation_annuelle), objectif_5ans: String(ft.objectif_5ans), compte_bancaire: ft.compte_bancaire ?? '', notes: ft.notes ?? '' })
    } finally {
      setLoading(false)
    }
  }, [coproprieteId, selectedYear])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const ft = fonds.find(f => f.annee === selectedYear) ?? null
    setCurrent(ft)
    if (ft) setEditForm({ cotisation_annuelle: String(ft.cotisation_annuelle), objectif_5ans: String(ft.objectif_5ans), compte_bancaire: ft.compte_bancaire ?? '', notes: ft.notes ?? '' })
  }, [fonds, selectedYear])

  async function handleCreate() {
    setCreating(true)
    const res = await fetch('/api/fonds-travaux', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ copropriete_id: coproprieteId, annee: selectedYear }),
    })
    const data = await res.json()
    setCreating(false)
    if (res.ok) {
      setFonds(prev => [{ ...data, mouvements: [] }, ...prev])
      setCurrent({ ...data, mouvements: [] })
    }
  }

  async function handleSave() {
    if (!current) return
    setSaving(true)
    await fetch(`/api/fonds-travaux/${current.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cotisation_annuelle: Number(editForm.cotisation_annuelle) || 0,
        solde_actuel: current.solde_actuel,
        objectif_5ans: Number(editForm.objectif_5ans) || 0,
        compte_bancaire: editForm.compte_bancaire,
        notes: editForm.notes,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    await load()
  }

  async function handleAddMvt(e: React.FormEvent) {
    e.preventDefault()
    if (!current || !mvtForm.montant) return
    setSavingMvt(true)
    const res = await fetch(`/api/fonds-travaux/${current.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...mvtForm, montant: Number(mvtForm.montant) }),
    })
    setSavingMvt(false)
    if (res.ok) {
      setShowMvt(false)
      setMvtForm({ type: 'cotisation', montant: '', libelle: '', date_mouvement: new Date().toISOString().split('T')[0] })
      await load()
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i)
  const progressPct = current && current.objectif_5ans > 0 ? Math.min(100, Math.round((current.solde_actuel / current.objectif_5ans) * 100)) : 0

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href={`/coproprietes/${coproprieteId}`} className="text-muted-foreground hover:text-coplio-text transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-coplio-text flex items-center gap-2">
            <PiggyBank className="w-6 h-6 text-[#111827]" />Fonds de travaux ALUR
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Suivi du fonds de réserve obligatoire (art. 18 loi ALUR)</p>
        </div>
        <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]/20">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Info légale */}
      <div className="coplio-card bg-blue-50 border-blue-200">
        <p className="text-sm font-semibold text-blue-800">Obligation légale</p>
        <p className="text-xs text-blue-600 mt-1">La loi ALUR impose une cotisation annuelle d&apos;au moins 5% du budget prévisionnel pour constituer un fonds de travaux. Ce fonds est obligatoire depuis le 1er janvier 2017 pour les copropriétés de plus de 10 lots.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : !current ? (
        <div className="coplio-card text-center py-12">
          <PiggyBank className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-semibold text-coplio-text mb-2">Aucun fonds de travaux pour {selectedYear}</h2>
          <p className="text-sm text-muted-foreground mb-6">Créez le suivi du fonds de travaux pour cette année</p>
          <button onClick={handleCreate} disabled={creating}
            className="flex items-center gap-2 mx-auto bg-[#111827] text-white font-medium px-5 py-2.5 rounded-lg hover:bg-[#111827]/90 transition-colors disabled:opacity-60">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Créer le fonds {selectedYear}
          </button>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <div className="coplio-card text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Solde actuel</p>
              <p className="text-xl font-bold text-[#111827]">{fmt(current.solde_actuel)}</p>
            </div>
            <div className="coplio-card text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Cotisation annuelle</p>
              <p className="text-xl font-bold text-coplio-text">{fmt(current.cotisation_annuelle)}</p>
            </div>
            <div className="coplio-card text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Objectif 5 ans</p>
              <p className="text-xl font-bold text-coplio-text">{fmt(current.objectif_5ans)}</p>
            </div>
          </div>

          {/* Progression */}
          {current.objectif_5ans > 0 && (
            <div className="coplio-card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-coplio-text">Progression vers l&apos;objectif</p>
                <span className="text-sm font-bold text-[#111827]">{progressPct}%</span>
              </div>
              <div className="h-3 bg-coplio-bg rounded-full overflow-hidden">
                <div className="h-full bg-[#111827] rounded-full transition-all" style={{ width: `${progressPct}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{fmt(current.solde_actuel)} sur {fmt(current.objectif_5ans)}</p>
            </div>
          )}

          {/* Paramètres */}
          <div className="coplio-card">
            <h2 className="font-semibold text-coplio-text mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#111827]" />Paramètres
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Cotisation annuelle (€)</label>
                <input type="number" value={editForm.cotisation_annuelle} onChange={e => setEditForm(f => ({ ...f, cotisation_annuelle: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Objectif sur 5 ans (€)</label>
                <input type="number" value={editForm.objectif_5ans} onChange={e => setEditForm(f => ({ ...f, objectif_5ans: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Compte bancaire dédié</label>
                <input value={editForm.compte_bancaire} onChange={e => setEditForm(f => ({ ...f, compte_bancaire: e.target.value }))}
                  placeholder="IBAN ou numéro de compte"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Notes</label>
                <input value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20" />
              </div>
            </div>
            <button onClick={handleSave} disabled={saving}
              className="mt-4 flex items-center gap-2 bg-[#111827] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#111827]/90 transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {saved ? 'Enregistré' : 'Enregistrer'}
            </button>
          </div>

          {/* Mouvements */}
          <div className="coplio-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-coplio-text">Mouvements de fonds</h2>
              <button onClick={() => setShowMvt(v => !v)}
                className="flex items-center gap-1.5 text-sm text-[#111827] font-medium hover:text-[#111827]/80">
                <Plus className="w-4 h-4" />Ajouter
              </button>
            </div>

            {showMvt && (
              <form onSubmit={handleAddMvt} className="mb-4 p-4 bg-coplio-bg rounded-xl">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-coplio-text mb-1">Type</label>
                    <select value={mvtForm.type} onChange={e => setMvtForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#111827]/20">
                      <option value="cotisation">Cotisation</option>
                      <option value="retrait">Retrait (travaux)</option>
                      <option value="interet">Intérêts</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-coplio-text mb-1">Montant (€)</label>
                    <input type="number" value={mvtForm.montant} onChange={e => setMvtForm(f => ({ ...f, montant: e.target.value }))} required
                      className="w-full px-2.5 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#111827]/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-coplio-text mb-1">Libellé</label>
                    <input value={mvtForm.libelle} onChange={e => setMvtForm(f => ({ ...f, libelle: e.target.value }))} placeholder="Optionnel"
                      className="w-full px-2.5 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#111827]/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-coplio-text mb-1">Date</label>
                    <input type="date" value={mvtForm.date_mouvement} onChange={e => setMvtForm(f => ({ ...f, date_mouvement: e.target.value }))}
                      className="w-full px-2.5 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#111827]/20" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={savingMvt}
                    className="flex items-center gap-1.5 bg-[#111827] text-white text-sm px-3 py-1.5 rounded-lg hover:bg-[#111827]/90 disabled:opacity-60">
                    {savingMvt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}Enregistrer
                  </button>
                  <button type="button" onClick={() => setShowMvt(false)} className="text-sm text-muted-foreground px-3 py-1.5 border border-border rounded-lg">Annuler</button>
                </div>
              </form>
            )}

            {(current.mouvements ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun mouvement enregistré</p>
            ) : (
              <div className="space-y-2">
                {[...current.mouvements].sort((a, b) => new Date(b.date_mouvement).getTime() - new Date(a.date_mouvement).getTime()).map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-coplio-bg transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${m.type === 'retrait' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-[#111827]'}`}>
                      {m.type === 'retrait' ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-coplio-text">{m.libelle || ROLE_LABELS[m.type]}</p>
                      <p className="text-xs text-muted-foreground">{new Date(m.date_mouvement).toLocaleDateString('fr-FR')} · {ROLE_LABELS[m.type]}</p>
                    </div>
                    <p className={`text-sm font-bold flex-shrink-0 ${m.type === 'retrait' ? 'text-coplio-red' : 'text-[#111827]'}`}>
                      {m.type === 'retrait' ? '-' : '+'}{fmt(Math.abs(m.montant))}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
