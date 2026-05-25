'use client'

import { useState } from 'react'
import { Send, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  agId: string
  status: string
  convocationsEnvoyeesAt?: string | null
}

export function ConvocationButton({ agId, status, convocationsEnvoyeesAt }: Props) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const alreadySent = status === 'convocations_envoyees' || status === 'en_cours' || status === 'terminee'
  const disabled = alreadySent || status === 'annulee' || loading || sent

  async function handleSend() {
    if (disabled) return
    setLoading(true)
    try {
      const res = await fetch(`/api/assemblees/${agId}/convoquer`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Erreur lors de l\'envoi')
      } else {
        setSent(true)
        toast.success(`${data.sent} convocation${data.sent > 1 ? 's' : ''} envoyée${data.sent > 1 ? 's' : ''} avec succès`)
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  if (alreadySent || sent) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#111827] font-medium">
        <CheckCircle className="w-4 h-4" />
        Convocations envoyées
        {convocationsEnvoyeesAt && (
          <span className="text-muted-foreground font-normal text-xs">
            · le {new Date(convocationsEnvoyeesAt).toLocaleDateString('fr-FR')}
          </span>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={handleSend}
      disabled={disabled}
      className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Send className="w-4 h-4" />
      )}
      {loading ? 'Envoi en cours…' : 'Envoyer les convocations'}
    </button>
  )
}
