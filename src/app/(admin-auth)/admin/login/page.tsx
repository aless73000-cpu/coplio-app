'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Loader2, Eye, EyeOff } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0A1F16' }}>
      {/* Panneau gauche décoratif */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12" style={{ background: '#0F2B1F' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#374151] rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg">Coplio</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Portail<br />Administration
          </h1>
          <p className="text-white/50 text-base leading-relaxed">
            Gérez vos clients, suivez vos revenus<br />
            et administrez la plateforme Coplio.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Clients', value: 'Gestion' },
            { label: 'Revenus', value: 'MRR & ARR' },
            { label: 'Abonnements', value: 'Suivi' },
            { label: 'Messages', value: 'Support' },
          ].map(({ label, value }) => (
            <div key={label} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p className="text-white/40 text-xs mb-1">{label}</p>
              <p className="text-white font-semibold text-sm">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Formulaire */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-[#374151] rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg">Coplio Admin</span>
          </div>

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: 'rgba(15,110,86,0.2)', border: '1px solid rgba(15,110,86,0.4)' }}>
              <ShieldCheck className="w-3.5 h-3.5 text-[#374151]" />
              <span className="text-[#374151] text-xs font-semibold tracking-wide uppercase">Portail Admin</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Connexion administrateur</h2>
            <p className="text-white/40 text-sm">Accès restreint — administrateurs uniquement</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="admin@coplio.fr"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#374151]/20"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#374151]/20 pr-11"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#374151] text-white font-semibold py-3 rounded-xl hover:bg-[#374151]/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {loading ? 'Connexion...' : 'Accéder au portail admin'}
            </button>
          </form>

          <p className="text-center text-white/20 text-xs mt-8">
            Coplio Administration · Accès restreint
          </p>
        </div>
      </div>
    </div>
  )
}
