'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Calculator, ChevronDown, ChevronUp } from 'lucide-react'

const inputClass = `w-full px-3 py-2.5 text-sm bg-white border border-border rounded-lg
  focus:outline-none focus:ring-2 focus:ring-[#374151]/20 focus:border-transparent
  placeholder:text-gray-400 transition-shadow`

type Lot = {
  id: string
  numero: string
  etage?: string
  type: string
  tantiemes: number
  montant?: number // calculated or manual
}

export default function NewAppelChargesPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step 1: copropriété
  const [coproprietes, setCoproprietes] = useState<{ id: string; nom: string }[]>([])
  const [coproprieteId, setCoproprieteId] = useState('')
  const [copropriete, setCopropriete] = useState<{ id: string; nom: string } | null>(null)

  // Step 2: lots
  const [lots, setLots] = useState<Lot[]>([])
  const [loadingLots, setLoadingLots] = useState(false)

  // Form fields
  const [libelle, setLibelle] = useState('')
  const [dateAppel, setDateAppel] = useState(new Date().toISOString().split('T')[0])
  const [dateEcheance, setDateEcheance] = useState('')
  const [montantTotal, setMontantTotal] = useState('')
  const [modeRepartition, setModeRepartition] = useState<'tantiemes' | 'egal' | 'manuel'>('tantiemes')
  const [lotsSelectionnes, setLotsSelectionnes] = useState<Record<string, boolean>>({})
  const [montantsManuel, setMontantsManuel] = useState<Record<string, string>>({})
  const [showDetails, setShowDetails] = useState(false)

  // Load copropriétés
  useEffect(() => {
    fetch('/api/coproprietes')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setCoproprietes(data)
        else if (Array.isArray(data?.data)) setCoproprietes(data.data)
      })
  }, [])

  // Load lots when copropriété changes
  useEffect(() => {
    if (!coproprieteId) { setLots([]); return }
    setLoadingLots(true)
    fetch(`/api/lots?copropriete_id=${coproprieteId}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLots(data as Lot[])
          const sel: Record<string, boolean> = {}
          data.forEach((l: Lot) => { sel[l.id] = true })
          setLotsSelectionnes(sel)
        }
        setLoadingLots(false)
      })
    const coprop = coproprietes.find((c) => c.id === coproprieteId) ?? null
    setCopropriete(coprop)
  }, [coproprieteId, coproprietes])

  // Calculer les montants selon le mode
  const lotsActifs = lots.filter((l) => lotsSelectionnes[l.id])
  const totalTantiemes = lotsActifs.reduce((s, l) => s + l.tantiemes, 0)
  const mt = parseFloat(montantTotal) || 0

  function getMontant(lot: Lot): number {
    if (modeRepartition === 'manuel') {
      return parseFloat(montantsManuel[lot.id] ?? '0') || 0
    }
    if (modeRepartition === 'egal') {
      return lotsActifs.length > 0 ? mt / lotsActifs.length : 0
    }
    // tantiemes
    return totalTantiemes > 0 ? (lot.tantiemes / totalTantiemes) * mt : 0
  }

  const totalCalcule = lotsActifs.reduce((s, l) => s + getMontant(l), 0)

  // Set default echeance = date_appel + 30 jours
  useEffect(() => {
    if (dateAppel) {
      const d = new Date(dateAppel)
      d.setDate(d.getDate() + 30)
      setDateEcheance(d.toISOString().split('T')[0])
    }
  }, [dateAppel])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError('')

    if (!coproprieteId) { setServerError('Sélectionnez une copropriété'); return }
    if (!libelle.trim()) { setServerError('Le libellé est requis'); return }
    if (!dateEcheance) { setServerError("La date d'échéance est requise"); return }
    if (lotsActifs.length === 0) { setServerError('Sélectionnez au moins un lot'); return }

    const appels = lotsActifs.map((lot) => ({
      copropriete_id: coproprieteId,
      lot_id: lot.id,
      libelle: libelle.trim(),
      montant: Math.round(getMontant(lot) * 100) / 100,
      date_appel: dateAppel,
      date_echeance: dateEcheance,
    }))

    if (appels.some((a) => a.montant <= 0)) {
      setServerError('Tous les montants doivent être supérieurs à 0')
      return
    }

    setIsSubmitting(true)
    const res = await fetch('/api/appels-charges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appels }),
    })
    const data = await res.json()
    setIsSubmitting(false)

    if (!res.ok) { setServerError(data.error || 'Erreur'); return }
    router.push('/appels-charges')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/appels-charges" className="text-muted-foreground hover:text-coplio-text transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Nouvel appel de charges</h1>
          <p className="text-muted-foreground text-sm">Créer un appel pour tous les lots d&apos;une copropriété</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {serverError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{serverError}</div>
        )}

        {/* Copropriété */}
        <div className="coplio-card space-y-4">
          <h2 className="font-semibold text-coplio-text">1. Copropriété</h2>
          <select
            value={coproprieteId}
            onChange={(e) => setCoproprieteId(e.target.value)}
            className={inputClass}
            required
          >
            <option value="">Sélectionner une copropriété</option>
            {coproprietes.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
        </div>

        {/* Infos appel */}
        <div className="coplio-card space-y-4">
          <h2 className="font-semibold text-coplio-text">2. Informations</h2>

          <div>
            <label className="block text-sm font-medium text-coplio-text mb-1.5">Libellé *</label>
            <input
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              className={inputClass}
              placeholder="Charges Q1 2026, Provision sur charges..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">Date d&apos;appel</label>
              <input
                type="date"
                value={dateAppel}
                onChange={(e) => setDateAppel(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">Date d&apos;échéance *</label>
              <input
                type="date"
                value={dateEcheance}
                onChange={(e) => setDateEcheance(e.target.value)}
                className={inputClass}
                required
              />
            </div>
          </div>
        </div>

        {/* Montant & répartition */}
        {coproprieteId && (
          <div className="coplio-card space-y-4">
            <h2 className="font-semibold text-coplio-text">3. Montant et répartition</h2>

            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">Montant total à appeler (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={montantTotal}
                onChange={(e) => setMontantTotal(e.target.value)}
                className={inputClass}
                placeholder="5000.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">Mode de répartition</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'tantiemes', label: 'Par tantièmes', desc: 'Proportionnel' },
                  { value: 'egal', label: 'Parts égales', desc: 'Même montant' },
                  { value: 'manuel', label: 'Manuel', desc: 'Lot par lot' },
                ].map(({ value, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setModeRepartition(value as typeof modeRepartition)}
                    className={`p-3 rounded-xl border-2 text-left transition-colors ${
                      modeRepartition === value
                        ? 'border-[#374151] bg-slate-100'
                        : 'border-border hover:border-[#374151]/30'
                    }`}
                  >
                    <p className={`text-sm font-medium ${modeRepartition === value ? 'text-[#374151]' : 'text-coplio-text'}`}>
                      {label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Lots */}
        {coproprieteId && (
          <div className="coplio-card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-coplio-text">
                4. Lots ({lotsActifs.length}/{lots.length} sélectionnés)
              </h2>
              <div className="flex items-center gap-3">
                {mt > 0 && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calculator className="w-3.5 h-3.5" />
                    Total : <span className="font-semibold text-coplio-text ml-1">
                      {totalCalcule.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs text-[#374151] flex items-center gap-1"
                >
                  {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {showDetails ? 'Réduire' : 'Détails'}
                </button>
              </div>
            </div>

            {loadingLots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-[#374151]" />
              </div>
            ) : lots.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun lot dans cette copropriété.{' '}
                <Link href={`/coproprietes/${coproprieteId}/lots/new`} className="text-[#374151] hover:underline">
                  Ajouter un lot
                </Link>
              </p>
            ) : (
              <>
                <div className="flex gap-2 text-xs">
                  <button type="button" onClick={() => {
                    const sel: Record<string, boolean> = {}
                    lots.forEach((l) => { sel[l.id] = true })
                    setLotsSelectionnes(sel)
                  }} className="text-[#374151] hover:underline">Tout sélectionner</button>
                  <span className="text-border">·</span>
                  <button type="button" onClick={() => setLotsSelectionnes({})} className="text-muted-foreground hover:text-coplio-text">Tout désélectionner</button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {lots.map((lot) => {
                    const montantLot = lotsSelectionnes[lot.id] ? getMontant(lot) : 0
                    return (
                      <label
                        key={lot.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          lotsSelectionnes[lot.id]
                            ? 'border-[#374151]/40 bg-slate-100/30'
                            : 'border-border bg-white hover:bg-coplio-bg'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!lotsSelectionnes[lot.id]}
                          onChange={(e) => setLotsSelectionnes(prev => ({
                            ...prev,
                            [lot.id]: e.target.checked,
                          }))}
                          className="rounded border-border text-[#374151] focus:ring-[#374151]/20"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-coplio-text">
                            Lot {lot.numero}
                            {lot.etage && <span className="font-normal text-muted-foreground"> · {lot.etage}</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">{lot.tantiemes} tantièmes</p>
                        </div>

                        {modeRepartition === 'manuel' && lotsSelectionnes[lot.id] ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={montantsManuel[lot.id] ?? ''}
                            onChange={(e) => setMontantsManuel(prev => ({
                              ...prev,
                              [lot.id]: e.target.value,
                            }))}
                            onClick={(e) => e.preventDefault()}
                            className="w-24 px-2 py-1 text-sm border border-border rounded-lg text-right focus:outline-none focus:ring-1 focus:ring-[#374151]/20"
                            placeholder="0.00"
                          />
                        ) : (
                          lotsSelectionnes[lot.id] && mt > 0 && (
                            <span className="text-sm font-semibold text-coplio-text flex-shrink-0">
                              {montantLot.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                            </span>
                          )
                        )}
                      </label>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Link
            href="/appels-charges"
            className="flex-1 text-center bg-coplio-bg text-coplio-text font-medium py-2.5 px-4 rounded-lg hover:bg-border transition-colors text-sm"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !coproprieteId || lotsActifs.length === 0}
            className="flex-1 bg-[#374151] text-white font-medium py-2.5 px-4 rounded-lg hover:bg-[#374151]/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Créer {lotsActifs.length > 0 ? `${lotsActifs.length} appel${lotsActifs.length > 1 ? 's' : ''}` : 'les appels'}
          </button>
        </div>
      </form>
    </div>
  )
}
