'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

const schema = z.object({
  prenom: z.string().min(1, 'Prénom requis'),
  nom: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  telephone: z.string().optional(),
  adresse_correspondance: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const inputClass = `w-full px-3 py-2.5 text-sm bg-white border border-border rounded-lg
  focus:outline-none focus:ring-2 focus:ring-[#374151]/20 focus:border-transparent
  placeholder:text-gray-400 transition-shadow`

export default function NewCopropriétairePage() {
  const router = useRouter()
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(values: FormValues) {
    setServerError('')
    const res = await fetch('/api/coproprietaires', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    const data = await res.json()
    if (!res.ok) { setServerError(data.error || 'Erreur'); return }
    router.push('/coproprietaires')
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/coproprietaires" className="text-muted-foreground hover:text-coplio-text transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Nouveau copropriétaire</h1>
          <p className="text-muted-foreground text-sm">Ajouter un copropriétaire à votre cabinet</p>
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

        <div className="flex gap-3">
          <Link
            href="/coproprietaires"
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
            Créer le copropriétaire
          </button>
        </div>
      </form>
    </div>
  )
}
