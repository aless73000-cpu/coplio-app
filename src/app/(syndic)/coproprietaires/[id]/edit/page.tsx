'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Home, StickyNote } from 'lucide-react'

const schema = z.object({
  prenom: z.string().min(1, 'Prénom requis'),
  nom: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  telephone: z.string().optional(),
  adresse_correspondance: z.string().optional(),
  notes_internes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Lot {
  id: string
  numero: string
  type: string
  copropriete: { id: string; nom: string } | { id: string; nom: string }[]
}

const inputClass = `w-full px-3 py-2.5 text-sm bg-white border border-border rounded-lg
  focus:outline-none focus:ring-2 focus:ring-[#374151]/20 focus:border-transparent
  placeholder:text-gray-400 transition-shadow`

export default function EditCopropriétairePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(true)
  const [allLots, setAllLots] = useState<Lot[]>([])
  const [selectedLots, setSelectedLots] = useState<Set<string>>(new Set())

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    Promise.all([
      fetch(`/api/coproprietaires/${params.id}`).then(r => r.json()),
      fetch('/api/lots').then(r => r.json()),
      fetch(`/api/coproprietaires/${params.id}/lots`).then(r => r.json()),
    ]).then(([copro, lots, currentLotIds]) => {
      reset({
        prenom: copro.prenom ?? '',
        nom: copro.nom ?? '',
        email: copro.email ?? '',
        telephone: copro.telephone ?? '',
        adresse_correspondance: copro.adresse_correspondance ?? '',
        notes_internes: copro.notes_internes ?? '',
      })
      setAllLots(Array.isArray(lots) ? lots : [])
      setSelectedLots(new Set(Array.isArray(currentLotIds) ? currentLotIds : []))
      setLoading(false)
    })
  }, [params.id, reset])

  function toggleLot(lotId: string) {
    setSelectedLots(prev => {
      const next = new Set(prev)
      next.has(lotId) ? next.delete(lotId) : next.add(lotId)
      return next
    })
  }

  async function onSubmit(values: FormValues) {
    setServerError('')
    const [res1, res2] = await Promise.all([
      fetch(`/api/coproprietaires/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      }),
      fetch(`/api/coproprietaires/${params.id}/lots`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lot_ids: Array.from(selectedLots) }),
      }),
    ])

    if (!res1.ok) { const d = await res1.json(); setServerError(d.error || 'Erreur'); return }
    if (!res2.ok) { const d = await res2.json(); setServerError(d.error || 'Erreur lots'); return }

    router.push(`/coproprietaires/${params.id}`)
    router.refresh()
  }

  const lotsByBuilding = allLots.reduce<Record<string, { nom: string; lots: Lot[] }>>((acc, lot) => {
    const copro = Array.isArray(lot.copropriete) ? lot.copropriete[0] : lot.copropriete
    if (!copro) return acc
    if (!acc[copro.id]) acc[copro.id] = { nom: copro.nom, lots: [] }
    acc[copro.id].lots.push(lot)
    return acc
  }, {})

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-[#374151]" />
    </div>
  )

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/coproprietaires/${params.id}`} className="text-muted-foreground hover:text-coplio-text transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Modifier le copropriétaire</h1>
          <p className="text-muted-foreground text-sm">Mettre à jour les informations et les lots</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {serverError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{serverError}</div>
        )}

        <div className="coplio-card space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">Prénom *</label>
              <input {...register('prenom')} className={inputClass} placeholder="Jean" />
              {errors.prenom && <p className="mt-1 text-xs text-red-500">{errors.prenom.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">Nom *</label>
              <input {...register('nom')} className={inputClass} placeholder="Dupont" />
              {errors.nom && <p className="mt-1 text-xs text-red-500">{errors.nom.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-coplio-text mb-1.5">Email</label>
            <input type="email" {...register('email')} className={inputClass} placeholder="jean.dupont@email.com" />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-coplio-text mb-1.5">Téléphone</label>
            <input type="tel" {...register('telephone')} className={inputClass} placeholder="06 12 34 56 78" />
          </div>

          <div>
            <label className="block text-sm font-medium text-coplio-text mb-1.5">Adresse de correspondance</label>
            <textarea
              {...register('adresse_correspondance')}
              rows={3}
              className={inputClass}
              placeholder="Si différente du lot..."
            />
          </div>
        </div>

        <div className="coplio-card space-y-3">
          <div className="flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-coplio-text text-sm">Notes internes</h2>
            <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded ml-1">Visible syndic uniquement</span>
          </div>
          <textarea
            {...register('notes_internes')}
            rows={4}
            className={inputClass}
            placeholder="Ex : en litige, paiement par chèque uniquement, contact préféré par email..."
          />
        </div>

        <div className="coplio-card space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Home className="w-4 h-4 text-[#374151]" />
            <h2 className="font-semibold text-coplio-text text-sm">Lots assignés</h2>
          </div>

          {Object.keys(lotsByBuilding).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">Aucun lot disponible</p>
          ) : (
            Object.values(lotsByBuilding).map((building) => (
              <div key={building.nom}>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{building.nom}</p>
                <div className="space-y-1.5">
                  {building.lots.map((lot) => (
                    <label
                      key={lot.id}
                      className="flex items-center gap-3 p-2.5 bg-coplio-bg rounded-lg cursor-pointer hover:bg-border transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLots.has(lot.id)}
                        onChange={() => toggleLot(lot.id)}
                        className="w-4 h-4 accent-[#374151]"
                      />
                      <span className="text-sm text-coplio-text">
                        Lot {lot.numero}
                        <span className="text-muted-foreground font-normal"> · {lot.type}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-3">
          <Link
            href={`/coproprietaires/${params.id}`}
            className="flex-1 text-center bg-coplio-bg text-coplio-text font-medium py-2.5 px-4 rounded-lg hover:bg-border transition-colors text-sm"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-[#374151] text-white font-medium py-2.5 px-4 rounded-lg hover:bg-[#374151]/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  )
}
