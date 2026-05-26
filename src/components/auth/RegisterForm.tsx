'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
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

function passwordStrength(pwd: string): { score: number; label: string; color: string } {
  let score = 0
  if (pwd.length >= 8) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  const map = [
    { label: '', color: '' },
    { label: 'Faible', color: 'bg-red-400' },
    { label: 'Moyen', color: 'bg-amber-400' },
    { label: 'Bien', color: 'bg-blue-400' },
    { label: 'Fort', color: 'bg-green-500' },
  ]
  return { score, ...map[score] }
}

export function RegisterForm() {
  const router = useRouter()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, touchedFields },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  })

  const passwordValue = watch('password') ?? ''
  const strength = passwordStrength(passwordValue)

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

    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (signInError) {
      router.push(
        `/login?message=${encodeURIComponent('Un email de confirmation vous a été envoyé. Cliquez sur le lien pour activer votre compte.')}`
      )
      return
    }

    router.push('/onboarding')
  }

  function fieldClass(name: keyof RegisterValues) {
    const hasError = !!errors[name]
    const isTouched = !!touchedFields[name]
    const isValid = isTouched && !hasError
    return `w-full px-3 py-2.5 text-sm bg-white border rounded-lg
      focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 transition-all
      ${hasError && isTouched ? 'border-red-400 focus:ring-red-200' : isValid ? 'border-green-400 focus:ring-green-100' : 'border-border focus:ring-[#374151]/20'}`
  }

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
          <input {...register('prenom')} className={fieldClass('prenom')} placeholder="Jean" />
          {errors.prenom && touchedFields.prenom && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <XCircle className="w-3 h-3" />{errors.prenom.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-coplio-text mb-1.5">Nom</label>
          <input {...register('nom')} className={fieldClass('nom')} placeholder="Dupont" />
          {errors.nom && touchedFields.nom && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <XCircle className="w-3 h-3" />{errors.nom.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-coplio-text mb-1.5">Nom de votre cabinet</label>
        <input {...register('nomCabinet')} className={fieldClass('nomCabinet')} placeholder="Cabinet Immobilier Dupont" />
        {errors.nomCabinet && touchedFields.nomCabinet && (
          <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
            <XCircle className="w-3 h-3" />{errors.nomCabinet.message}
          </p>
        )}
        {!errors.nomCabinet && touchedFields.nomCabinet && (
          <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />Cabinet enregistré
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-coplio-text mb-1.5">Email professionnel</label>
        <input type="email" {...register('email')} className={fieldClass('email')} placeholder="vous@cabinet.fr" />
        {errors.email && touchedFields.email && (
          <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
            <XCircle className="w-3 h-3" />{errors.email.message}
          </p>
        )}
        {!errors.email && touchedFields.email && (
          <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />Email valide
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-coplio-text mb-1.5">Mot de passe</label>
        <input type="password" {...register('password')} className={fieldClass('password')} placeholder="••••••••" />

        {/* Indicateur de force */}
        {passwordValue.length > 0 && (
          <div className="mt-2 space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    i <= strength.score ? strength.color : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            {strength.label && (
              <p className={`text-xs font-medium ${
                strength.score <= 1 ? 'text-red-500' :
                strength.score === 2 ? 'text-amber-500' :
                strength.score === 3 ? 'text-blue-500' : 'text-green-600'
              }`}>
                {strength.label}
                {strength.score < 3 && (
                  <span className="text-muted-foreground font-normal ml-1">
                    · {!passwordValue.match(/[A-Z]/) ? 'ajoutez une majuscule' : !passwordValue.match(/[0-9]/) ? 'ajoutez un chiffre' : 'ajoutez un symbole'}
                  </span>
                )}
              </p>
            )}
          </div>
        )}
        {errors.password && touchedFields.password && !passwordValue.length && (
          <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
            <XCircle className="w-3 h-3" />{errors.password.message}
          </p>
        )}
      </div>

      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="accepteCGU"
          {...register('accepteCGU')}
          className="mt-0.5 w-4 h-4 rounded border-border accent-[#374151] cursor-pointer flex-shrink-0"
        />
        <label htmlFor="accepteCGU" className="text-sm text-muted-foreground cursor-pointer">
          J&apos;accepte les{' '}
          <Link href="/cgu" target="_blank" className="text-[#374151] underline underline-offset-2 hover:text-[#374151]/80">
            conditions générales d&apos;utilisation
          </Link>
        </label>
      </div>
      {errors.accepteCGU && (
        <p className="text-xs text-red-500 -mt-2 flex items-center gap-1">
          <XCircle className="w-3 h-3" />{errors.accepteCGU.message as string}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#374151] text-white font-medium py-2.5 px-4 rounded-lg
                   hover:bg-[#374151]/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed
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
