'use client'

import { useState, useEffect, useRef } from 'react'
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
  initialMessages: MessageItem[]
  conversation: { id: string; sujet?: string } | null
  cabinetId: string | null
  coproprieteId: string | null
}

export function MessagerieChat({ userId, initialMessages, conversation: initialConversation, cabinetId, coproprieteId }: Props) {
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages)
  const [conversation, setConversation] = useState(initialConversation)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!conversation) return

    const supabase = createClient()
    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        async (payload) => {
          // Ignore our own inserts (already added optimistically)
          if (payload.new.expediteur_id === userId) return

          const { data: expediteur } = await supabase
            .from('profiles')
            .select('prenom, nom, role')
            .eq('id', payload.new.expediteur_id)
            .single()

          setMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev
            return [...prev, { ...(payload.new as MessageItem), expediteur: expediteur ?? undefined }]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversation?.id, userId])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const contenu = input.trim()
    if (!contenu || sending) return

    setSending(true)
    setInput('')

    const supabase = createClient()
    let convId = conversation?.id

    if (!convId) {
      const { data: conv } = await supabase
        .from('conversations')
        .insert({
          cabinet_id: cabinetId,
          coproprietaire_id: userId,
          copropriete_id: coproprieteId,
          sujet: 'Message copropriétaire',
          derniere_activite: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (!conv) { setSending(false); return }
      convId = conv.id
      setConversation({ id: conv.id, sujet: 'Message copropriétaire' })
    }

    const optimisticId = `optimistic-${Date.now()}`
    setMessages(prev => [...prev, {
      id: optimisticId,
      contenu,
      expediteur_id: userId,
      created_at: new Date().toISOString(),
    }])

    const { data: sent } = await supabase
      .from('messages')
      .insert({ conversation_id: convId, expediteur_id: userId, contenu, lu: false })
      .select('id, created_at')
      .single()

    if (sent) {
      setMessages(prev => prev.map(m =>
        m.id === optimisticId ? { ...m, id: sent.id, created_at: sent.created_at } : m
      ))
      await supabase
        .from('conversations')
        .update({ derniere_activite: new Date().toISOString() })
        .eq('id', convId)
    }

    setSending(false)
  }

  return (
    <div className="flex-1 coplio-card p-0 overflow-hidden flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <div className="w-9 h-9 bg-coplio-green-light rounded-xl flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-coplio-green" />
        </div>
        <div>
          <p className="font-semibold text-coplio-text">Votre syndic</p>
          {conversation?.sujet && (
            <p className="text-xs text-muted-foreground">{conversation.sujet}</p>
          )}
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-coplio-green animate-pulse" />
          <span className="text-xs text-muted-foreground">En ligne</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 bg-coplio-green-light rounded-full flex items-center justify-center mb-3">
              <MessageCircle className="w-7 h-7 text-coplio-green" />
            </div>
            <p className="font-medium text-coplio-text">Aucun message</p>
            <p className="text-sm text-muted-foreground mt-1">Envoyez un message à votre syndic ci-dessous.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.expediteur_id === userId
            const isOptimistic = msg.id.startsWith('optimistic-')
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[60%] rounded-2xl px-4 py-3 transition-opacity ${
                  isMine
                    ? 'bg-coplio-green text-white rounded-br-sm'
                    : 'bg-coplio-bg border border-border text-coplio-text rounded-bl-sm'
                } ${isOptimistic ? 'opacity-70' : 'opacity-100'}`}>
                  {!isMine && (
                    <p className="text-xs font-semibold text-coplio-green mb-1">
                      {msg.expediteur?.prenom} {msg.expediteur?.nom}
                    </p>
                  )}
                  <p className="text-sm">{msg.contenu}</p>
                  <p className={`text-[10px] mt-1.5 ${isMine ? 'text-white/60' : 'text-muted-foreground'}`}>
                    {isOptimistic ? 'Envoi...' : formatDateTime(msg.created_at)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-border bg-white">
        <form onSubmit={handleSend} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Écrivez votre message..."
            autoComplete="off"
            className="flex-1 px-4 py-3 bg-coplio-bg border border-border rounded-xl text-sm
                       focus:outline-none focus:ring-2 focus:ring-coplio-green focus:border-transparent"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="px-5 py-3 bg-coplio-green text-white rounded-xl font-medium text-sm
                       hover:bg-coplio-green/90 transition-colors flex items-center gap-2 flex-shrink-0
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
            Envoyer
          </button>
        </form>
      </div>
    </div>
  )
}
