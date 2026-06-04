'use client'

import { useState } from 'react'
import { Send, Loader2, CheckCircle, PenLine } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  agId: string
  status: string
  convocationsEnvoyeesAt?: string | null
}

export function ConvocationButton({ agId, status, convocationsEnvoyeesAt }: Props) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [message, setMessage] = useState('')

  const alreadySent = status === 'convocations_envoyees' || status === 'en_cours' || status === 'terminee'
  const disabled = alreadySent || status === 'annulee' || loading || sent

  async function handleSend() {
    if (disabled) return
    setLoading(true)
    try {
      const res = await fetch(`/api/assemblees/${agId}/convoquer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message.trim() ? { messagePersonnalise: message.trim() } : {}),
      })
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
      <div className="flex items-center gap-2 text-sm text-[#374151] font-medium">
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
    <div className="space-y-2">
      {showCustom && (
        <div className="space-y-1">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={5}
            maxLength={2000}
            placeholder="Rédigez votre message d'introduction… (sinon le texte type sera utilisé)"
            className="w-full px-3 py-2.5 text-sm bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#374151]/20 focus:border-[#374151] transition-all resize-y"
          />
          <p className="text-xs text-muted-foreground">
            Ce texte remplacera le message d&apos;introduction par défaut. La date, le lieu et l&apos;ordre du jour restent ajoutés automatiquement.
          </p>
        </div>
      )}
      <div className="flex items-center gap-2">
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
        <button
          type="button"
          onClick={() => setShowCustom(v => !v)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-[#374151] transition-colors"
        >
          <PenLine className="w-3.5 h-3.5" />
          {showCustom ? 'Message type' : 'Personnaliser le message'}
        </button>
      </div>
    </div>
  )
}
