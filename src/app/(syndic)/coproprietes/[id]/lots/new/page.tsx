'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

const schema = z.object({
  numero: z.string().min(1, 'Numéro requis'),
  type: z.enum(['appartement', 'maison', 'local_commercial', 'parking', 'cave', 'autre']),
  etage: z.string().optional(),
  surface: z.coerce.number().optional(),
  tantiemes: z.coerce.number().min(1, 'Tantièmes requis'),
})

type FormValues = z.infer<typeof schema>

const inputClass = `w-full px-3 py-2.5 text-sm bg-white border border-border rounded-lg
  focus:outline-none focus:ring-2 focus:ring-[#111827]/20 focus:border-transparent
  placeholder:text-gray-400 transition-shadow`

export default function NewLotPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'appartement', tantiemes: 100 },
  })

  async function onSubmit(values: FormValues) {
    setServerError('')
    const res = await fetch('/api/lots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, copropriete_id: params.id }),
    })
    const data = await res.json()
    if (!res.ok) { setServerError(data.error || 'Erreur'); return }
    router.push(`/coproprietes/${params.id}`)
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/coproprietes/${params.id}`} className="text-muted-foreground hover:text-coplio-text transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Nouveau lot</h1>
          <p className="text-muted-foreground text-sm">Ajouter un lot à la copropriété</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {serverError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{serverError}</div>
        )}

        <div className="coplio-card space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">Numéro *</label>
              <input {...register('numero')} className={inputClass} placeholder="A01, 101, P3..." />
              {errors.numero && <p className="mt-1 text-xs text-red-500">{errors.numero.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">Type *</label>
              <select {...register('type')} className={inputClass}>
                <option value="appartement">Appartement</option>
                <option value="maison">Maison</option>
                <option value="local_commercial">Local commercial</option>
                <option value="parking">Parking</option>
                <option value="cave">Cave</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">Étage</label>
              <input {...register('etage')} className={inputClass} placeholder="RDC, 1er, 2e..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">Surface (m²)</label>
              <input type="number" step="0.01" {...register('surface')} className={inputClass} placeholder="65.5" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-coplio-text mb-1.5">Tantièmes *</label>
            <input type="number" {...register('tantiemes')} className={inputClass} placeholder="500" />
            {errors.tantiemes && <p className="mt-1 text-xs text-red-500">{errors.tantiemes.message}</p>}
          </div>
        </div>

        <div className="flex gap-3">
          <Link href={`/coproprietes/${params.id}`} className="flex-1 text-center bg-coplio-bg text-coplio-text font-medium py-2.5 px-4 rounded-lg hover:bg-border transition-colors text-sm">
            Annuler
          </Link>
          <button type="submit" disabled={isSubmitting} className="flex-1 bg-[#111827] text-white font-medium py-2.5 px-4 rounded-lg hover:bg-[#111827]/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Créer le lot
          </button>
        </div>
      </form>
    </div>
  )
}
