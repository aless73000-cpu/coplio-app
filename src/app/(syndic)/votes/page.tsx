import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { VotesClient } from '@/components/syndic/VotesClient'

export const metadata = { title: 'Votes en ligne' }

export default async function VotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()
  if (!profile?.cabinet_id) redirect('/onboarding')

  const [{ data: votes }, { data: coproprietes }] = await Promise.all([
    supabase
      .from('votes')
      .select('*, copropriete:coproprietes(id, nom), options:vote_options(*), reponses:vote_reponses(id, option_id, coproprietaire_id)')
      .eq('cabinet_id', profile.cabinet_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('coproprietes')
      .select('id, nom')
      .eq('cabinet_id', profile.cabinet_id)
      .order('nom'),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (
    <VotesClient
      initialVotes={(votes ?? []) as never}
      initialCoproprietes={coproprietes ?? []}
    />
  )
}
