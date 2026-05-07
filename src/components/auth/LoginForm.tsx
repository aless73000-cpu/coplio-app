'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court'),
})

type LoginValues = z.infer<typeof loginSchema>

interface LoginFormProps {
  redirectTo?: string
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(values: LoginValues) {
    setServerError('')
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (error) {
      if (error.message.includes('Invalid login')) {
        setServerError('Email ou mot de passe incorrect.')
      } else if (error.message.includes('Email not confirmed')) {
        setServerError('Veuillez confirmer votre email avant de vous connecter.')
      } else {
        setServerError(error.message)
      }
      return
    }

    // Récupérer le rôle pour rediriger au bon endroit
    const { data: { user: loggedUser } } = await supabase.auth.getUser()
    if (loggedUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', loggedUser.id)
        .single()

      if (profile?.role === 'owner_resident') {
        router.push('/accueil')
        router.refresh()
        return
      }
    }

    router.push(redirectTo ?? '/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div className="p-3 bg-coplio-red-bg border border-coplio-red/20 rounded-lg">
          <p className="text-coplio-red text-sm">{serverError}</p>
        </div>
      )}

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-coplio-text mb-1.5">
          Adresse email
        </label>
        <input
          type="email"
          {...register('email')}
          placeholder="vous@cabinet.fr"
          className="w-full px-3 py-2.5 text-sm bg-white border border-border rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-coplio-green focus:border-transparent
                     placeholder:text-muted-foreground transition-shadow"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-coplio-red">{errors.email.message}</p>
        )}
      </div>

      {/* Mot de passe */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-coplio-text">
            Mot de passe
          </label>
          <a
            href="/forgot-password"
            className="text-xs text-coplio-green hover:underline"
          >
            Mot de passe oublié ?
          </a>
        </div>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            placeholder="••••••••"
            className="w-full px-3 py-2.5 pr-10 text-sm bg-white border border-border rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-coplio-green focus:border-transparent
                       placeholder:text-muted-foreground transition-shadow"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-coplio-text"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-xs text-coplio-red">{errors.password.message}</p>
        )}
      </div>

      {/* Bouton connexion */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-coplio-green text-white font-medium py-2.5 px-4 rounded-lg
                   hover:bg-coplio-green/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2 text-sm"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Connexion...
          </>
        ) : (
          'Se connecter'
        )}
      </button>
    </form>
  )
}
