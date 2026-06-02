'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Loader2, MessageCircle } from 'lucide-react'

interface Message {
  id: string
  contenu: string
  expediteur_id: string
  created_at: string | null
}

interface Props {
  /** Étiquette de l'autre partie, ex: "votre propriétaire" ou "votre locataire" */
  otherLabel: string
}

export function LocataireThread({ otherLabel }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [meId, setMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/portail/locataire-thread')
      const data = await res.json()
      if (res.ok) {
        setMessages(data.messages ?? [])
        if (data.meId) setMeId(data.meId)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 4000) // polling léger
    return () => clearInterval(interval)
  }, [load])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    const contenu = text.trim()
    if (!contenu) return
    setSending(true)
    setText('')
    try {
      const res = await fetch('/api/portail/locataire-thread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenu }),
      })
      if (res.ok) {
        const msg = await res.json()
        setMessages((m) => [...m, msg])
      } else {
        setText(contenu) // restaure en cas d'échec
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" style={{ minHeight: 360, maxHeight: 520 }}>
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
          <MessageCircle className="w-3.5 h-3.5 text-[#374151]" />
        </div>
        <h2 className="text-sm font-bold text-slate-900">Messagerie avec {otherLabel}</h2>
      </div>

      {/* Fil */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5 bg-slate-50/50">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10">
            <MessageCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Aucun message pour l&apos;instant.</p>
            <p className="text-xs text-slate-400 mt-0.5">Écrivez le premier message à {otherLabel}.</p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.expediteur_id === meId
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-sm ${
                  mine ? 'bg-[#374151] text-white rounded-br-md' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md'
                }`}>
                  <p className="whitespace-pre-wrap break-words">{m.contenu}</p>
                  {m.created_at && (
                    <p className={`text-[10px] mt-1 ${mine ? 'text-white/50' : 'text-slate-400'}`}>
                      {new Date(m.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Saisie */}
      <form onSubmit={send} className="p-3 border-t border-slate-100 flex items-center gap-2 flex-shrink-0">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écrire un message…"
          className="flex-1 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#374151]/15 focus:border-[#374151] transition-all"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="w-10 h-10 flex items-center justify-center bg-[#374151] text-white rounded-xl hover:bg-[#4B5563] transition-colors disabled:opacity-40 flex-shrink-0"
          aria-label="Envoyer"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  )
}
