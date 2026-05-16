'use client'

export default function OfflineContent() {
  return (
    <div className="min-h-screen bg-coplio-bg flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-coplio-green-light rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-coplio-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M6.343 17.657a9 9 0 010-12.728M9.172 15.536a5 5 0 010-7.072M12 12h.01" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-coplio-text mb-2">Pas de connexion</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Vérifiez votre connexion internet et réessayez.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-coplio-green text-white rounded-xl font-medium text-sm hover:bg-coplio-green/90 transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  )
}
