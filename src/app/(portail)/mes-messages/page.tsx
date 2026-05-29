import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MessageriePortailWrapper } from '@/components/portail/MessageriePortailWrapper'

export const metadata: Metadata = { title: 'Messagerie' }

export default async function MesMessages() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portail')

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-full">
      <div className="mb-3 flex-shrink-0">
        <h1 className="text-2xl font-bold text-coplio-text">Messagerie</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Échangez avec votre syndic</p>
      </div>
      <div className="flex-1 min-h-0 flex">
        <MessageriePortailWrapper userId={user.id} />
      </div>
    </div>
  )
}
