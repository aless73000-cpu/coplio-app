'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Wand2, CheckCircle2, Loader2,
  Pencil, RotateCcw, AlertCircle,
} from 'lucide-react'

const LOT_TYPES = ['appartement', 'maison', 'local_commercial', 'parking', 'cave', 'autre'] as const
type LotType = typeof LOT_TYPES[number]

const LOT_TYPE_LABELS: Record<LotType, string> = {
  appartement: 'Appartement',
  maison: 'Maison',
  local_commercial: 'Local commercial',
  parking: 'Parking',
  cave: 'Cave',
  autre: 'Autre',
}

interface LotRow {
  numero: string
  type: LotType
  etage: string
  surface: string
  tantiemes: string
}

function floorLabel(index: number): string {
  if (index === 0) return 'RDC'
  if (index === 1) return '1er'
  return `${index}ème`
}

function floorLetter(index: number): string {
  return String.fromCharCode(65 + index) // A, B, C, ...
}

function generateLots(nbNiveaux: number, nbLotsParEtage: number, typeDef: LotType, tantiemesDef: number): LotRow[] {
  const lots: LotRow[] = []
  for (let floor = 0; floor < nbNiveaux; floor++) {
    const letter = floorLetter(floor)
    const etage = floorLabel(floor)
    for (let n = 1; n <= nbLotsParEtage; n++) {
      lots.push({
        numero: `${letter}${String(n).padStart(2, '0')}`,
        type: typeDef,
        etage,
        surface: '',
        tantiemes: String(tantiemesDef),
      })
    }
  }
  return lots
}

