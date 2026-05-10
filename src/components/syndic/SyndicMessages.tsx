'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Loader2, MessageSquare, Users, ShieldCheck, ChevronLeft } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface Conversation {
  id: string
  sujet?: string
  derniere_activite: string
  coproprietaire?: { prenom: string; nom: string }
}

interface Message {
  id: string
  contenu: string
  expediteur_id: string
  created_at: string
  expediteur?: { prenom?: string; nom?: string; role?: string }
}

interface AdminMessage {
  id: string
  contenu: string
  sender_email: string
  sender_type: string
  created_at: string
}

interface Props {
  userId: string
  cabinetId: string
  currentEmail: string
  initialConversations: Conversation[]
}

export function SyndicMessages({ userId, cabinetId, currentEmail, initialConversations }: Props) {
  const [tab, setTab] = useState<'copro' | 'admin'>('copro')
  const [conversations] = useState<Conversation[]>(initialConversations)
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Charger messages admin
  useEffect(() => {
    if (tab !== 'admin') return
    fetch('/api/syndic/messages?type=support')
      .then(r => r.json())
      .then(data => setAdminMessages(Array.isArray(data) ? data : []))
  }, [tab])

  // Charger messages d'une conversation copropriétaire
  useEffect(() => {
    if (!selectedConv) return
    setLoadingMessages(true)
    const supabase = createClient()
    supabase
      .from('messages')
      .select('*, expediteur:profiles(prenom, nom, role)')
      .eq('conversation_id', selectedConv.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages((data ?? []) as Message[])
        setLoadingMessages(false)
      })
  }, [selectedConv])

  // Temps réel pour conversation copropriétaire
  useEffect(() => {
    if (!selectedConv) return
    const supabase = createClient()
    const channel = supabase
      .channel(`syndic-messages:${selectedConv.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${selectedConv.id}`,
      }, async (payload) => {
        if (payload.new.expediteur_id === userId) return
        const { data: exp } = await supabase.from('profiles').select('prenom, nom, role').eq('id', payload.new.expediteur_id).single()
        setMessages(prev => [...prev, { ...(payload.new as Message), expediteur: exp ?? undefined }])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [selectedConv?.id, userId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, adminMessages])

  async function sendCoproMessage() {
    const contenu = input.trim()
    if (!contenu || sending || !selectedConv) return
    setSending(true)
    setInput('')
    const optimisticId = `opt-${Date.now()}`
    setMessages(prev => [...prev, { id: optimisticId, contenu, expediteur_id: userId, created_at: new Date().toISOString() }])
    const supabase = createClient()
    const { data: sent } = await supabase.from('messages')
      .insert({ conversation_id: selectedConv.id, expediteur_id: userId, contenu, lu: false })
      .select('id, created_at').single()
    if (sent) {
      setMessages(prev => prev.map(m => m.id === optimisticId ? { ...m, id: sent.id, created_at: sent.created_at } : m))
      await supabase.from('conversations').update({ derniere_activite: new Date().toISOString() }).eq('id', selectedConv.id)
    }
    setSending(false)
  }

  async function sendAdminMessage() {
    const contenu = input.trim()
    if (!contenu || sending) return
    setSending(true)
    setInput('')
    const res = await fetch('/api/syndic/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contenu }),
    })
    if (res.ok) {
      const msg = await res.json()
      setAdminMessages(prev => [...prev, msg])
    }
    setSending(false)
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (tab === 'admin') sendAdminMessage()
    else sendCoproMessage()
  }

  const showChat = tab === 'admin' || selectedConv !== null

  return (
    <div className="h-full flex flex-col">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-coplio-text">Messages</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Échangez avec vos copropriétaires et l'administration</p>
      </div>

      <div className="flex-1 flex gap-5 min-h-0">
        {/* Colonne gauche */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-3">
          {/* Onglets */}
          <div className="flex gap-2">
            <button onClick={() => { setTab('copro'); setSelectedConv(null) }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'copro' ? 'bg-coplio-green text-white' : 'bg-white text-coplio-text border border-border hover:bg-coplio-bg'}`}>
              <Users className="w-4 h-4" /> Copropriétaires
            </button>
            <button onClick={() => setTab('admin')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'admin' ? 'bg-coplio-green text-white' : 'bg-white text-coplio-text border border-border hover:bg-coplio-bg'}`}>
              <ShieldCheck className="w-4 h-4" /> Admin
            </button>
          </div>

          {/* Liste conversations */}
          {tab === 'copro' && (
            <div className="coplio-card p-0 flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                  <MessageSquare className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Aucune conversation</p>
                </div>
              ) : (
                conversations.map(conv => {
                  const name = conv.coproprietaire ? `${conv.coproprietaire.prenom} ${conv.coproprietaire.nom}` : conv.sujet ?? 'Conversation'
                  return (
                    <button key={conv.id} onClick={() => setSelectedConv(conv)}
                      className={`w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-coplio-bg transition-colors ${selectedConv?.id === conv.id ? 'bg-coplio-green/5 border-l-2 border-l-coplio-green' : ''}`}>
                      <p className="text-sm font-medium text-coplio-text truncate">{name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(conv.derniere_activite).toLocaleDateString('fr-FR')}</p>
                    </button>
                  )
                })
              )}
            </div>
          )}

          {tab === 'admin' && (
            <div className="coplio-card flex-1 flex flex-col justify-center items-center text-center">
              <div className="w-12 h-12 rounded-full bg-coplio-green/10 flex items-center justify-center mb-3">
                <ShieldCheck className="w-6 h-6 text-coplio-green" />
              </div>
              <p className="text-sm font-medium text-coplio-text">Support Coplio</p>
              <p className="text-xs text-muted-foreground mt-1">Échangez directement avec l'équipe admin</p>
            </div>
          )}
        </div>

        {/* Zone de chat */}
        <div className="flex-1 coplio-card p-0 overflow-hidden flex flex-col min-h-0">
          {!showChat ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-coplio-green/10 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-coplio-green" />
              </div>
              <p className="font-semibold text-coplio-text mb-1">Sélectionnez une conversation</p>
              <p className="text-sm text-muted-foreground">Choisissez un copropriétaire dans la liste pour voir les messages</p>
            </div>
          ) : (
            <>
              {/* Header chat */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border flex-shrink-0">
                {selectedConv && (
                  <button onClick={() => setSelectedConv(null)} className="text-muted-foreground hover:text-coplio-text transition-colors mr-1">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <div className="w-9 h-9 bg-coplio-green/10 rounded-full flex items-center justify-center">
                  {tab === 'admin' ? <ShieldCheck className="w-5 h-5 text-coplio-green" /> : <Users className="w-5 h-5 text-coplio-green" />}
                </div>
                <div>
                  <p className="font-semibold text-coplio-text text-sm">
                    {tab === 'admin' ? 'Support Coplio Admin' : (selectedConv?.coproprietaire ? `${selectedConv.coproprietaire.prenom} ${selectedConv.coproprietaire.nom}` : selectedConv?.sujet ?? 'Conversation')}
                  </p>
                  <p className="text-xs text-muted-foreground">{tab === 'admin' ? 'Équipe administration' : 'Copropriétaire'}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {loadingMessages ? (
                  <div className="flex justify-center pt-8"><Loader2 className="w-5 h-5 animate-spin text-coplio-green" /></div>
                ) : tab === 'admin' ? (
                  adminMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageSquare className="w-10 h-10 text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground">Aucun message — démarrez la conversation avec l'admin</p>
                    </div>
                  ) : adminMessages.map(msg => {
                    const isMe = msg.sender_type === 'client'
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[60%] rounded-2xl px-4 py-3 ${isMe ? 'bg-coplio-green text-white rounded-br-sm' : 'bg-coplio-bg border border-border text-coplio-text rounded-bl-sm'}`}>
                          {!isMe && <p className="text-xs font-semibold text-coplio-green mb-1">Coplio Admin</p>}
                          <p className="text-sm">{msg.contenu}</p>
                          <p className={`text-[10px] mt-1.5 ${isMe ? 'text-white/60' : 'text-muted-foreground'}`}>{formatDateTime(msg.created_at)}</p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageSquare className="w-10 h-10 text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground">Aucun message dans cette conversation</p>
                    </div>
                  ) : messages.map(msg => {
                    const isMe = msg.expediteur_id === userId
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[60%] rounded-2xl px-4 py-3 ${isMe ? 'bg-coplio-green text-white rounded-br-sm' : 'bg-coplio-bg border border-border text-coplio-text rounded-bl-sm'}`}>
                          {!isMe && <p className="text-xs font-semibold text-coplio-green mb-1">{msg.expediteur?.prenom} {msg.expediteur?.nom}</p>}
                          <p className="text-sm">{msg.contenu}</p>
                          <p className={`text-[10px] mt-1.5 ${isMe ? 'text-white/60' : 'text-muted-foreground'}`}>{formatDateTime(msg.created_at)}</p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="px-5 py-4 border-t border-border flex gap-3 flex-shrink-0">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Écrire un message..."
                  className="flex-1 px-4 py-2.5 bg-coplio-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coplio-green"
                />
                <button type="submit" disabled={sending || !input.trim()}
                  className="bg-coplio-green text-white px-4 py-2.5 rounded-xl hover:bg-coplio-green/90 transition-colors disabled:opacity-60 flex items-center gap-2 text-sm font-medium">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Envoyer
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
