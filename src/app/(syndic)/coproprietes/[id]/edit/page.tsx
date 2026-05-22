'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
  nom: z.string().min(2, 'Nom requis'),
  adresse: z.string().min(5, 'Adresse requise'),
  code_postal: z.string().min(5, 'Code postal requis'),
  ville: z.string().min(2, 'Ville requise'),
  nb_lots: z.coerce.number().min(1, 'Au moins 1 lot'),
  annee_construction: z.coerce.number().optional(),
  surface_totale: z.coerce.number().optional(),
  assureur: z.string().optional(),
  statut: z.enum(['a_jour', 'attention', 'urgent']),
})

type FormValues = z.infer<typeof schema>

const inputClass = `w-full px-3 py-2.5 text-sm bg-white border border-border rounded-lg
  focus:outline-none focus:ring-2 focus:ring-coplio-green focus:border-transparent
  placeholder:text-gray-400 transition-shadow`

export default function EditCopropietePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(true)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { statut: 'a_jour' },
  })

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('coproprietes')
      .select('nom, adresse, code_postal, ville, nb_lots, annee_construction, surface_totale, assureur, statut')
      .eq('id', params.id)
      .single()
      .then(({ data }) => {
        if (data) reset({
          nom: data.nom,
          adresse: data.adresse ?? '',
          code_postal: data.code_postal ?? '',
          ville: data.ville ?? '',
          nb_lots: data.nb_lots ?? 0,
          annee_construction: data.annee_construction ?? undefined,
          surface_totale: data.surface_totale ?? undefined,
          assureur: data.assureur ?? '',
          statut: (data.statut ?? 'a_jour') as 'a_jour' | 'attention' | 'urgent',
        })
        setLoading(false)
      })
  }, [params.id, reset])

  async function onSubmit(values: FormValues) {
    setServerError('')
    const res = await fetch(`/api/coproprietes/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    const data = await res.json()
    if (!res.ok) { setServerError(data.error || 'Erreur'); return }
    router.push(`/coproprietes/${params.id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-coplio-green" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/coproprietes/${params.id}`} className="text-muted-foreground hover:text-coplio-text transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Modifier la copropriété</h1>
          <p className="text-muted-foreground text-sm">Mettre à jour les informations</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {serverError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{serverError}</div>
        )}

        <div className="coplio-card space-y-4">
          <h2 className="font-semibold text-coplio-text">Informations générales</h2>
          <div>
            <label className="block text-sm font-medium text-coplio-text mb-1.5">Nom de la copropriété *</label>
            <input {...register('nom')} className={inputClass} />
            {errors.nom && <p className="mt-1 text-xs text-red-500">{errors.nom.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-coplio-text mb-1.5">Adresse *</label>
            <input {...register('adresse')} className={inputClass} />
            {errors.adresse && <p className="mt-1 text-xs text-red-500">{errors.adresse.message}</p>}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">Code postal *</label>
              <input {...register('code_postal')} className={inputClass} />
              {errors.code_postal && <p className="mt-1 text-xs text-red-500">{errors.code_postal.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-coplio-text mb-1.5">Ville *</label>
              <input {...register('ville')} className={inputClass} />
              {errors.ville && <p className="mt-1 text-xs text-red-500">{errors.ville.message}</p>}
            </div>
          </div>
        </div>

        <div className="coplio-card space-y-4">
          <h2 className="font-semibold text-coplio-text">Caractéristiques</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">Nombre de lots *</label>
              <input type="number" {...register('nb_lots')} className={inputClass} min={1} />
              {errors.nb_lots && <p className="mt-1 text-xs text-red-500">{errors.nb_lots.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">Statut</label>
              <select {...register('statut')} className={inputClass}>
                <option value="a_jour">À jour</option>
                <option value="attention">Attention</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">Année de construction</label>
              <input type="number" {...register('annee_construction')} className={inputClass} placeholder="1980" />
            </div>
            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">Surface totale (m²)</label>
              <input type="number" {...register('surface_totale')} className={inputClass} placeholder="1200" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-coplio-text mb-1.5">Assureur</label>
            <input {...register('assureur')} className={inputClass} placeholder="AXA, Allianz..." />
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/coproprietes/${params.id}`}
            className="flex-1 text-center bg-coplio-bg text-coplio-text font-medium py-2.5 px-4 rounded-lg hover:bg-border transition-colors text-sm"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-coplio-green text-white font-medium py-2.5 px-4 rounded-lg hover:bg-coplio-green/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  )
}
