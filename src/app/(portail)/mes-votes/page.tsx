import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MesVotesClient } from '@/components/portail/MesVotesClient'

export default async function MesVotes() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portail')

  const { data: profile } = await supabase
    .from('profiles')
    .select('lot:lots(copropriete_id)')
    .eq('id', user.id)
    .single()

  const coproprieteId = (profile?.lot as { copropriete_id?: string } | null)?.copropriete_id ?? null

  // Résoudre coproprietaires.id pour la détection "déjà voté"
  const admin = createAdminClient()
  const { data: copro } = await admin
    .from('coproprietaires')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  const { data: votes } = coproprieteId
    ? await admin
        .from('votes')
        .select('*, options:vote_options(*), reponses:vote_reponses(id, option_id, coproprietaire_id)')
        .eq('copropriete_id', coproprieteId)
        .eq('statut', 'ouvert')
        .order('date_fin', { ascending: true })
    : { data: [] }

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-coplio-text">Votes & consultations</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Participez aux décisions de votre copropriété</p>
      </div>
      <MesVotesClient
        userId={copro?.id ?? user.id}
        votes={(votes ?? []) as Parameters<typeof MesVotesClient>[0]['votes']}
      />
    </div>
  )
}
