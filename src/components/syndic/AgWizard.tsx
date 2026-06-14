'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, CalendarDays, MapPin, Users, ListChecks,
  Sparkles, Loader2, Plus, Trash2, CheckCircle2, GripVertical,
  Building2, Clock, ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────────

interface Copropriete { id: string; nom: string; adresse?: string }

interface OdjItem {
  id: string
  titre: string
  type: 'obligatoire' | 'vote' | 'information'
  article_loi?: string
}

const step1Schema = z.object({
  copropriete_id: z.string().uuid('Sélectionnez une copropriété'),
  type:           z.enum(['ordinaire', 'extraordinaire']),
  date_ag:        z.string().min(1, 'Date et heure requises'),
  lieu:           z.string().optional(),
})

type Step1Values = z.infer<typeof step1Schema>

// ── Helpers ────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

const TYPE_CONFIG = {
  obligatoire: { label: 'Obligatoire', cls: 'bg-blue-50 text-blue-700 border-blue-100' },
  vote:        { label: 'Vote',        cls: 'bg-amber-50 text-amber-700 border-amber-100' },
  information: { label: 'Info',        cls: 'bg-slate-50 text-slate-600 border-slate-200' },
}

const inputClass =
  'w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl ' +
  'focus:outline-none focus:ring-2 focus:ring-[#374151]/20 focus:border-[#374151]/40 ' +
  'placeholder:text-slate-400 transition-all'

// ── Step indicators ────────────────────────────────────────────

