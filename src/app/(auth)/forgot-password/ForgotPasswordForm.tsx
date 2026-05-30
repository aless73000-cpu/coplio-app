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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      {/* Logo — même style que /login et /register */}
      <Link href="/" className="flex items-center gap-2.5 mb-10 group">
        <div className="w-9 h-9 bg-[#374151] rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-xl text-[#374151]" style={{ letterSpacing: '-0.02em' }}>Coplio</span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-500 border border-amber-200 tracking-wider leading-none">BETA</span>
      </Link>

      <div className="w-full max-w-[420px]">

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
          <div className="bg-white rounded-3xl border border-slate-100 p-8" style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.03), 0 20px 60px rgba(0,0,0,0.07)' }}>
            <div className="mb-7">
              <Link href="/login" className="flex items-center gap-1.5 text-slate-400 hover:text-[#374151] text-sm mb-5 transition-colors w-fit">
                <ArrowLeft className="w-4 h-4" />
                Retour à la connexion
              </Link>
              <h1 className="text-2xl font-bold text-[#374151]" style={{ letterSpacing: '-0.03em' }}>Mot de passe oublié</h1>
              <p className="text-slate-400 mt-1.5 text-sm">
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
                className="w-full bg-[#374151] text-white font-semibold py-3.5 px-4 rounded-xl
                         hover:bg-[#4B5563] transition-all disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2 text-sm shadow-apple-sm
                         shadow-[#374151]/20 hover:-translate-y-px hover:shadow-apple-md"
              style={{ letterSpacing: '-0.01em' }}
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
