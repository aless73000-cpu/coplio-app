'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Loader2 } from 'lucide-react'

interface Message {
  id: string
  contenu: string
  sender_email: string
  sender_type?: string
  created_at: string
  cabinet?: { id: string; nom: string }
}

interface Cabinet { id: string; nom: string }

interface Props {
  currentEmail: string
  cabinets: Cabinet[]
}

export function MessagesClient({ currentEmail, cabinets }: Props) {
  const [tab, setTab] = useState<'support' | 'interne'>('support')
  const [selectedCabinet, setSelectedCabinet] = useState<string>(cabinets[0]?.id ?? '')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    const url = tab === 'interne'
      ? '/api/admin/messages?type=interne'
      : `/api/admin/messages?type=support${selectedCabinet ? `&cabinet_id=${selectedCabinet}` : ''}`

    fetch(url).then(r => r.json()).then(data => {
      setMessages(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [tab, selectedCabinet])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!input.trim()) return
    setSending(true)
    const body: Record<string, string> = { type: tab, contenu: input.trim() }
    if (tab === 'support' && selectedCabinet) body.cabinet_id = selectedCabinet

    const res = await fetch('/api/admin/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const msg = await res.json()
      setMessages(prev => [...prev, msg])
      setInput('')
    }
    setSending(false)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-coplio-text">Messages</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Support clients & chat interne</p>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab('support')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'support' ? 'bg-[#111827] text-white' : 'bg-white text-coplio-text hover:bg-coplio-bg border border-border'
          }`}
        >
          Support clients
        </button>
        <button
          onClick={() => setTab('interne')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'interne' ? 'bg-[#111827] text-white' : 'bg-white text-coplio-text hover:bg-coplio-bg border border-border'
          }`}
        >
          Chat interne
        </button>
      </div>

      <div className="coplio-card flex flex-col" style={{ height: '520px' }}>
        {/* Sélecteur de cabinet (support uniquement) */}
        {tab === 'support' && (
          <div className="pb-3 mb-3 border-b border-border flex-shrink-0">
            {cabinets.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun client</p>
            ) : (
              <select
                value={selectedCabinet}
                onChange={e => setSelectedCabinet(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-coplio-bg border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
              >
                {cabinets.map(c => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-5 h-5 animate-spin text-[#111827]" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-sm">Aucun message</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMe = msg.sender_email === currentEmail
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                    isMe
                      ? 'bg-[#111827] text-white rounded-br-sm'
                      : 'bg-coplio-bg text-coplio-text rounded-bl-sm'
                  }`}>
                    {!isMe && (
                      <p className="text-xs font-medium mb-1 opacity-70">{msg.sender_email}</p>
                    )}
                    <p>{msg.contenu}</p>
                    <p className={`text-xs mt-1 ${isMe ? 'text-white/60' : 'text-muted-foreground'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2 pt-3 mt-3 border-t border-border flex-shrink-0">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={tab === 'interne' ? 'Message aux admins...' : 'Répondre au client...'}
            className="flex-1 px-3 py-2.5 text-sm bg-coplio-bg border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
          />
          <button
            onClick={send}
            disabled={sending || !input.trim()}
            className="bg-[#111827] text-white p-2.5 rounded-lg hover:bg-[#111827]/90 transition-colors disabled:opacity-60"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
