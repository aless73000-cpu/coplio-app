'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'

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
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const [persist, setPersist] = useState(false)

  // 2FA state
  const [mfaStep, setMfaStep] = useState(false)
  const [mfaLoading, setMfaLoading] = useState(false)
  const [mfaError, setMfaError] = useState('')
  const [mfaFactorId, setMfaFactorId] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const mfaInputRef = useRef<HTMLInputElement>(null)

  // Stored persist value for use after MFA step
  const persistRef = useRef(false)
  // Stored redirect info after MFA
  const postMfaRedirectRef = useRef<string | null>(null)

  // Cas middleware AAL2 : l'utilisateur est déjà connecté (AAL1) mais doit compléter la 2FA
  useEffect(() => {
    if (searchParams?.get('mfa_required') !== '1') return
    async function initMfaChallenge() {
      const supabase = createClient()
      const { data: factorsData } = await supabase.auth.mfa.listFactors()
      const totpFactor = factorsData?.totp?.[0]
      if (totpFactor) {
        setMfaFactorId(totpFactor.id)
        setMfaStep(true)
        setTimeout(() => mfaInputRef.current?.focus(), 100)
      }
    }
    initMfaChallenge()
  }, [searchParams])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  })

  async function finishLogin(supabase: ReturnType<typeof createClient>) {
    if (persistRef.current) {
      document.cookie = 'coplio_persist=1; path=/; max-age=31536000; SameSite=Lax'
    } else {
      document.cookie = 'coplio_persist=; path=/; max-age=0; SameSite=Lax'
    }

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

    router.push(postMfaRedirectRef.current ?? redirectTo ?? '/dashboard')
    router.refresh()
  }

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

    // Vérifier si 2FA est requis
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aalData?.nextLevel === 'aal2' && aalData?.currentLevel === 'aal1') {
      // Récupérer le facteur TOTP
      const { data: factorsData } = await supabase.auth.mfa.listFactors()
      const totpFactor = factorsData?.totp?.[0]
      if (totpFactor) {
        persistRef.current = persist
        postMfaRedirectRef.current = redirectTo ?? null
        setMfaFactorId(totpFactor.id)
        setMfaStep(true)
        setTimeout(() => mfaInputRef.current?.focus(), 100)
        return
      }
    }

    persistRef.current = persist
    await finishLogin(supabase)
  }

  async function onMfaSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mfaCode.length !== 6) {
      setMfaError('Le code doit comporter 6 chiffres.')
      return
    }
    setMfaLoading(true)
    setMfaError('')
    const supabase = createClient()
    try {
      const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId })
      if (challengeErr || !challengeData) {
        setMfaError('Impossible de générer le défi. Réessayez.')
        return
      }
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challengeData.id,
        code: mfaCode,
      })
      if (verifyErr) {
        setMfaError('Code incorrect. Vérifiez votre application d\'authentification.')
        setMfaCode('')
        mfaInputRef.current?.focus()
        return
      }
      await finishLogin(supabase)
    } finally {
      setMfaLoading(false)
    }
  }

  // ─── Étape 2FA ───────────────────────────────────────────────
  if (mfaStep) {
    return (
      <form onSubmit={onMfaSubmit} className="space-y-5">
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="w-14 h-14 bg-coplio-green-light rounded-2xl flex items-center justify-center shadow-apple-sm">
            <ShieldCheck className="w-7 h-7 text-coplio-green" />
          </div>
          <div className="text-center">
            <h2 className="font-semibold text-[#1D1D1F] text-base" style={{ letterSpacing: '-0.015em' }}>
              Vérification en deux étapes
            </h2>
            <p className="text-sm text-[#6E6E73] mt-1 leading-relaxed">
              Ouvrez votre application d&apos;authentification<br />et entrez le code à 6 chiffres.
            </p>
          </div>
        </div>

        {mfaError && (
          <div className="p-3.5 bg-coplio-red-bg border border-coplio-red/20 rounded-xl">
            <p className="text-coplio-red text-sm">{mfaError}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[#1D1D1F] mb-2">
            Code d&apos;authentification
          </label>
          <input
            ref={mfaInputRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={mfaCode}
            onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000 000"
            className="w-full px-4 py-3.5 text-xl bg-white border border-[#E8E8ED] rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-coplio-green/25 focus:border-coplio-green
                       placeholder:text-[#C7C7CC] transition-all text-center tracking-[0.5em] font-mono
                       shadow-apple-sm"
          />
        </div>

        <button
          type="submit"
          disabled={mfaLoading || mfaCode.length !== 6}
          className="w-full bg-coplio-green text-white font-semibold py-3.5 px-4 rounded-xl
                     hover:bg-[#0d5e49] transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2 text-sm shadow-apple-sm
                     shadow-coplio-green/20"
          style={{ letterSpacing: '-0.01em' }}
        >
          {mfaLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Vérification...
            </>
          ) : (
            'Vérifier le code'
          )}
        </button>

        <button
          type="button"
          onClick={() => { setMfaStep(false); setMfaCode(''); setMfaError('') }}
          className="w-full text-sm text-[#6E6E73] hover:text-[#1D1D1F] transition-colors py-1"
        >
          ← Retour à la connexion
        </button>
      </form>
    )
  }

  // ─── Étape 1 : email + mot de passe ─────────────────────────
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {serverError && (
        <div className="p-3.5 bg-coplio-red-bg border border-coplio-red/20 rounded-xl">
          <p className="text-coplio-red text-sm">{serverError}</p>
        </div>
      )}

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-[#1D1D1F] mb-2">
          Adresse email
        </label>
        <input
          type="email"
          {...register('email')}
          placeholder="vous@cabinet.fr"
          className="w-full px-4 py-3 text-sm bg-white border border-[#E8E8ED] rounded-xl
                     focus:outline-none focus:ring-2 focus:ring-coplio-green/25 focus:border-coplio-green
                     placeholder:text-[#C7C7CC] transition-all shadow-apple-sm"
        />
        {errors.email && (
          <p className="mt-1.5 text-xs text-coplio-red">{errors.email.message}</p>
        )}
      </div>

      {/* Mot de passe */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-[#1D1D1F]">
            Mot de passe
          </label>
          <a
            href="/forgot-password"
            className="text-xs text-coplio-green hover:underline font-medium"
          >
            Mot de passe oublié ?
          </a>
        </div>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            placeholder="••••••••"
            className="w-full px-4 py-3 pr-11 text-sm bg-white border border-[#E8E8ED] rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-coplio-green/25 focus:border-coplio-green
                       placeholder:text-[#C7C7CC] transition-all shadow-apple-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#AEAEB2] hover:text-[#6E6E73] transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1.5 text-xs text-coplio-red">{errors.password.message}</p>
        )}
      </div>

      {/* Rester connecté */}
      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={persist}
          onChange={e => setPersist(e.target.checked)}
          className="w-4 h-4 rounded border-[#E8E8ED] accent-coplio-green cursor-pointer"
        />
        <span className="text-sm text-[#6E6E73]">Rester connecté</span>
      </label>

      {/* Bouton connexion */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-coplio-green text-white font-semibold py-3.5 px-4 rounded-xl
                   hover:bg-[#0d5e49] transition-all disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2 text-sm shadow-apple-sm
                   shadow-coplio-green/20 hover:-translate-y-px hover:shadow-apple-md"
        style={{ letterSpacing: '-0.01em' }}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Connexion en cours...
          </>
        ) : (
          'Se connecter'
        )}
      </button>
    </form>
  )
}
