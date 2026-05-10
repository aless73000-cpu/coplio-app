import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SyndicMessages } from '@/components/syndic/SyndicMessages'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single()
  if (!profile?.cabinet_id) redirect('/onboarding')

  const admin = createAdminClient()

  // Conversations avec les copropriétaires
  const { data: conversations } = await admin
    .from('conversations')
    .select(`
      id, sujet, derniere_activite,
      coproprietaire:coproprietaires(prenom, nom)
    `)
    .eq('cabinet_id', profile.cabinet_id)
    .order('derniere_activite', { ascending: false })

  const convs = (conversations ?? []).map((c) => ({
    id: c.id,
    sujet: c.sujet,
    derniere_activite: c.derniere_activite,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    coproprietaire: Array.isArray(c.coproprietaire) ? c.coproprietaire[0] : (c.coproprietaire as any),
  }))

  return (
    <div className="flex flex-col h-full">
      <SyndicMessages
        userId={user.id}
        cabinetId={profile.cabinet_id}
        currentEmail={user.email!}
        initialConversations={convs}
      />
    </div>
  )
}
