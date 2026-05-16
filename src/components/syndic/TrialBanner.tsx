'use client'

import Link from 'next/link'
import { Zap, X } from 'lucide-react'
import { useState, useEffect } from 'react'

interface TrialBannerProps {
  trialEndsAt: string | null
  plan: string | null
}

const DISMISS_KEY = 'coplio_trial_banner_dismissed'

export function TrialBanner({ trialEndsAt, plan }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setDismissed(localStorage.getItem(DISMISS_KEY) === '1')
  }, [])

  // Seulement pour les comptes en trial
  if (plan !== 'trial') return null
  if (!mounted || dismissed) return null

  // Calcul des jours restants
  let daysLeft: number | null = null
  if (trialEndsAt) {
    const end = new Date(trialEndsAt)
    const now = new Date()
    daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  } else {
    // Fallback : on ne sait pas quand ça se termine
    return null
  }

  const isUrgent = daysLeft <= 3
  const isExpired = daysLeft === 0

  if (isExpired) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Zap className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            Votre essai gratuit est terminé. Choisissez un plan pour continuer.
          </p>
        </div>
        <Link
          href="/facturation"
          className="flex-shrink-0 bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors"
        >
          Choisir un plan →
        </Link>
      </div>
    )
  }

  return (
    <div
      className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-4 ${
        isUrgent
          ? 'border-amber-200 bg-amber-50'
          : 'border-coplio-green/20 bg-coplio-green-light/40'
      }`}
    >
      <div className="flex items-center gap-3">
        <Zap className={`w-4 h-4 flex-shrink-0 ${isUrgent ? 'text-amber-500' : 'text-coplio-green'}`} />
        <p className={`text-sm font-medium ${isUrgent ? 'text-amber-800' : 'text-coplio-text'}`}>
          {isUrgent
            ? `⚠️ Essai gratuit : il vous reste ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`
            : `Essai gratuit en cours — ${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}`}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href="/facturation"
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
            isUrgent
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-coplio-green text-white hover:bg-coplio-green/90'
          }`}
        >
          {isUrgent ? 'Souscrire maintenant' : 'Voir les plans'}
        </Link>
        {!isUrgent && (
          <button
            onClick={() => {
              localStorage.setItem(DISMISS_KEY, '1')
              setDismissed(true)
            }}
            className="p-1 rounded-lg hover:bg-black/5 transition-colors text-muted-foreground"
            title="Masquer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
