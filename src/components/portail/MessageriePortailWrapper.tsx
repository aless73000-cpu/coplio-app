'use client'

import { useState } from 'react'
import { MessagerieChat } from './MessagerieChat'
import { MessageCircle } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import type { Message } from '@/types'

interface ConversationItem {
  id: string
  sujet?: string
  derniere_activite: string
  messages: (Message & { expediteur?: { prenom?: string; nom?: string; role?: string } })[]
}

interface Props {
  userId: string
  conversations: ConversationItem[]
  cabinetId: string | null
  coproprieteId: string | null
}

export function MessageriePortailWrapper({ userId, conversations, cabinetId, coproprieteId }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(conversations[0]?.id ?? null)

  const selected = conversations.find((c) => c.id === selectedId) ?? null
  const messages = (selected?.messages ?? []).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  const showSidebar = conversations.length > 1

  return (
    <div className={`flex-1 flex gap-4 min-h-0 overflow-hidden ${showSidebar ? '' : 'flex-col'}`}>
      {showSidebar && (
        <div className="w-72 flex-shrink-0 coplio-card p-0 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-coplio-text">Conversations ({conversations.length})</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => {
              const isActive = conv.id === selectedId
              const lastMsg = [...(conv.messages ?? [])].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )[0]
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={`w-full text-left px-4 py-3 border-b border-border last:border-0 transition-colors ${
                    isActive ? 'bg-coplio-green-light' : 'hover:bg-coplio-bg'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isActive ? 'bg-coplio-green' : 'bg-coplio-bg'
                    }`}>
                      <MessageCircle className={`w-4 h-4 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium truncate ${isActive ? 'text-coplio-green' : 'text-coplio-text'}`}>
                        {conv.sujet || 'Message'}
                      </p>
                      {lastMsg && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{lastMsg.contenu}</p>
                      )}
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
          initialMessages={messages}
          conversation={selected ? { id: selected.id, sujet: selected.sujet } : null}
          cabinetId={cabinetId}
          coproprieteId={coproprieteId}
        />
      </div>
    </div>
  )
}
