'use client'

import { useState } from 'react'
import { Database, Play, CheckCircle2, XCircle, Minus, Loader2, AlertCircle } from 'lucide-react'

interface MigrationResult {
  id: string
  status: 'ok' | 'skip' | 'error'
  message: string
}

interface RunResponse {
  success: boolean
  results?: MigrationResult[]
  error?: string
}

export default function MigrationsPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const [response, setResponse] = useState<RunResponse | null>(null)

  async function runMigrations() {
    setStatus('loading')
    setResponse(null)
    try {
      const res = await fetch('/api/admin/migrate', { method: 'POST' })
      const data: RunResponse = await res.json()
      setResponse(data)
    } catch {
      setResponse({ success: false, error: 'Erreur réseau' })
    }
    setStatus('done')
  }

  const applied  = response?.results?.filter(r => r.status === 'ok')    ?? []
  const skipped  = response?.results?.filter(r => r.status === 'skip')  ?? []
  const errored  = response?.results?.filter(r => r.status === 'error') ?? []

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-coplio-text">Migrations</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Applique les fichiers <code className="font-mono bg-slate-100 px-1 rounded">supabase/migrations/*.sql</code> en attente sur la base de prod.
        </p>
      </div>

      {/* Info env */}
      <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-amber-800 space-y-0.5">
          <p className="font-semibold">Prérequis — variable d&apos;environnement Vercel</p>
          <p>
            <code className="font-mono bg-amber-100 px-1 rounded">SUPABASE_MANAGEMENT_PAT</code> doit être défini dans{' '}
            <span className="font-medium">Vercel → Settings → Environment Variables</span>.
          </p>
          <p className="text-amber-700 text-xs mt-1">
            Token visible sur <span className="font-mono">supabase.com/dashboard → Account → Access Tokens</span>
          </p>
        </div>
      </div>

      {/* Bouton principal */}
      <div className="coplio-card flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Database className="w-5 h-5 text-[#374151]" />
          </div>
          <div>
            <p className="font-semibold text-coplio-text text-sm">Appliquer les migrations en attente</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Les migrations déjà appliquées sont automatiquement ignorées.
            </p>
          </div>
        </div>
        <button
          onClick={runMigrations}
          disabled={status === 'loading'}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#374151] text-white text-sm font-medium rounded-xl hover:bg-[#374151]/90 disabled:opacity-50 transition-colors flex-shrink-0"
        >
          {status === 'loading'
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Play className="w-4 h-4" />
          }
          {status === 'loading' ? 'En cours…' : 'Lancer'}
        </button>
      </div>

      {/* Résultats */}
      {status === 'done' && response && (
        <div className="space-y-4">
          {/* Bannière succès/erreur */}
          <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${
            response.error
              ? 'bg-red-50 border-red-100 text-red-700'
              : response.success
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                : 'bg-red-50 border-red-100 text-red-700'
          }`}>
            {response.success && !response.error
              ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              : <XCircle className="w-4 h-4 flex-shrink-0" />
            }
            <p className="text-sm font-semibold">
              {response.error
                ? response.error
                : response.success
                  ? `Terminé — ${applied.length} appliquée${applied.length > 1 ? 's' : ''}, ${skipped.length} ignorée${skipped.length > 1 ? 's' : ''}`
                  : `${errored.length} erreur${errored.length > 1 ? 's' : ''} — vérifiez les détails ci-dessous`
              }
            </p>
          </div>

          {/* Détail par migration */}
          {response.results && response.results.length > 0 && (
            <div className="coplio-card overflow-hidden p-0">
              <div className="px-5 py-3 border-b border-border">
                <p className="text-sm font-semibold text-coplio-text">Détail des migrations</p>
              </div>
              <div className="divide-y divide-border">
                {response.results.map((r) => (
                  <div key={r.id} className="flex items-start gap-3 px-5 py-3">
                    {r.status === 'ok'    && <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />}
                    {r.status === 'skip'  && <Minus        className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />}
                    {r.status === 'error' && <XCircle      className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />}
                    <div className="min-w-0">
                      <p className={`text-sm font-mono ${
                        r.status === 'error' ? 'text-red-700' :
                        r.status === 'skip'  ? 'text-muted-foreground' :
                        'text-coplio-text'
                      }`}>
                        {r.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Récap stats */}
          {response.results && (
            <div className="grid grid-cols-3 gap-3">
              <div className="coplio-card text-center py-3">
                <p className="text-2xl font-bold text-emerald-600">{applied.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Appliquées</p>
              </div>
              <div className="coplio-card text-center py-3">
                <p className="text-2xl font-bold text-muted-foreground">{skipped.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Déjà appliquées</p>
              </div>
              <div className="coplio-card text-center py-3">
                <p className={`text-2xl font-bold ${errored.length > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {errored.length}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Erreurs</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
