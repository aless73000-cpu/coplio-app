'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle2, Eye, EyeOff, KeyRound, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const inputClass = `w-full px-3 py-2.5 text-sm bg-white border border-border rounded-lg
  focus:outline-none focus:ring-2 focus:ring-[#374151]/20 focus:border-transparent
  placeholder:text-muted-foreground transition-shadow`

export default function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [sessionReady, setSessionReady] = useState(false)

  // Supabase passe le token via le hash (#access_token=...) ou via code=
  // On écoute l'événement PASSWORD_RECOVERY pour confirmer que la session est prête
  useEffect(() => {
    const supabase = createClient()

    // Cas PKCE : échange automatique du code si présent dans l'URL
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (!error) setSessionReady(true)
        else setError('Lien invalide ou expiré. Demandez un nouveau lien.')
      })
      return
    }

    // Cas implicit : Supabase émet PASSWORD_RECOVERY via le hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setSessionReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (err) {
      setError(err.message)
      return
    }

    setDone(true)
    // Rediriger après 2 secondes vers le bon espace
    setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        router.push(profile?.role === 'owner_resident' ? '/accueil' : '/dashboard')
      } else {
        router.push('/login')
      }
    }, 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-coplio-bg px-4">
      <div className="w-full max-w-md">
        {/* Logo — lien vers la landing */}
        <Link href="/" className="flex items-center gap-2 mb-8 w-fit">
          <div className="w-8 h-8 bg-[#374151] rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-coplio-text font-bold text-xl">Coplio</span>
        </Link>

        {done ? (
          <div className="coplio-card text-center py-10">
            <CheckCircle2 className="w-14 h-14 text-[#374151] mx-auto mb-4" />
            <h1 className="text-xl font-bold text-coplio-text mb-2">Mot de passe mis à jour !</h1>
            <p className="text-muted-foreground text-sm">
              Vous allez être redirigé vers votre espace…
            </p>
          </div>
        ) : (
          <div className="coplio-card">
            <div className="mb-6">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <KeyRound className="w-6 h-6 text-[#374151]" />
              </div>
              <h1 className="text-2xl font-bold text-coplio-text">Nouveau mot de passe</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Choisissez un mot de passe sécurisé (8 caractères minimum).
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                {error}
              </div>
            )}

            {!sessionReady && !error && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Vérification du lien…
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass + ' pr-10'}
                    placeholder="8 caractères minimum"
                    required
                    minLength={8}
                    disabled={!sessionReady}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-coplio-text"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">
                  Confirmer le mot de passe
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={inputClass}
                  placeholder="Répétez votre mot de passe"
                  required
                  disabled={!sessionReady}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !sessionReady}
                className="w-full bg-[#374151] text-white font-medium py-2.5 px-4 rounded-lg
                           hover:bg-[#374151]/90 transition-colors disabled:opacity-60
                           flex items-center justify-center gap-2 text-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                Définir le mot de passe
              </button>
            </form>

            <p className="text-center text-xs text-muted-foreground mt-4">
              Lien expiré ?{' '}
              <Link href="/forgot-password" className="text-[#374151] hover:underline">
                Demander un nouveau lien
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
