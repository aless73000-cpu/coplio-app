'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

const registerSchema = z.object({
  prenom: z.string().min(2, 'Prénom requis'),
  nom: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  password: z
    .string()
    .min(8, 'Au moins 8 caractères')
    .regex(/[A-Z]/, 'Au moins une majuscule')
    .regex(/[0-9]/, 'Au moins un chiffre'),
  nomCabinet: z.string().min(2, 'Nom du cabinet requis'),
  accepteCGU: z.literal(true, {
    errorMap: () => ({ message: 'Vous devez accepter les CGU pour continuer' }),
  }),
})

type RegisterValues = z.infer<typeof registerSchema>

export function RegisterForm() {
  const router = useRouter()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(values: RegisterValues) {
    setServerError('')

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    const data = await res.json()

    if (!res.ok) {
      setServerError(data.error || 'Erreur lors de la création du compte.')
      return
    }

    // Connexion automatique après inscription
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (signInError) {
      // Compte créé mais email non confirmé → informer l'utilisateur
      router.push(
        `/login?message=${encodeURIComponent('Un email de confirmation vous a été envoyé. Cliquez sur le lien pour activer votre compte.')}`
      )
      return
    }

    router.push('/onboarding')
  }

  const inputClass = `w-full px-3 py-2.5 text-sm bg-white border border-border rounded-lg
    focus:outline-none focus:ring-2 focus:ring-coplio-green focus:border-transparent
    placeholder:text-muted-foreground transition-shadow`

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div className="p-3 bg-coplio-red-bg border border-coplio-red/20 rounded-lg">
          <p className="text-coplio-red text-sm">{serverError}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-coplio-text mb-1.5">Prénom</label>
          <input {...register('prenom')} className={inputClass} placeholder="Jean" />
          {errors.prenom && <p className="mt-1 text-xs text-coplio-red">{errors.prenom.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-coplio-text mb-1.5">Nom</label>
          <input {...register('nom')} className={inputClass} placeholder="Dupont" />
          {errors.nom && <p className="mt-1 text-xs text-coplio-red">{errors.nom.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-coplio-text mb-1.5">
          Nom de votre cabinet
        </label>
        <input
          {...register('nomCabinet')}
          className={inputClass}
          placeholder="Cabinet Immobilier Dupont"
        />
        {errors.nomCabinet && (
          <p className="mt-1 text-xs text-coplio-red">{errors.nomCabinet.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-coplio-text mb-1.5">
          Email professionnel
        </label>
        <input
          type="email"
          {...register('email')}
          className={inputClass}
          placeholder="vous@cabinet.fr"
        />
        {errors.email && <p className="mt-1 text-xs text-coplio-red">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-coplio-text mb-1.5">Mot de passe</label>
        <input
          type="password"
          {...register('password')}
          className={inputClass}
          placeholder="••••••••"
        />
        {errors.password && (
          <p className="mt-1 text-xs text-coplio-red">{errors.password.message}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">8 caractères minimum, 1 majuscule, 1 chiffre</p>
      </div>

      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="accepteCGU"
          {...register('accepteCGU')}
          className="mt-0.5 w-4 h-4 rounded border-border accent-coplio-green cursor-pointer flex-shrink-0"
        />
        <label htmlFor="accepteCGU" className="text-sm text-muted-foreground cursor-pointer">
          J&apos;accepte les{' '}
          <Link href="/cgu" target="_blank" className="text-coplio-green underline underline-offset-2 hover:text-coplio-green/80">
            conditions générales d&apos;utilisation
          </Link>
        </label>
      </div>
      {errors.accepteCGU && (
        <p className="text-xs text-coplio-red -mt-2">{errors.accepteCGU.message as string}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-coplio-green text-white font-medium py-2.5 px-4 rounded-lg
                   hover:bg-coplio-green/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2 text-sm mt-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Création du compte...
          </>
        ) : (
          'Créer mon compte gratuit'
        )}
      </button>
    </form>
  )
}
