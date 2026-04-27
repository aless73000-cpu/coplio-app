import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MessageCircle, Send } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import type { Message } from '@/types'

export default async function MesMessages() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('lot_id')
    .eq('id', user.id)
    .single()

  // Récupérer les conversations liées au profil
  const { data: conversations } = await supabase
    .from('conversations')
    .select('*, messages(*, expediteur:profiles(prenom, nom, role))')
    .eq('gestionnaire_id', user.id)
    .order('derniere_activite', { ascending: false })
    .limit(10)

  // Prendre la conversation active (la première ou la plus récente)
  const conversation = conversations?.[0]
  const messages = (conversation?.messages ?? []) as (Message & {
    expediteur?: { prenom?: string; nom?: string; role?: string }
  })[]

  return (
    <div className="flex flex-col h-screen pb-20">
      {/* Header */}
      <div className="bg-coplio-green px-6 pt-12 pb-4 text-white flex-shrink-0">
        <p className="text-white/70 text-sm mb-1">Messagerie</p>
        <h1 className="text-2xl font-bold">Mon syndic</h1>
        {conversation?.sujet && (
          <p className="text-white/70 text-sm mt-1">{conversation.sujet}</p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 bg-coplio-green-light rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-7 h-7 text-coplio-green" />
            </div>
            <p className="font-medium text-coplio-text">Aucun message</p>
            <p className="text-sm text-muted-foreground mt-1">
              Envoyez un message à votre syndic
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.expediteur_id === user.id
            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    isMine
                      ? 'bg-coplio-green text-white rounded-br-sm'
                      : 'bg-white border border-border text-coplio-text rounded-bl-sm'
                  }`}
                >
                  {!isMine && (
                    <p className="text-xs font-medium text-coplio-green mb-1">
                      {msg.expediteur?.prenom} {msg.expediteur?.nom}
                    </p>
                  )}
                  <p className="text-sm">{msg.contenu}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-muted-foreground'}`}>
                    {formatDateTime(msg.created_at)}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Zone de saisie */}
      <div className="flex-shrink-0 px-4 pb-4 bg-coplio-bg border-t border-border pt-3">
        <form className="flex gap-2">
          <input
            type="text"
            placeholder="Écrivez votre message..."
            className="flex-1 px-4 py-3 bg-white border border-border rounded-xl text-sm
                       focus:outline-none focus:ring-2 focus:ring-coplio-green focus:border-transparent"
          />
          <button
            type="submit"
            className="w-12 h-12 bg-coplio-green rounded-xl flex items-center justify-center
                       text-white hover:bg-coplio-green/90 transition-colors flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  )
}
