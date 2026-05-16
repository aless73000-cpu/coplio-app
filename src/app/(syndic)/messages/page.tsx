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
  // coproprietaire_id référence profiles.id
  const { data: conversations } = await admin
    .from('conversations')
    .select('id, sujet, derniere_activite, coproprietaire_id')
    .eq('cabinet_id', profile.cabinet_id)
    .order('derniere_activite', { ascending: false })

  // Récupérer les noms en requête séparée (plus robuste que FK join)
  const allIds = (conversations ?? []).map((c) => c.coproprietaire_id).filter(Boolean) as string[]
  const coproIds = allIds.filter((id, i) => allIds.indexOf(id) === i)
  const { data: coproProfiles } = coproIds.length > 0
    ? await admin.from('profiles').select('id, prenom, nom').in('id', coproIds)
    : { data: [] }
  const coproMap = Object.fromEntries((coproProfiles ?? []).map((p) => [p.id, p]))

  const convs = (conversations ?? []).map((c) => ({
    id: c.id,
    sujet: c.sujet,
    derniere_activite: c.derniere_activite,
    coproprietaire: c.coproprietaire_id ? coproMap[c.coproprietaire_id] ?? null : null,
  }))

  return (
    <div className="flex flex-col h-full">
      <SyndicMessages
        userId={user.id}
        cabinetId={profile.cabinet_id}
        currentEmail={user.email!}
        initialConversations={convs as unknown as Parameters<typeof SyndicMessages>[0]['initialConversations']}
      />
    </div>
  )
}
