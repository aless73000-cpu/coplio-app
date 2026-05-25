'use client'

import { useState } from 'react'
import { Send, CheckCircle2, Loader2, RefreshCw } from 'lucide-react'

interface InviterPortailButtonProps {
  coproprietaireId: string
  email: string
  invitationDejaSent: boolean
}

export function InviterPortailButton({
  coproprietaireId,
  email,
  invitationDejaSent,
}: InviterPortailButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleInviter() {
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch(`/api/coproprietaires/${coproprietaireId}/inviter`, {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Erreur lors de l\'envoi')
        setStatus('error')
        return
      }

      setStatus('success')
    } catch {
      setErrorMsg('Erreur réseau')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 rounded-lg text-sm text-[#374151] font-medium">
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
        Invitation envoyée à {email}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleInviter}
        disabled={status === 'loading'}
        className="flex items-center gap-2 px-4 py-2.5 bg-[#374151] text-white rounded-lg text-sm font-medium
                   hover:bg-[#374151]/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === 'loading' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : invitationDejaSent ? (
          <RefreshCw className="w-4 h-4" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        {status === 'loading'
          ? 'Envoi...'
          : invitationDejaSent
            ? 'Renvoyer l\'invitation'
            : 'Inviter au portail'}
      </button>

      {status === 'error' && (
        <p className="text-xs text-coplio-red">{errorMsg}</p>
      )}
    </div>
  )
}
