'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessagerieChat } from './MessagerieChat'
import { MessageCircle, Loader2 } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface Conversation {
  id: string
  sujet?: string | null
  derniere_activite: string
}

interface Props {
  userId: string
}

export function MessageriePortailWrapper({ userId }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const loadConversations = useCallback(async () => {
    const res = await fetch('/api/portail/conversations')
    if (res.ok) {
      const data = await res.json()
      const convs: Conversation[] = Array.isArray(data) ? data : []
      setConversations(convs)
      if (convs.length > 0 && !selectedId) setSelectedId(convs[0].id)
    }
    setLoading(false)
  }, [selectedId])

  useEffect(() => { loadConversations() }, [loadConversations])

  function handleConversationCreated(id: string) {
    loadConversations()
    setSelectedId(id)
  }

  const showSidebar = conversations.length > 1

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#111827]" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden gap-3">
      {/* Mobile: onglets horizontaux scrollables */}
      {showSidebar && (
        <div className="flex-shrink-0 md:hidden flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedId(conv.id)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-sm font-medium transition-colors border ${
                conv.id === selectedId
                  ? 'bg-[#111827] text-white border-[#111827]'
                  : 'bg-white border-border text-coplio-text'
              }`}
            >
              {conv.sujet || 'Message au syndic'}
            </button>
          ))}
        </div>
      )}

      {/* Desktop: layout avec sidebar à gauche */}
      <div className={`flex-1 min-h-0 flex gap-4 overflow-hidden ${showSidebar ? 'md:flex-row' : ''}`}>
        {showSidebar && (
          <div className="hidden md:flex w-64 flex-shrink-0 coplio-card p-0 overflow-hidden flex-col">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-coplio-text">
                Conversations ({conversations.length})
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conv) => {
                const isActive = conv.id === selectedId
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={`w-full text-left px-4 py-3 border-b border-border last:border-0 transition-colors ${
                      isActive ? 'bg-slate-100' : 'hover:bg-coplio-bg'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isActive ? 'bg-[#111827]' : 'bg-coplio-bg'
                      }`}>
                        <MessageCircle className={`w-4 h-4 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium truncate ${isActive ? 'text-[#111827]' : 'text-coplio-text'}`}>
                          {conv.sujet || 'Message au syndic'}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatDateTime(conv.derniere_activite)}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <MessagerieChat
            userId={userId}
            conversationId={selectedId}
            onConversationCreated={handleConversationCreated}
          />
        </div>
      </div>
    </div>
  )
}
