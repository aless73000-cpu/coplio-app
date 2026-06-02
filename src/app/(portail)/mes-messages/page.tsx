import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MessageriePortailWrapper } from '@/components/portail/MessageriePortailWrapper'
import { LocataireThread } from '@/components/portail/LocataireThread'

export const metadata: Metadata = { title: 'Messagerie' }

export default async function MesMessages() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portail')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  // Le locataire échange UNIQUEMENT avec son propriétaire (pas le syndic)
  if (profile?.role === 'tenant') {
    return (
      <div className="max-w-2xl mx-auto flex flex-col h-full">
        <div className="mb-3 flex-shrink-0">
          <h1 className="text-2xl font-bold text-coplio-text">Messagerie</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Échangez avec votre propriétaire</p>
        </div>
        <LocataireThread otherLabel="votre propriétaire" />
      </div>
    )
  }

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
