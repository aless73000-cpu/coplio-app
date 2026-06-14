'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Loader2, MessageSquare, Users, ShieldCheck, ChevronLeft, Plus, Search, X } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface Conversation {
  id: string
  sujet?: string | null
  derniere_activite: string
  coproprietaire_id?: string | null
  coproprietaire?: { id: string; prenom: string; nom: string } | null
}

interface Message {
  id: string
  contenu: string
  expediteur_id: string
  created_at: string
  expediteur?: { prenom?: string | null; nom?: string | null; role?: string | null } | null
}

interface AdminMessage {
  id: string
  contenu: string
  sender_email: string
  sender_type: string
  created_at: string
}

interface Coproprietaire {
  id: string
  prenom: string
  nom: string
  email?: string | null
}

interface Props {
  userId: string
  cabinetId: string
  currentEmail: string
}

// Modal pour choisir un copropriétaire et démarrer une conversation
function NewMessageModal({ onClose, onCreated }: { onClose: () => void; onCreated: (conv: Conversation) => void }) {
  const [search, setSearch] = useState('')
  const [copros, setCopros] = useState<Coproprietaire[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/coproprietaires')
      .then(r => r.json())
      .then(data => { setCopros(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = copros.filter(c =>
    `${c.prenom} ${c.nom}`.toLowerCase().includes(search.toLowerCase()) ||
    (c.email ?? '').toLowerCase().includes(search.toLowerCase())
  )

  async function handleSelect(copro: Coproprietaire) {
    setCreating(copro.id)
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coproprietaire_id: copro.id }),
    })
    if (res.ok) {
      const conv = await res.json()
      onCreated(conv)
    }
    setCreating(null)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-coplio-text">Nouveau message</h2>
          <button onClick={onClose} className="p-1 hover:bg-coplio-bg rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un copropriétaire…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#374151]/20"
            />
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {search ? 'Aucun résultat' : 'Aucun copropriétaire'}
              </p>
            ) : filtered.map(c => (
              <button
                key={c.id}
                onClick={() => handleSelect(c)}
                disabled={creating === c.id}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-coplio-bg transition-colors text-left disabled:opacity-60"
              >
                <div className="w-9 h-9 bg-[#374151]/10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-[#374151]">
                  {c.prenom[0]}{c.nom[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-coplio-text">{c.prenom} {c.nom}</p>
                  {c.email && <p className="text-xs text-muted-foreground truncate">{c.email}</p>}
                </div>
                {creating === c.id && <Loader2 className="w-4 h-4 animate-spin text-[#374151]" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function SyndicMessages({ userId, cabinetId }: Props) {
  const [tab, setTab] = useState<'copro' | 'admin'>('copro')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Charger les conversations
  const loadConversations = useCallback(async () => {
    const res = await fetch('/api/conversations')
    if (res.ok) {
      const data = await res.json()
      setConversations(Array.isArray(data) ? data : [])
    }
    setLoadingConvs(false)
  }, [])

  useEffect(() => { loadConversations() }, [loadConversations])

  // Charger messages admin
  useEffect(() => {
    if (tab !== 'admin') return
    fetch('/api/syndic/messages?type=support')
      .then(r => r.json())
      .then(data => setAdminMessages(Array.isArray(data) ? data : []))
  }, [tab])

  // Temps réel messages admin
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('admin-support-live')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'admin_support_messages',
        filter: `cabinet_id=eq.${cabinetId}`,
      }, (payload) => {
        const msg = payload.new as AdminMessage
        if (msg.sender_type === 'admin') setAdminMessages(prev => [...prev, msg])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [cabinetId])

  // Charger messages d'une conversation via API
  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMessages(true)
    const res = await fetch(`/api/conversations/${convId}/messages`)
    if (res.ok) {
      const data = await res.json()
      setMessages(Array.isArray(data) ? data : [])
    }
    setLoadingMessages(false)
  }, [])

  useEffect(() => {
    if (!selectedConv) return
    loadMessages(selectedConv.id)
  }, [selectedConv, loadMessages])

  // Temps réel pour messages copropriétaire
  useEffect(() => {
    if (!selectedConv) return
    const supabase = createClient()
    const channel = supabase
      .channel(`msgs:${selectedConv.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${selectedConv.id}`,
      }, async (payload) => {
        if (payload.new.expediteur_id === userId) return
        const { data: exp } = await supabase.from('profiles').select('prenom, nom, role').eq('id', payload.new.expediteur_id).single()
        setMessages(prev => [...prev, {
          ...(payload.new as unknown as Message),
          expediteur: exp ? { prenom: exp.prenom, nom: exp.nom, role: exp.role } : undefined,
        }])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
    // On dépend volontairement de l'id seul : inclure l'objet selectedConv
    // re-souscrirait le canal à chaque changement de référence.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConv?.id, userId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, adminMessages])

  async function sendCoproMessage() {
    const contenu = input.trim()
    if (!contenu || sending || !selectedConv) return
    setSending(true)
    setInput('')

    // Optimistic update
    const optimisticId = `opt-${Date.now()}`
    setMessages(prev => [...prev, { id: optimisticId, contenu, expediteur_id: userId, created_at: new Date().toISOString() }])

    const res = await fetch(`/api/conversations/${selectedConv.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contenu }),
    })

    if (res.ok) {
      const sent = await res.json()
      setMessages(prev => prev.map(m => m.id === optimisticId ? { ...m, id: sent.id, created_at: sent.created_at } : m))
      // Mettre à jour derniere_activite dans la liste
      setConversations(prev => prev.map(c => c.id === selectedConv.id
        ? { ...c, derniere_activite: new Date().toISOString() }
        : c
      ).sort((a, b) => new Date(b.derniere_activite).getTime() - new Date(a.derniere_activite).getTime()))
    } else {
      // Rollback si échec
      setMessages(prev => prev.filter(m => m.id !== optimisticId))
      setInput(contenu)
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
    } else {
      setInput(contenu)
    }
    setSending(false)
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (tab === 'admin') sendAdminMessage()
    else sendCoproMessage()
  }

  function handleNewConversation(conv: Conversation) {
    setShowNewModal(false)
    setTab('copro')
    // Ajouter ou mettre à jour la conversation dans la liste
    setConversations(prev => {
      const exists = prev.find(c => c.id === conv.id)
      if (exists) return prev
      return [conv, ...prev]
    })
    setSelectedConv(conv)
  }

  const showChat = tab === 'admin' || selectedConv !== null

  return (
    <div className="h-full flex flex-col">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Messages</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Échangez avec vos copropriétaires</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#374151] text-white text-sm font-medium rounded-xl hover:bg-[#374151]/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nouveau message
        </button>
      </div>

      <div className="flex-1 flex gap-5 min-h-0">
        {/* Colonne gauche — cachée sur mobile quand un chat est ouvert */}
        <div className={`w-full md:w-72 flex-shrink-0 flex-col gap-3 ${showChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex gap-2">
            <button onClick={() => { setTab('copro'); setSelectedConv(null) }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'copro' ? 'bg-[#374151] text-white' : 'bg-white text-coplio-text border border-border hover:bg-coplio-bg'}`}>
              <Users className="w-4 h-4" /> Copropriétaires
            </button>
            <button onClick={() => setTab('admin')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'admin' ? 'bg-[#374151] text-white' : 'bg-white text-coplio-text border border-border hover:bg-coplio-bg'}`}>
              <ShieldCheck className="w-4 h-4" /> Admin
            </button>
          </div>

          {tab === 'copro' && (
            <div className="coplio-card p-0 flex-1 overflow-y-auto">
              {loadingConvs ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                  <MessageSquare className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Aucune conversation</p>
                  <button onClick={() => setShowNewModal(true)}
                    className="mt-2 text-xs text-[#374151] hover:underline">
                    Démarrer un échange →
                  </button>
                </div>
              ) : conversations.map(conv => {
                const name = conv.coproprietaire
                  ? `${conv.coproprietaire.prenom} ${conv.coproprietaire.nom}`
                  : conv.sujet ?? 'Conversation'
                const initials = conv.coproprietaire
                  ? `${conv.coproprietaire.prenom[0]}${conv.coproprietaire.nom[0]}`
                  : '?'
                return (
                  <button key={conv.id} onClick={() => setSelectedConv(conv)}
                    className={`w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-coplio-bg transition-colors ${selectedConv?.id === conv.id ? 'bg-[#374151]/5 border-l-2 border-l-[#374151]' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#374151]/10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold text-[#374151]">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-coplio-text truncate">{name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(conv.derniere_activite).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {tab === 'admin' && (
            <div className="coplio-card flex-1 flex flex-col justify-center items-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#374151]/10 flex items-center justify-center mb-3">
                <ShieldCheck className="w-6 h-6 text-[#374151]" />
              </div>
              <p className="text-sm font-medium text-coplio-text">Support Coplio</p>
              <p className="text-xs text-muted-foreground mt-1">Échangez avec l&apos;équipe admin</p>
            </div>
          )}
        </div>

        {/* Zone de chat — cachée sur mobile quand aucun chat sélectionné */}
        <div className={`flex-1 coplio-card p-0 overflow-hidden flex-col min-h-0 ${showChat ? 'flex' : 'hidden md:flex'}`}>
          {!showChat ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-[#374151]/10 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-[#374151]" />
              </div>
              <p className="font-semibold text-coplio-text mb-1">Sélectionnez une conversation</p>
              <p className="text-sm text-muted-foreground mb-4">ou démarrez un nouvel échange</p>
              <button onClick={() => setShowNewModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#374151] text-white text-sm font-medium rounded-xl hover:bg-[#374151]/90 transition-colors">
                <Plus className="w-4 h-4" /> Nouveau message
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border flex-shrink-0">
                {selectedConv && (
                  <button onClick={() => setSelectedConv(null)} className="text-muted-foreground hover:text-coplio-text transition-colors mr-1">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <div className="w-9 h-9 bg-[#374151]/10 rounded-full flex items-center justify-center text-sm font-semibold text-[#374151] flex-shrink-0">
                  {tab === 'admin'
                    ? <ShieldCheck className="w-5 h-5" />
                    : selectedConv?.coproprietaire
                      ? `${selectedConv.coproprietaire.prenom[0]}${selectedConv.coproprietaire.nom[0]}`
                      : <Users className="w-5 h-5" />
                  }
                </div>
                <div>
                  <p className="font-semibold text-coplio-text text-sm">
                    {tab === 'admin'
                      ? 'Support Coplio Admin'
                      : selectedConv?.coproprietaire
                        ? `${selectedConv.coproprietaire.prenom} ${selectedConv.coproprietaire.nom}`
                        : selectedConv?.sujet ?? 'Conversation'}
                  </p>
                  <p className="text-xs text-muted-foreground">{tab === 'admin' ? 'Équipe administration' : 'Copropriétaire'}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {loadingMessages ? (
                  <div className="flex justify-center pt-8"><Loader2 className="w-5 h-5 animate-spin text-[#374151]" /></div>
                ) : tab === 'admin' ? (
                  adminMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageSquare className="w-10 h-10 text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground">Aucun message — démarrez la conversation avec l&apos;admin</p>
                    </div>
                  ) : adminMessages.map(msg => {
                    const isMe = msg.sender_type === 'client'
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[65%] rounded-2xl px-4 py-3 ${isMe ? 'bg-[#374151] text-white rounded-br-sm' : 'bg-coplio-bg border border-border text-coplio-text rounded-bl-sm'}`}>
                          {!isMe && <p className="text-xs font-semibold text-[#374151] mb-1">Coplio Admin</p>}
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
                      <p className="text-sm text-muted-foreground">Aucun message — envoyez le premier !</p>
                    </div>
                  ) : messages.map(msg => {
                    const isMe = msg.expediteur_id === userId
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[65%] rounded-2xl px-4 py-3 ${isMe ? 'bg-[#374151] text-white rounded-br-sm' : 'bg-coplio-bg border border-border text-coplio-text rounded-bl-sm'}`}>
                          {!isMe && msg.expediteur && (
                            <p className="text-xs font-semibold text-[#374151] mb-1">
                              {msg.expediteur.prenom} {msg.expediteur.nom}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{msg.contenu}</p>
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
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) } }}
                  placeholder="Écrire un message…"
                  className="flex-1 px-4 py-2.5 bg-coplio-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#374151]/20"
                />
                <button type="submit" disabled={sending || !input.trim()}
                  className="bg-[#374151] text-white px-4 py-2.5 rounded-xl hover:bg-[#374151]/90 transition-colors disabled:opacity-60 flex items-center gap-2 text-sm font-medium">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Envoyer
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {showNewModal && (
        <NewMessageModal
          onClose={() => setShowNewModal(false)}
          onCreated={handleNewConversation}
        />
      )}
    </div>
  )
}
