'use client'

import { useState, useRef, useEffect } from 'react'
import { Loader2, CheckCircle2, ShieldCheck, ShieldOff, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

type MfaStep = 'idle' | 'enrolling' | 'verifying' | 'disabling'

export function TwoFactorSection() {
  const [step, setStep]         = useState<MfaStep>('idle')
  const [enabled, setEnabled]   = useState<boolean | null>(null)  // null = loading
  const [factorId, setFactorId] = useState('')
  const [qrUri, setQrUri]       = useState('')       // otpauth:// URI for manual entry
  const [qrSecret, setQrSecret] = useState('')       // base32 secret
  const [code, setCode]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const codeInputRef            = useRef<HTMLInputElement>(null)

  // Check current 2FA status on mount
  useEffect(() => {
    async function checkMfa() {
      const supabase = createClient()
      const { data } = await supabase.auth.mfa.listFactors()
      const verified = data?.totp?.find(f => f.status === 'verified')
      if (verified) {
        setFactorId(verified.id)
        setEnabled(true)
      } else {
        setEnabled(false)
      }
    }
    checkMfa()
  }, [])

  async function startEnroll() {
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data, error: enrollErr } = await supabase.auth.mfa.enroll({ factorType: 'totp', issuer: 'Coplio' })
      if (enrollErr || !data) {
        setError(enrollErr?.message ?? 'Erreur lors de l\'activation.')
        return
      }
      setFactorId(data.id)
      setQrUri(data.totp.uri)
      setQrSecret(data.totp.secret)
      setStep('verifying')
      setTimeout(() => codeInputRef.current?.focus(), 150)
    } finally {
      setLoading(false)
    }
  }

  async function verifyEnroll() {
    if (code.length !== 6) { setError('Le code doit comporter 6 chiffres.'); return }
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: challengeData, error: cErr } = await supabase.auth.mfa.challenge({ factorId })
      if (cErr || !challengeData) { setError('Impossible de générer le défi.'); return }
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId, challengeId: challengeData.id, code,
      })
      if (vErr) {
        setError('Code incorrect. Vérifiez votre application.')
        setCode('')
        codeInputRef.current?.focus()
        return
      }
      setEnabled(true)
      setStep('idle')
      setCode('')
      setQrUri('')
      setQrSecret('')
      toast.success('Authentification à deux facteurs activée !')
    } finally {
      setLoading(false)
    }
  }

  async function disable2FA() {
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error: uErr } = await supabase.auth.mfa.unenroll({ factorId })
      if (uErr) { setError(uErr.message); return }
      setEnabled(false)
      setFactorId('')
      setStep('idle')
      toast.success('Authentification à deux facteurs désactivée.')
    } finally {
      setLoading(false)
    }
  }

  function cancelEnroll() {
    // If we enrolled but didn't verify, clean up (unenroll the unverified factor)
    if (factorId) {
      createClient().auth.mfa.unenroll({ factorId }).catch(() => {})
    }
    setStep('idle')
    setCode('')
    setError('')
    setQrUri('')
    setQrSecret('')
    setFactorId('')
  }

  return (
    <section className="coplio-card">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 text-purple-600" />
        </div>
        <div>
          <h2 className="font-semibold text-coplio-text">Sécurité — Double authentification</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Protégez votre compte avec un code TOTP</p>
        </div>
      </div>

      {enabled === null ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : step === 'idle' ? (
        <>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-4 ${enabled ? 'bg-slate-100 text-[#374151]' : 'bg-coplio-bg text-muted-foreground'}`}>
            {enabled
              ? <><CheckCircle2 className="w-4 h-4 flex-shrink-0" /> 2FA activée — votre compte est protégé</>
              : <><ShieldOff className="w-4 h-4 flex-shrink-0" /> 2FA désactivée</>
            }
          </div>

          {error && <p className="mb-3 text-sm text-coplio-red">{error}</p>}

          {enabled ? (
            <button
              onClick={() => setStep('disabling')}
              className="flex items-center gap-2 text-sm font-medium text-coplio-red border border-coplio-red/30 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              <ShieldOff className="w-4 h-4" /> Désactiver la 2FA
            </button>
          ) : (
            <button
              onClick={() => { setStep('enrolling'); startEnroll() }}
              disabled={loading}
              className="flex items-center gap-2 text-sm font-medium text-purple-600 border border-purple-200 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Activer la 2FA
            </button>
          )}
        </>
      ) : step === 'enrolling' ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : step === 'verifying' ? (
        <div className="space-y-4">
          <p className="text-sm text-coplio-text">
            Scannez le QR code dans votre application d&apos;authentification (Google Authenticator, Authy, etc.), puis entrez le code à 6 chiffres affiché.
          </p>

          {/* QR code via Google Charts API */}
          {qrUri && (
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="p-3 bg-white border-2 border-border rounded-xl inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrUri)}`}
                  alt="QR code 2FA"
                  width={160}
                  height={160}
                  className="rounded"
                />
              </div>
              {qrSecret && (
                <div className="flex items-center gap-2 bg-coplio-bg border border-border rounded-lg px-3 py-2 w-full">
                  <KeyRound className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <p className="text-xs font-mono text-muted-foreground flex-1 break-all select-all">{qrSecret}</p>
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(qrSecret); toast.success('Clé copiée') }}
                    className="text-xs text-[#374151] hover:underline flex-shrink-0"
                  >
                    Copier
                  </button>
                </div>
              )}
              <p className="text-xs text-muted-foreground text-center">
                Vous pouvez aussi saisir la clé manuellement si vous ne pouvez pas scanner.
              </p>
            </div>
          )}

          {error && <p className="text-sm text-coplio-red">{error}</p>}

          <div>
            <label className="block text-sm font-medium text-coplio-text mb-1.5">
              Code de vérification
            </label>
            <input
              ref={codeInputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full px-3 py-2.5 text-sm bg-white border border-border rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-[#374151]/20 focus:border-transparent
                         tracking-[0.4em] font-mono text-center text-lg"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={verifyEnroll}
              disabled={loading || code.length !== 6}
              className="flex-1 flex items-center justify-center gap-2 bg-[#374151] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#374151]/90 transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Confirmer
            </button>
            <button
              onClick={cancelEnroll}
              disabled={loading}
              className="text-sm text-muted-foreground border border-border px-4 py-2 rounded-lg hover:text-coplio-text transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : step === 'disabling' ? (
        <div className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 font-medium">Désactiver la double authentification ?</p>
            <p className="text-xs text-red-600 mt-1">Votre compte sera moins sécurisé. Vous pourrez la réactiver à tout moment.</p>
          </div>
          {error && <p className="text-sm text-coplio-red">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={disable2FA}
              disabled={loading}
              className="flex items-center gap-2 text-sm font-medium text-white bg-coplio-red px-4 py-2 rounded-lg hover:bg-coplio-red/90 transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
              Oui, désactiver
            </button>
            <button
              onClick={() => { setStep('idle'); setError('') }}
              disabled={loading}
              className="text-sm text-muted-foreground border border-border px-4 py-2 rounded-lg hover:text-coplio-text transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
