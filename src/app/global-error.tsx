'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

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
    <html>
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
          <div className="text-center max-w-md">
            <h1 className="text-5xl font-bold text-red-500 mb-3">500</h1>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Une erreur critique est survenue</h2>
            {error.digest && (
              <p className="text-xs text-gray-400 mb-6 font-mono">Réf : {error.digest}</p>
            )}
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
