'use client'
import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error) }, [error])
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
      <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-7 h-7 text-red-500" />
      </div>
      <h2 className="text-lg font-semibold text-coplio-text mb-2">Une erreur est survenue</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        {error.message || 'Quelque chose s\'est mal passé. Réessayez ou contactez le support.'}
      </p>
      <button
        onClick={reset}
        className="flex items-center gap-2 bg-coplio-green text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-coplio-green/90 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Réessayer
      </button>
    </div>
  )
}
