'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, CheckCircle2, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const inputClass = `w-full px-3 py-2.5 text-sm bg-white border border-border rounded-lg
  focus:outline-none focus:ring-2 focus:ring-[#374151]/20 focus:border-transparent
  placeholder:text-muted-foreground transition-shadow`

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-coplio-bg px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 mb-8 w-fit">
          <div className="w-8 h-8 bg-[#374151] rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-coplio-text font-bold text-xl">Coplio</span>
        </Link>

        {sent ? (
          <div className="coplio-card text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-[#374151] mx-auto mb-4" />
            <h1 className="text-xl font-bold text-coplio-text mb-2">Email envoyé !</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Si un compte existe pour <strong>{email}</strong>, vous recevrez un lien de réinitialisation dans quelques instants.
            </p>
            <Link href="/login" className="text-[#374151] text-sm hover:underline">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <div className="coplio-card">
            <div className="mb-6">
              <Link href="/login" className="flex items-center gap-1.5 text-muted-foreground hover:text-coplio-text text-sm mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Link>
              <h1 className="text-2xl font-bold text-coplio-text">Mot de passe oublié</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Entrez votre email pour recevoir un lien de réinitialisation.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">
                  Adresse email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="vous@cabinet.fr"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#374151] text-white font-medium py-2.5 px-4 rounded-lg
                           hover:bg-[#374151]/90 transition-colors disabled:opacity-60
                           flex items-center justify-center gap-2 text-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Envoyer le lien
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