function StepBar({ current }: { current: number }) {
  const steps = ['Informations', 'Ordre du jour', 'Récapitulatif']
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const n = i + 1
        const done   = n < current
        const active = n === current
        return (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                done   ? 'bg-[#374151] text-white' :
                active ? 'bg-[#374151] text-white ring-4 ring-[#374151]/15' :
                         'bg-slate-100 text-slate-400'
              }`}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : n}
              </div>
              <span className={`text-[10px] font-medium mt-1 whitespace-nowrap ${
                active ? 'text-[#374151]' : 'text-slate-400'
              }`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-2 mb-4 transition-colors ${
                done ? 'bg-[#374151]' : 'bg-slate-200'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Step 1 : Informations ──────────────────────────────────────

function Step1({
  coproprietes,
  defaultValues,
  onNext,
}: {
  coproprietes: Copropriete[]
  defaultValues: Partial<Step1Values>
  onNext: (values: Step1Values) => void
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: { type: 'ordinaire', ...defaultValues },
  })

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      {/* Copropriété */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          Copropriété *
        </label>
        <div className="relative">
          <select {...register('copropriete_id')} className={inputClass + ' pr-8 appearance-none'}>
            <option value="">Sélectionner une copropriété</option>
            {coproprietes.map(c => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        {errors.copropriete_id && <p className="mt-1.5 text-xs text-red-500">{errors.copropriete_id.message}</p>}
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Type d&apos;assemblée *</label>
        <div className="grid grid-cols-2 gap-3">
          {(['ordinaire', 'extraordinaire'] as const).map((type) => (
            <label key={type} className="relative">
              <input type="radio" value={type} {...register('type')} className="peer sr-only" />
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-slate-200 cursor-pointer transition-all peer-checked:border-[#374151] peer-checked:bg-[#374151]/5">
                <CalendarDays className="w-5 h-5 text-slate-500 peer-checked:text-[#374151]" />
                <span className="text-sm font-medium text-slate-700 capitalize">{type}</span>
                <span className="text-[10px] text-slate-400 text-center">
                  {type === 'ordinaire' ? '1 fois / an, budget & comptes' : 'Décisions urgentes'}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          Date et heure *
        </label>
        <input type="datetime-local" {...register('date_ag')} className={inputClass} />
        {errors.date_ag && <p className="mt-1.5 text-xs text-red-500">{errors.date_ag.message}</p>}
        <p className="mt-1 text-[11px] text-slate-400">La convocation doit être envoyée au moins 21 jours avant (art. 9 décret 67)</p>
      </div>

      {/* Lieu */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          Lieu <span className="text-slate-400 font-normal">(optionnel)</span>
        </label>
        <input
          type="text"
          {...register('lieu')}
          placeholder="Ex : Salle polyvalente de la mairie, Résidence…"
          className={inputClass}
        />
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" className="flex items-center gap-2 bg-[#374151] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#374151]/90 transition-colors">
          Suivant
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  )
}

// ── Step 2 : Ordre du jour ─────────────────────────────────────

function Step2({
  step1Values,
  items,
  onItemsChange,
  onBack,
  onNext,
}: {
  step1Values: Step1Values
  items: OdjItem[]
  onItemsChange: (items: OdjItem[]) => void
  onBack: () => void
  onNext: () => void
}) {
  const [loadingAI, setLoadingAI] = useState(false)
  const [newTitle, setNewTitle]   = useState('')
  const [newType, setNewType]     = useState<OdjItem['type']>('vote')

  const fetchAiSuggestions = useCallback(async () => {
    setLoadingAI(true)
    try {
      const res = await fetch('/api/ia/ordre-du-jour', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          copropriete_id: step1Values.copropriete_id,
          type_ag: step1Values.type,
        }),
      })
      if (!res.ok) throw new Error('Erreur IA')
      const data = await res.json()
      const newItems: OdjItem[] = (data.items ?? []).map((item: Omit<OdjItem, 'id'>) => ({
        ...item,
        id: uid(),
      }))
      onItemsChange(newItems)
      toast.success(`${newItems.length} points générés par l'IA`)
    } catch {
      toast.error('Impossible de générer l\'ordre du jour. Ajoutez les points manuellement.')
    } finally {
      setLoadingAI(false)
    }
  }, [step1Values, onItemsChange])

  function addItem() {
    if (!newTitle.trim()) return
    onItemsChange([...items, { id: uid(), titre: newTitle.trim(), type: newType }])
    setNewTitle('')
  }

  function removeItem(id: string) {
    onItemsChange(items.filter(i => i.id !== id))
  }

  function moveItem(id: string, direction: 'up' | 'down') {
    const idx = items.findIndex(i => i.id === id)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === items.length - 1) return
    const next = [...items]
    const swap = direction === 'up' ? idx - 1 : idx + 1
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    onItemsChange(next)
  }

  return (
    <div className="space-y-5">
      {/* IA button */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-dashed border-[#374151]/30 bg-[#374151]/3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#374151]/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#374151]" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">Suggestion par l&apos;IA <span className="text-xs font-normal text-slate-400">(optionnel)</span></p>
            <p className="text-xs text-slate-500">L&apos;IA propose des points ; vous pouvez aussi tout saisir vous-même ci-dessous.</p>
          </div>
        </div>
        <button
          onClick={fetchAiSuggestions}
          disabled={loadingAI}
          className="flex items-center gap-2 text-sm font-semibold bg-[#374151] text-white px-4 py-2 rounded-lg hover:bg-[#374151]/90 transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {loadingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {loadingAI ? 'Génération…' : 'Proposer avec l\'IA'}
        </button>
      </div>

      {/* Items list */}
      {items.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <ListChecks className="w-3.5 h-3.5" />
            Ordre du jour ({items.length} points)
          </p>
          <div className="space-y-1.5">
            {items.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 group">
                <div className="flex flex-col gap-0.5 text-slate-300">
                  <button onClick={() => moveItem(item.id, 'up')} disabled={idx === 0} className="hover:text-slate-500 disabled:opacity-30 transition-colors leading-none">▲</button>
                  <button onClick={() => moveItem(item.id, 'down')} disabled={idx === items.length - 1} className="hover:text-slate-500 disabled:opacity-30 transition-colors leading-none text-[10px]">▼</button>
                </div>
                <GripVertical className="w-4 h-4 text-slate-200 flex-shrink-0" />
                <span className="text-xs font-bold text-slate-400 w-5 text-center flex-shrink-0">{idx + 1}</span>
                <p className="flex-1 text-sm text-slate-800 min-w-0">{item.titre}</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.article_loi && (
                    <span className="text-[10px] text-slate-400 hidden sm:inline">{item.article_loi}</span>
                  )}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${TYPE_CONFIG[item.type].cls}`}>
                    {TYPE_CONFIG[item.type].label}
                  </span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="w-5 h-5 flex items-center justify-center rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add item manually */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ajouter un point</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem()}
            placeholder="Intitulé du point à l'ordre du jour…"
            className={inputClass + ' flex-1'}
          />
          <select
            value={newType}
            onChange={e => setNewType(e.target.value as OdjItem['type'])}
            className={inputClass + ' w-36 appearance-none'}
          >
            <option value="vote">Vote</option>
            <option value="information">Information</option>
            <option value="obligatoire">Obligatoire</option>
          </select>
          <button
            onClick={addItem}
            disabled={!newTitle.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        <button
          onClick={onNext}
          disabled={items.length === 0}
          className="flex items-center gap-2 bg-[#374151] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#374151]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Suivant
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ── Step 3 : Récapitulatif ─────────────────────────────────────

function Step3({
  step1Values,
  coproprietes,
  items,
  onBack,
  onSubmit,
  submitting,
}: {
  step1Values: Step1Values
  coproprietes: Copropriete[]
  items: OdjItem[]
  onBack: () => void
  onSubmit: () => void
  submitting: boolean
}) {
  const copro = coproprietes.find(c => c.id === step1Values.copropriete_id)
  const date  = step1Values.date_ag ? new Date(step1Values.date_ag) : null

  const convocDeadline = date
    ? new Date(date.getTime() - 21 * 86400000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    : null

  return (
    <div className="space-y-5">
      {/* Récap AG */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assemblée générale</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <Building2 className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Copropriété</p>
              <p className="font-medium text-slate-800">{copro?.nom ?? '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CalendarDays className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Date</p>
              <p className="font-medium text-slate-800">
                {date?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} à {date?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Users className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Type</p>
              <p className="font-medium text-slate-800 capitalize">{step1Values.type}</p>
            </div>
          </div>
          {step1Values.lieu && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Lieu</p>
                <p className="font-medium text-slate-800">{step1Values.lieu}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ODJ */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <ListChecks className="w-3.5 h-3.5" />
          Ordre du jour ({items.length} points)
        </p>
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          {items.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="text-xs text-slate-400 font-bold w-5 text-center flex-shrink-0">{idx + 1}</span>
              <p className="flex-1 text-sm text-slate-800">{item.titre}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium flex-shrink-0 ${TYPE_CONFIG[item.type].cls}`}>
                {TYPE_CONFIG[item.type].label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Alerte délai légal */}
      {convocDeadline && (
        <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl">
          <CalendarDays className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            <span className="font-semibold">Délai légal :</span> les convocations doivent être envoyées avant le <span className="font-semibold">{convocDeadline}</span> (21 jours avant l&apos;AG — art. 9 décret 1967).
          </p>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="flex items-center gap-2 bg-[#374151] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#374151]/90 transition-colors disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {submitting ? 'Création…' : 'Créer l\'assemblée'}
        </button>
      </div>
    </div>
  )
}

// ── Main wizard ────────────────────────────────────────────────

export function AgWizard() {
  const router = useRouter()
  const [step, setStep]               = useState(1)
  const [coproprietes, setCoproprietes] = useState<Copropriete[]>([])
  const [step1Values, setStep1Values] = useState<Step1Values | null>(null)
  const [odjItems, setOdjItems]       = useState<OdjItem[]>([])
  const [submitting, setSubmitting]   = useState(false)

  useEffect(() => {
    fetch('/api/coproprietes')
      .then(r => r.json())
      .then(d => setCoproprietes(Array.isArray(d) ? d : (d.data ?? [])))
  }, [])

  function handleStep1(values: Step1Values) {
    setStep1Values(values)
    setStep(2)
  }

  function handleStep2Next() {
    setStep(3)
  }

  async function handleSubmit() {
    if (!step1Values) return
    setSubmitting(true)
    try {
      const dateStr = new Date(step1Values.date_ag).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      const titre = `AG ${step1Values.type === 'extraordinaire' ? 'extraordinaire' : 'ordinaire'} — ${dateStr}`

      const res = await fetch('/api/assemblees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          copropriete_id: step1Values.copropriete_id,
          titre,
          type:    step1Values.type,
          date_ag: new Date(step1Values.date_ag).toISOString(),
          lieu:    step1Values.lieu || null,
          ordre_du_jour: odjItems.map((item, idx) => ({
            ordre: idx + 1,
            titre: item.titre,
            type:  item.type,
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erreur lors de la création')
        return
      }

      toast.success(`AG "${titre}" créée — pensez à envoyer les convocations`)
      router.push(`/assemblees/${data.id}`)
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setSubmitting(false)
    }
  }

  const stepTitles = ['Informations', 'Ordre du jour', 'Récapitulatif']
  const stepDescriptions = [
    'Copropriété, type, date et lieu',
    'Points à l\'ordre du jour',
    'Vérification avant création',
  ]

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/assemblees" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
            Nouvelle assemblée générale
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Étape {step}/3 — {stepDescriptions[step - 1]}
          </p>
        </div>
      </div>

      {/* Step bar */}
      <StepBar current={step} />

      {/* Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2">
          {step === 1 && <CalendarDays className="w-4 h-4 text-[#374151]" />}
          {step === 2 && <ListChecks className="w-4 h-4 text-[#374151]" />}
          {step === 3 && <CheckCircle2 className="w-4 h-4 text-[#374151]" />}
          {stepTitles[step - 1]}
        </h2>

        {step === 1 && (
          <Step1
            coproprietes={coproprietes}
            defaultValues={step1Values ?? {}}
            onNext={handleStep1}
          />
        )}
        {step === 2 && step1Values && (
          <Step2
            step1Values={step1Values}
            items={odjItems}
            onItemsChange={setOdjItems}
            onBack={() => setStep(1)}
            onNext={handleStep2Next}
          />
        )}
        {step === 3 && step1Values && (
          <Step3
            step1Values={step1Values}
            coproprietes={coproprietes}
            items={odjItems}
            onBack={() => setStep(2)}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        )}
      </div>
    </div>
  )
}
