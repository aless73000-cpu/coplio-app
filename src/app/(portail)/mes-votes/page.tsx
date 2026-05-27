import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Vote, CheckCircle2 } from 'lucide-react'
import { MesVotesClient } from '@/components/portail/MesVotesClient'

export default async function MesVotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portail')

  const admin = createAdminClient()

  // Récupérer coproprietaire_id et copropriete_id via profile -> lot -> copropriete
  const [
    { data: coproRecord },
    { data: profile },
  ] = await Promise.all([
    admin.from('coproprietaires').select('id').eq('profile_id', user.id).single(),
    admin.from('profiles').select('lot:lots(copropriete_id)').eq('id', user.id).single(),
  ])

  const coproprieteId = (profile?.lot as { copropriete_id?: string } | null)?.copropriete_id ?? null
  const coproprietaireId = coproRecord?.id ?? null

  if (!coproprieteId || !coproprietaireId) {
    return (
      <div className="max-w-2xl mx-auto py-4">
        <h1 className="text-2xl font-bold text-coplio-text mb-1">Votes en ligne</h1>
        <p className="text-muted-foreground text-sm mb-8">Consultations organisées par votre syndic</p>
        <div className="coplio-card text-center py-16">
          <Vote className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-medium text-coplio-text">Aucun lot associé</p>
          <p className="text-sm text-muted-foreground mt-1">Contactez votre syndic pour configurer votre accès.</p>
        </div>
      </div>
    )
  }

  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const now = new Date().toISOString()

  const [{ data: openVotes }, { data: closedVotes }] = await Promise.all([
    admin
      .from('votes')
      .select('id, titre, description, date_debut, date_fin, options:vote_options(*), reponses:vote_reponses(*)')
      .eq('copropriete_id', coproprieteId)
      .eq('statut', 'ouvert')
      .gte('date_fin', now)
      .order('date_fin', { ascending: true }),
    admin
      .from('votes')
      .select('id, titre, description, date_debut, date_fin, options:vote_options(*), reponses:vote_reponses(*)')
      .eq('copropriete_id', coproprieteId)
      .or(`statut.eq.clos,date_fin.lt.${now}`)
      .gte('date_fin', threeMonthsAgo.toISOString())
      .order('date_fin', { ascending: false })
      .limit(10),
  ])

  const isEmpty = (openVotes ?? []).length === 0 && (closedVotes ?? []).length === 0

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-coplio-text">Votes en ligne</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Consultations organisées par votre syndic</p>
      </div>

      {/* Votes ouverts */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Votes en cours
          {(openVotes ?? []).length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
              {openVotes!.length}
            </span>
          )}
        </h2>
        {(openVotes ?? []).length === 0 ? (
          <div className="coplio-card text-center py-10">
            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-coplio-text">Aucun vote en cours</p>
            <p className="text-xs text-muted-foreground mt-1">
              Votre syndic vous notifiera lors d&apos;une nouvelle consultation.
            </p>
          </div>
        ) : (
          <MesVotesClient
            userId={coproprietaireId}
            votes={openVotes as Parameters<typeof MesVotesClient>[0]['votes']}
          />
        )}
      </section>

      {/* Résultats des votes clos */}
      {(closedVotes ?? []).length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Résultats récents
          </h2>
          <MesVotesClient
            userId={coproprietaireId}
            votes={closedVotes as Parameters<typeof MesVotesClient>[0]['votes']}
          />
        </section>
      )}

      {isEmpty && (
        <div className="coplio-card text-center py-16">
          <Vote className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-medium text-coplio-text">Aucune consultation disponible</p>
          <p className="text-sm text-muted-foreground mt-1">
            Votre syndic n&apos;a pas encore ouvert de vote en ligne.
          </p>
        </div>
      )}
    </div>
  )
}
