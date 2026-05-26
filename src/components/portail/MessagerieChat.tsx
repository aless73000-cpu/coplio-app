'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, Send, Loader2 } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface MessageItem {
  id: string
  contenu: string
  expediteur_id: string
  created_at: string
  expediteur?: { prenom?: string; nom?: string; role?: string }
}

interface Props {
  userId: string
  conversationId: string | null
  onConversationCreated?: (id: string) => void
}

export function MessagerieChat({ userId, conversationId: initialConvId, onConversationCreated }: Props) {
  const [convId, setConvId] = useState<string | null>(initialConvId)
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadMessages = useCallback(async (id: string) => {
    setLoading(true)
    const res = await fetch(`/api/portail/conversations/${id}/messages`)
    if (res.ok) {
      const data = await res.json()
      setMessages(Array.isArray(data) ? data : [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (convId) loadMessages(convId)
    else setMessages([])
  }, [convId, loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Temps réel — messages entrants du syndic
  useEffect(() => {
    if (!convId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`portail-msgs:${convId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${convId}`,
      }, async (payload) => {
        if (payload.new.expediteur_id === userId) return
        const { data: exp } = await supabase
          .from('profiles').select('prenom, nom, role').eq('id', payload.new.expediteur_id).single()
        setMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev
          return [...prev, {
            ...(payload.new as unknown as MessageItem),
            expediteur: exp ? { prenom: exp.prenom ?? undefined, nom: exp.nom ?? undefined, role: exp.role ?? undefined } : undefined,
          }]
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [convId, userId])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const contenu = input.trim()
    if (!contenu || sending) return
    setSending(true)
    setInput('')

    // Créer la conversation si elle n'existe pas encore
    let currentConvId = convId
    if (!currentConvId) {
      const res = await fetch('/api/portail/conversations', { method: 'POST' })
      if (!res.ok) { setSending(false); setInput(contenu); return }
      const conv = await res.json()
      currentConvId = conv.id
      setConvId(conv.id)
      onConversationCreated?.(conv.id)
    }

    // Optimistic
    const optimisticId = `opt-${Date.now()}`
    setMessages(prev => [...prev, { id: optimisticId, contenu, expediteur_id: userId, created_at: new Date().toISOString() }])

    const res = await fetch(`/api/portail/conversations/${currentConvId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contenu }),
    })

    if (res.ok) {
      const sent = await res.json()
      setMessages(prev => prev.map(m => m.id === optimisticId ? { ...m, id: sent.id, created_at: sent.created_at } : m))
    } else {
      setMessages(prev => prev.filter(m => m.id !== optimisticId))
      setInput(contenu)
    }
    setSending(false)
  }

  return (
    <div className="flex-1 coplio-card p-0 overflow-hidden flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-[#374151]" />
        </div>
        <div>
          <p className="font-semibold text-coplio-text">Votre syndic</p>
          <p className="text-xs text-muted-foreground">Messagerie privée</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#374151] animate-pulse" />
          <span className="text-xs text-muted-foreground">En ligne</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          <div className="flex justify-center pt-8">
            <Loader2 className="w-5 h-5 animate-spin text-[#374151]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <MessageCircle className="w-7 h-7 text-[#374151]" />
            </div>
            <p className="font-medium text-coplio-text">Aucun message</p>
            <p className="text-sm text-muted-foreground mt-1">
              Envoyez un message à votre syndic ci-dessous.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.expediteur_id === userId
            const isOptimistic = msg.id.startsWith('opt-')
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] sm:max-w-[65%] rounded-2xl px-4 py-3 transition-opacity ${
                  isMine
                    ? 'bg-[#374151] text-white rounded-br-sm'
                    : 'bg-coplio-bg border border-border text-coplio-text rounded-bl-sm'
                } ${isOptimistic ? 'opacity-70' : 'opacity-100'}`}>
                  {!isMine && (
                    <p className="text-xs font-semibold text-[#374151] mb-1">
                      {msg.expediteur?.prenom} {msg.expediteur?.nom}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.contenu}</p>
                  <p className={`text-[10px] mt-1.5 ${isMine ? 'text-white/60' : 'text-muted-foreground'}`}>
                    {isOptimistic ? 'Envoi…' : formatDateTime(msg.created_at)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-white">
        <form onSubmit={handleSend} className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              // Ctrl+Enter ou Cmd+Enter uniquement — évite les envois accidentels sur clavier mobile
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                handleSend(e as unknown as React.FormEvent)
              }
            }}
            placeholder="Écrivez votre message…"
            autoComplete="off"
            rows={1}
            className="flex-1 px-4 py-2.5 bg-coplio-bg border border-border rounded-xl text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#374151]/20 focus:border-transparent
                       resize-none max-h-32 leading-5"
            style={{ overflowY: 'auto' }}
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="px-4 py-3 bg-[#374151] text-white rounded-xl font-medium text-sm
                       hover:bg-[#374151]/90 transition-colors flex items-center gap-2 flex-shrink-0
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="hidden sm:inline">Envoyer</span>
          </button>
        </form>
      </div>
    </div>
  )
}
