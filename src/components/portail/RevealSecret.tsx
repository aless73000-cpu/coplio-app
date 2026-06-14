'use client'

import { useState } from 'react'
import { Eye, EyeOff, Lock, X, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface RevealSecretProps {
  label: string
  value: string
  userEmail: string
}

export function RevealSecret({ label, value, userEmail }: RevealSecretProps) {
  const [revealed, setRevealed] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password,
    })
    setLoading(false)
    if (authError) {
      setError('Mot de passe incorrect.')
      return
    }
    setRevealed(true)
    setShowModal(false)
    setPassword('')
  }

  function handleHide() {
    setRevealed(false)
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex-1 font-mono text-sm font-semibold text-slate-900 tracking-wider">
          {revealed ? value : '•'.repeat(Math.min(value.length, 20))}
        </div>
        {revealed ? (
          <button
            onClick={handleHide}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-slate-100"
          >
            <EyeOff className="w-3.5 h-3.5" />
            Masquer
          </button>
        ) : (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Lock className="w-3 h-3" />
            Voir
          </button>
        )}
      </div>

      {/* Modal de confirmation */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Lock className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Confirmation requise</p>
                  <p className="text-xs text-slate-400">{label}</p>
                </div>
              </div>
              <button
                onClick={() => { setShowModal(false); setPassword(''); setError(null) }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirm} className="p-5 space-y-4">
              <p className="text-sm text-slate-500">
                Entrez votre mot de passe pour afficher cette information confidentielle.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null) }}
                  placeholder="Votre mot de passe"
                  autoFocus
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition-colors"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-600 font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Afficher
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