export default function GenererLotsPage() {
  const { id: coproprieteId } = useParams<{ id: string }>()

  const [nbNiveaux, setNbNiveaux] = useState(3)
  const [nbLotsParEtage, setNbLotsParEtage] = useState(4)
  const [typeDef, setTypeDef] = useState<LotType>('appartement')
  const [tantiemesDef, setTantiemesDef] = useState(100)

  const [preview, setPreview] = useState<LotRow[] | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [result, setResult] = useState<{ lots_created: number; errors: string[] } | null>(null)

  const handleGenerate = useCallback(() => {
    if (nbNiveaux < 1 || nbLotsParEtage < 1) return
    setPreview(generateLots(nbNiveaux, nbLotsParEtage, typeDef, tantiemesDef))
    setEditingIndex(null)
    setServerError('')
  }, [nbNiveaux, nbLotsParEtage, typeDef, tantiemesDef])

  function updateRow(index: number, field: keyof LotRow, value: string) {
    setPreview((prev) => {
      if (!prev) return prev
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  async function handleSubmit() {
    if (!preview || preview.length === 0) return
    setLoading(true)
    setServerError('')

    const lots = preview.map((l) => ({
      numero: l.numero.trim(),
      type: l.type,
      etage: l.etage.trim() || undefined,
      surface: l.surface ? parseFloat(l.surface) : undefined,
      tantiemes: parseInt(l.tantiemes, 10),
    }))

    const invalid = lots.filter((l) => !l.numero || !l.tantiemes || l.tantiemes < 1)
    if (invalid.length > 0) {
      setServerError(`${invalid.length} lot(s) invalide(s) : numéro ou tantièmes manquants.`)
      setLoading(false)
      return
    }

    const res = await fetch('/api/lots/generer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ copropriete_id: coproprieteId, lots }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setServerError(data.error ?? 'Erreur serveur')
    } else {
      setResult(data)
    }
  }

  const inputCls = `px-3 py-2 text-sm border border-border rounded-lg bg-white
    focus:outline-none focus:ring-2 focus:ring-[#374151]/20 focus:border-transparent`

  if (result) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
        <div className="coplio-card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-[#374151]" />
            </div>
            <div>
              <p className="font-semibold text-coplio-text">Lots créés avec succès</p>
              <p className="text-sm text-muted-foreground">Ajoutés à la copropriété</p>
            </div>
          </div>
          <div className="bg-slate-100 rounded-xl p-6 text-center">
            <p className="text-4xl font-bold text-[#374151]">{result.lots_created}</p>
            <p className="text-sm text-[#374151]/80 mt-1">Lot{result.lots_created > 1 ? 's' : ''} créé{result.lots_created > 1 ? 's' : ''}</p>
          </div>
          {result.errors.length > 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-700 mb-2">Avertissements</p>
              <ul className="space-y-1">
                {result.errors.map((e, i) => (
                  <li key={i} className="text-xs text-amber-600">· {e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setResult(null); setPreview(null) }}
            className="flex-1 bg-coplio-bg text-coplio-text font-medium py-2.5 px-4 rounded-lg hover:bg-border transition-colors text-sm"
          >
            Nouvelle génération
          </button>
          <Link
            href={`/coproprietes/${coproprieteId}/lots`}
            className="flex-1 text-center bg-[#374151] text-white font-medium py-2.5 px-4 rounded-lg hover:bg-[#374151]/90 transition-colors text-sm"
          >
            Voir les lots
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/coproprietes/${coproprieteId}/lots`}
          className="text-muted-foreground hover:text-coplio-text transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Génération automatique des lots</h1>
          <p className="text-muted-foreground text-sm">Créez des dizaines de lots en quelques secondes</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Config card */}
        <div className="coplio-card">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
              <Wand2 className="w-4 h-4 text-[#374151]" />
            </div>
            <h2 className="font-semibold text-coplio-text">Configuration</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">
                Nombre de niveaux (RDC inclus) *
              </label>
              <input
                type="number"
                min={1}
                max={26}
                value={nbNiveaux}
                onChange={(e) => setNbNiveaux(Math.max(1, Math.min(26, parseInt(e.target.value) || 1)))}
                className={inputCls + ' w-full'}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {nbNiveaux} niveau{nbNiveaux > 1 ? 'x' : ''} → {
                  Array.from({ length: Math.min(nbNiveaux, 3) }, (_, i) => floorLetter(i)).join(', ')
                }{nbNiveaux > 3 ? `… ${floorLetter(nbNiveaux - 1)}` : ''}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">
                Lots par niveau *
              </label>
              <input
                type="number"
                min={1}
                max={99}
                value={nbLotsParEtage}
                onChange={(e) => setNbLotsParEtage(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
                className={inputCls + ' w-full'}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {nbNiveaux * nbLotsParEtage} lots au total
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">Type par défaut</label>
              <select
                value={typeDef}
                onChange={(e) => setTypeDef(e.target.value as LotType)}
                className={inputCls + ' w-full'}
              >
                {LOT_TYPES.map((t) => (
                  <option key={t} value={t}>{LOT_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">
                Tantièmes par défaut *
              </label>
              <input
                type="number"
                min={1}
                value={tantiemesDef}
                onChange={(e) => setTantiemesDef(Math.max(1, parseInt(e.target.value) || 1))}
                className={inputCls + ' w-full'}
              />
              <p className="text-xs text-muted-foreground mt-1">Modifiable par lot ensuite</p>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            className="mt-5 w-full flex items-center justify-center gap-2 bg-[#374151] text-white font-medium py-2.5 rounded-lg hover:bg-[#374151]/90 transition-colors text-sm"
          >
            <Wand2 className="w-4 h-4" />
            Générer la prévisualisation ({nbNiveaux * nbLotsParEtage} lots)
          </button>
        </div>

        {/* Preview table */}
        {preview && (
          <div className="coplio-card animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-coplio-text">Prévisualisation</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cliquez sur <Pencil className="w-3 h-3 inline" /> pour modifier un lot avant création
                </p>
              </div>
              <button
                onClick={() => { setPreview(null); setEditingIndex(null) }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-coplio-text transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Réinitialiser
              </button>
            </div>

            {serverError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {serverError}
              </div>
            )}

            <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-coplio-bg z-10">
                  <tr className="border-b border-border">
                    {['Numéro', 'Type', 'Étage', 'Surface (m²)', 'Tantièmes', ''].map((h) => (
                      <th key={h} className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((lot, i) => (
                    <tr key={i} className={`border-b border-border transition-colors ${editingIndex === i ? 'bg-slate-100/30' : 'hover:bg-coplio-bg'}`}>
                      {editingIndex === i ? (
                        <>
                          <td className="py-1.5 px-3">
                            <input
                              value={lot.numero}
                              onChange={(e) => updateRow(i, 'numero', e.target.value)}
                              className="w-20 px-2 py-1 text-xs border border-[#374151]/50 rounded focus:outline-none focus:ring-1 focus:ring-[#374151]/20"
                            />
                          </td>
                          <td className="py-1.5 px-3">
                            <select
                              value={lot.type}
                              onChange={(e) => updateRow(i, 'type', e.target.value)}
                              className="text-xs border border-[#374151]/50 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#374151]/20"
                            >
                              {LOT_TYPES.map((t) => (
                                <option key={t} value={t}>{LOT_TYPE_LABELS[t]}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-1.5 px-3">
                            <input
                              value={lot.etage}
                              onChange={(e) => updateRow(i, 'etage', e.target.value)}
                              className="w-20 px-2 py-1 text-xs border border-[#374151]/50 rounded focus:outline-none focus:ring-1 focus:ring-[#374151]/20"
                            />
                          </td>
                          <td className="py-1.5 px-3">
                            <input
                              type="number"
                              value={lot.surface}
                              onChange={(e) => updateRow(i, 'surface', e.target.value)}
                              placeholder="—"
                              className="w-20 px-2 py-1 text-xs border border-[#374151]/50 rounded focus:outline-none focus:ring-1 focus:ring-[#374151]/20"
                            />
                          </td>
                          <td className="py-1.5 px-3">
                            <input
                              type="number"
                              value={lot.tantiemes}
                              onChange={(e) => updateRow(i, 'tantiemes', e.target.value)}
                              className="w-20 px-2 py-1 text-xs border border-[#374151]/50 rounded focus:outline-none focus:ring-1 focus:ring-[#374151]/20"
                            />
                          </td>
                          <td className="py-1.5 px-3">
                            <button
                              onClick={() => setEditingIndex(null)}
                              className="text-xs text-[#374151] font-medium hover:underline"
                            >
                              OK
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-2 px-3 font-medium text-coplio-text">{lot.numero}</td>
                          <td className="py-2 px-3 text-muted-foreground">{LOT_TYPE_LABELS[lot.type]}</td>
                          <td className="py-2 px-3 text-muted-foreground">{lot.etage || '—'}</td>
                          <td className="py-2 px-3 text-muted-foreground">{lot.surface ? `${lot.surface} m²` : '—'}</td>
                          <td className="py-2 px-3">{lot.tantiemes}</td>
                          <td className="py-2 px-3">
                            <button
                              onClick={() => setEditingIndex(i)}
                              className="p-1 rounded hover:bg-border transition-colors text-muted-foreground hover:text-coplio-text"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 mt-5">
              <Link
                href={`/coproprietes/${coproprieteId}/lots`}
                className="flex-1 text-center bg-coplio-bg text-coplio-text font-medium py-2.5 px-4 rounded-lg hover:bg-border transition-colors text-sm"
              >
                Annuler
              </Link>
              <button
                onClick={handleSubmit}
                disabled={loading || preview.length === 0}
                className="flex-1 bg-[#374151] text-white font-medium py-2.5 px-4 rounded-lg hover:bg-[#374151]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Création en cours...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" /> Créer {preview.length} lots</>
                )}
              </button>
            </div>
          </div>
        )}

        {!preview && (
          <div className="flex gap-3">
            <Link
              href={`/coproprietes/${coproprieteId}/lots`}
              className="flex-1 text-center bg-coplio-bg text-coplio-text font-medium py-2.5 px-4 rounded-lg hover:bg-border transition-colors text-sm"
            >
              Annuler
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
