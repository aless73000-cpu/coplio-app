'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'
import { Home, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="min-h-screen bg-coplio-bg flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-10 h-10 bg-coplio-green rounded-xl flex items-center justify-center">
            <Home className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-coplio-text">Coplio</span>
        </div>

        {/* Illustration */}
        <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <span className="text-5xl">⚠️</span>
        </div>

        <h1 className="text-7xl font-bold text-red-500 mb-3">500</h1>
        <h2 className="text-xl font-semibold text-coplio-text mb-3">Une erreur est survenue</h2>
        <p className="text-muted-foreground mb-3 leading-relaxed">
          Quelque chose s&apos;est mal passé de notre côté.
          Notre équipe a été notifiée automatiquement.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground mb-8 font-mono bg-white border border-border px-3 py-1.5 rounded-lg inline-block">
            Réf : {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-coplio-green text-white font-medium rounded-xl hover:bg-coplio-green/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-border text-coplio-text font-medium rounded-xl hover:bg-coplio-bg transition-colors"
          >
            <Home className="w-4 h-4" />
            Tableau de bord
          </Link>
        </div>
      </div>
    </div>
  )
}
