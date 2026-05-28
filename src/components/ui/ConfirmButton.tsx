'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

interface ConfirmButtonProps {
  /** Texte affiché sur le bouton principal */
  label: React.ReactNode
  /** Message de confirmation affiché inline */
  message: string
  /** Callback async exécuté après confirmation */
  onConfirm: () => Promise<void> | void
  /** Classes CSS du bouton principal */
  className?: string
  disabled?: boolean
  /** Texte du bouton de validation (défaut: "Confirmer") */
  confirmLabel?: string
  /** Texte du bouton d'annulation (défaut: "Annuler") */
  cancelLabel?: string
}

/**
 * Remplace window.confirm() par une confirmation inline React.
 * Premier clic → affiche "message + Confirmer / Annuler"
 * Clic "Confirmer" → exécute onConfirm()
 * Compatible Server-Side Rendering et CDP/automation.
 */
export function ConfirmButton({
  label,
  message,
  onConfirm,
  className = '',
  disabled = false,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
}: ConfirmButtonProps) {
  const [pending, setPending] = useState(false)
  const [loading, setLoading] = useState(false)

  if (pending) {
    return (
      <span className="inline-flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">{message}</span>
        <button
          onClick={async () => {
            setLoading(true)
            try { await onConfirm() } finally { setLoading(false); setPending(false) }
          }}
          disabled={loading}
          className="inline-flex items-center gap-1 text-xs font-medium text-white bg-[#374151] px-2 py-1 rounded-md hover:bg-[#374151]/90 disabled:opacity-60 transition-colors"
        >
          {loading && <Loader2 className="w-3 h-3 animate-spin" />}
          {confirmLabel}
        </button>
        <button
          onClick={() => setPending(false)}
          disabled={loading}
          className="text-xs text-muted-foreground hover:text-coplio-text transition-colors"
        >
          {cancelLabel}
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setPending(true)}
      disabled={disabled}
      className={className}
    >
      {label}
    </button>
  )
}
