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
  copropriete_id: z.string().uuid('Copropriété requise'),
  titre: z.string().min(3, 'Titre requis'),
  type: z.enum(['ordinaire', 'extraordinaire']),
  date_ag: z.string().min(1, 'Date requise'),
  lieu: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const inputClass = `w-full px-3 py-2.5 text-sm bg-white border border-border rounded-lg
  focus:outline-none focus:ring-2 focus:ring-coplio-green focus:border-transparent
  placeholder:text-muted-foreground transition-shadow`

export default function NewAssembleePage() {
  const router = useRouter()
  const [serverError, setServerError] = useState('')
  const [coproprietes, setCoproprietes] = useState<{ id: string; nom: string }[]>([])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'ordinaire' },
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.from('coproprietes').select('id, nom').order('nom').then(({ data }) => {
      if (data) setCoproprietes(data)
    })
  }, [])

  async function onSubmit(values: FormValues) {
    setServerError('')
    const res = await fetch('/api/assemblees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    const data = await res.json()
    if (!res.ok) { setServerError(data.error || 'Erreur'); return }
    router.push('/assemblees')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/assemblees" className="text-muted-foreground hover:text-coplio-text transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Nouvelle assemblée générale</h1>
          <p className="text-muted-foreground text-sm">Planifiez une AG pour une copropriété</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {serverError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{serverError}</div>
        )}

        <div className="coplio-card space-y-4">
          <div>
            <label className="block text-sm font-medium text-coplio-text mb-1.5">Copropriété *</label>
            <select {...register('copropriete_id')} className={inputClass}>
              <option value="">Sélectionner une copropriété</option>
              {coproprietes.map(c => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
            {errors.copropriete_id && <p className="mt-1 text-xs text-red-500">{errors.copropriete_id.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">Type *</label>
              <select {...register('type')} className={inputClass}>
                <option value="ordinaire">Ordinaire</option>
                <option value="extraordinaire">Extraordinaire</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">Date et heure *</label>
              <input type="datetime-local" {...register('date_ag')} className={inputClass} />
              {errors.date_ag && <p className="mt-1 text-xs text-red-500">{errors.date_ag.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-coplio-text mb-1.5">Titre *</label>
            <input {...register('titre')} className={inputClass} placeholder="AG annuelle 2026" />
            {errors.titre && <p className="mt-1 text-xs text-red-500">{errors.titre.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-coplio-text mb-1.5">Lieu</label>
            <input {...register('lieu')} className={inputClass} placeholder="Salle de réunion, 12 rue..." />
          </div>

        </div>

        <div className="flex gap-3">
          <Link href="/assemblees" className="flex-1 text-center bg-coplio-bg text-coplio-text font-medium py-2.5 px-4 rounded-lg hover:bg-border transition-colors text-sm">
            Annuler
          </Link>
          <button type="submit" disabled={isSubmitting} className="flex-1 bg-coplio-green text-white font-medium py-2.5 px-4 rounded-lg hover:bg-coplio-green/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Planifier l&apos;AG
          </button>
        </div>
      </form>
    </div>
  )
}
