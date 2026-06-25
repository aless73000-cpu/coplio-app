'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, ChevronRight, ChevronLeft, History, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface AuditLog {
  id: string
  action: string
  entite: string
  entite_id: string | null
  entite_nom: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  user: { prenom: string; nom: string } | null
}

const ACTION_LABELS: Record<string, string> = {
  create: 'Création', update: 'Modification', delete: 'Suppression',
  send: 'Envoi', pay: 'Paiement', invite: 'Invitation',
  login: 'Connexion', status_change: 'Statut modifié', upload: 'Fichier ajouté', export: 'Export',
}

const ENTITE_LABELS: Record<string, string> = {
  copropriete: 'Copropriété', lot: 'Lot', coproprietaire: 'Copropriétaire',
  appel_charges: 'Appel de charges', paiement: 'Paiement', sinistre: 'Sinistre',
  assemblee: 'Assemblée', document: 'Document', message: 'Message',
  membre_equipe: 'Équipe', vote: 'Vote', budget: 'Budget',
}

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-slate-100 text-[#374151]',
  update: 'bg-blue-50 text-blue-600',
  delete: 'bg-red-50 text-red-600',
  send:   'bg-purple-50 text-purple-600',
  pay:    'bg-slate-100 text-[#374151]',
  invite: 'bg-amber-50 text-amber-600',
  status_change: 'bg-blue-50 text-blue-600',
  upload: 'bg-coplio-bg text-muted-foreground',
  export: 'bg-coplio-bg text-muted-foreground',
}

export function HistoriqueSection() {
  const [logs,    setLogs]    = useState<AuditLog[]>([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(false)
  const [page,    setPage]    = useState(0)
  const [open,    setOpen]    = useState(false)
  const LIMIT = 20

  const load = useCallback(async (p = 0) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/audit-logs?limit=${LIMIT}&offset=${p * LIMIT}`)
      const data = await res.json()
      setLogs(data.logs ?? [])
      setTotal(data.total ?? 0)
      setPage(p)
    } catch {
      toast.error('Impossible de charger l\'historique')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) load(0)
  }, [open, load])

  return (
    <section className="coplio-card">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-coplio-bg rounded-xl flex items-center justify-center">
            <History className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-left">
            <h2 className="font-semibold text-coplio-text">Historique des actions</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Audit trail de votre cabinet</p>
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground">{total} action{total > 1 ? 's' : ''} au total</p>
            <button
              onClick={() => load(page)}
              disabled={loading}
              className="flex items-center gap-1 text-xs text-[#374151] hover:underline disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucune action enregistrée</p>
          ) : (
            <>
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${ACTION_COLORS[log.action] ?? 'bg-coplio-bg text-muted-foreground'}`}>
                      {ACTION_LABELS[log.action] ?? log.action}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-coplio-text">
                        <span className="font-medium">{ENTITE_LABELS[log.entite] ?? log.entite}</span>
                        {log.entite_nom && <span className="text-muted-foreground"> — {log.entite_nom}</span>}
                      </p>
                      {log.user && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          par {log.user.prenom} {log.user.nom}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground flex-shrink-0">
                      {new Date(log.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {total > LIMIT && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <button
                    onClick={() => load(page - 1)}
                    disabled={page === 0 || loading}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-coplio-text disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Précédent
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} / {total}
                  </span>
                  <button
                    onClick={() => load(page + 1)}
                    disabled={(page + 1) * LIMIT >= total || loading}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-coplio-text disabled:opacity-40 transition-colors"
                  >
                    Suivant <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}
