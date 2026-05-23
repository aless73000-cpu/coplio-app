'use client'

import { useState, useEffect, useRef } from 'react'
import { Bot, User, Send, Loader2, MessageCircle } from 'lucide-react'

interface Copropriete { id: string; nom: string }
interface ChatMessage  { role: 'user' | 'assistant'; content: string }

interface Props {
  coproprietes: Copropriete[]
  coproprieteId: string
  onCoproprieteChange: (id: string) => void
}

const SUGGESTIONS = [
  'Quelles copropriétés ont des impayés importants ?',
  "Résume-moi l'état de mon portefeuille",
  'Quels sinistres nécessitent une attention urgente ?',
  'Comment améliorer mon taux de recouvrement ?',
]

export function IaChat({ coproprietes, coproprieteId, onCoproprieteChange }: Props) {
  const [messages,    setMessages]    = useState<ChatMessage[]>([])
  const [input,       setInput]       = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleChat(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || chatLoading) return
    const userMsg: ChatMessage = { role: 'user', content: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setChatLoading(true)
    try {
      const res = await fetch('/api/ia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, copropriete_id: coproprieteId }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message ?? data.error ?? 'Erreur inattendue',
      }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erreur de connexion au serveur IA.' }])
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-5 gap-6">
      {/* Panneau gauche */}
      <div className="col-span-2 space-y-4">
        <div className="coplio-card">
          <p className="text-sm font-semibold text-coplio-text mb-1">Contexte</p>
          <p className="text-xs text-muted-foreground mb-3">
            L&apos;IA connaît vos données : copropriétés, impayés, sinistres, AG…
          </p>
          <label className="block text-xs font-medium text-coplio-text mb-1.5">
            Copropriété focus (optionnel)
          </label>
          <select
            value={coproprieteId}
            onChange={e => onCoproprieteChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green bg-white"
          >
            <option value="">Toutes les copropriétés</option>
            {coproprietes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>

        <div className="coplio-card">
          <p className="text-sm font-semibold text-coplio-text mb-2">Suggestions</p>
          <div className="space-y-1.5">
            {SUGGESTIONS.map(q => (
              <button
                key={q}
                onClick={() => setInput(q)}
                className="w-full text-left text-xs text-muted-foreground hover:text-coplio-green hover:bg-coplio-green-light px-2.5 py-2 rounded-lg transition-colors border border-transparent hover:border-coplio-green/20"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="w-full text-xs text-muted-foreground border border-border rounded-lg py-2 hover:bg-coplio-bg transition-colors"
          >
            Effacer la conversation
          </button>
        )}
      </div>

      {/* Panneau droit — chat */}
      <div className="col-span-3 flex flex-col min-h-[550px]">
        <div className="coplio-card flex flex-col flex-1">
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[400px] max-h-[450px]">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Bonjour ! Je suis votre assistant IA.</p>
                  <p className="text-xs mt-1">Posez-moi des questions sur votre portefeuille.</p>
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 bg-coplio-green-light rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-coplio-green" />
                    </div>
                  )}
                  <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-coplio-green text-white rounded-tr-sm'
                      : 'bg-coplio-bg text-coplio-text rounded-tl-sm'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 bg-coplio-green rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </div>
              ))
            )}
            {chatLoading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 bg-coplio-green-light rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-coplio-green" />
                </div>
                <div className="bg-coplio-bg rounded-2xl rounded-tl-sm px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleChat} className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Posez une question sur vos copropriétés..."
              className="flex-1 px-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-coplio-green"
            />
            <button
              type="submit"
              disabled={chatLoading || !input.trim()}
              className="flex items-center gap-1.5 bg-coplio-green text-white px-4 py-2.5 rounded-xl hover:bg-coplio-green/90 transition-colors disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
