import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, MapPin, Video, Clock, Users, Check, X, Minus } from 'lucide-react'
import { formatDateTime, formatDate } from '@/lib/utils'

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  planifiee: { label: 'Planifiée', cls: 'bg-coplio-blue-bg text-coplio-blue' },
  convocations_envoyees: { label: 'Convoquée', cls: 'badge-attention' },
  en_cours: { label: 'En cours', cls: 'bg-purple-50 text-purple-700' },
  terminee: { label: 'Terminée', cls: 'badge-a-jour' },
  annulee: { label: 'Annulée', cls: 'bg-coplio-bg text-muted-foreground' },
}

const VOTE_TYPE_LABELS: Record<string, string> = {
  art_24: 'Art. 24 (majorité simple)',
  art_25: 'Art. 25 (majorité absolue)',
  art_26: 'Art. 26 (double majorité)',
  unanimite: 'Unanimité',
}

export default async function AssembleePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: ag } = await supabase
    .from('assemblees_generales')
    .select('*, copropriete:coproprietes(id, nom, adresse), resolutions:ag_resolutions(*)')
    .eq('id', params.id)
    .single()

  if (!ag) notFound()

  const date = new Date(ag.date_ag)
  const { label: statusLabel, cls: statusCls } = STATUS_CONFIG[ag.status] ?? STATUS_CONFIG.planifiee
  const resolutions = (ag.resolutions ?? []).sort((a: { ordre: number }, b: { ordre: number }) => a.ordre - b.ordre)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/assemblees" className="text-muted-foreground hover:text-coplio-text transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-coplio-text truncate">{ag.titre}</h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${statusCls}`}>
              {statusLabel}
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            <Link href={`/coproprietes/${ag.copropriete?.id}`} className="hover:text-coplio-green">
              {ag.copropriete?.nom}
            </Link>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Résolutions */}
          {resolutions.length > 0 && (
            <div className="coplio-card">
              <h2 className="font-semibold text-coplio-text mb-4">
                Résolutions ({resolutions.length})
              </h2>
              <div className="space-y-4">
                {resolutions.map((res: {
                  id: string
                  ordre: number
                  titre: string
                  description?: string
                  type_vote: string
                  voix_pour: number
                  voix_contre: number
                  voix_abstention: number
                  adoptee?: boolean
                }) => (
                  <div key={res.id} className="border border-border rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-foreground bg-coplio-bg px-2 py-0.5 rounded-full flex-shrink-0">
                          #{res.ordre}
                        </span>
                        <h3 className="font-medium text-coplio-text text-sm">{res.titre}</h3>
                      </div>
                      {res.adoptee !== null && res.adoptee !== undefined && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                          res.adoptee ? 'bg-coplio-green-light text-coplio-green' : 'bg-red-50 text-red-600'
                        }`}>
                          {res.adoptee ? 'Adoptée' : 'Rejetée'}
                        </span>
                      )}
                    </div>
                    {res.description && (
                      <p className="text-xs text-muted-foreground mb-3">{res.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-muted-foreground">{VOTE_TYPE_LABELS[res.type_vote] ?? res.type_vote}</span>
                      {(res.voix_pour + res.voix_contre + res.voix_abstention) > 0 && (
                        <div className="flex items-center gap-3 ml-auto">
                          <span className="flex items-center gap-1 text-coplio-green">
                            <Check className="w-3 h-3" /> {res.voix_pour}
                          </span>
                          <span className="flex items-center gap-1 text-red-500">
                            <X className="w-3 h-3" /> {res.voix_contre}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Minus className="w-3 h-3" /> {res.voix_abstention}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resolutions.length === 0 && (
            <div className="coplio-card text-center py-8">
              <p className="text-muted-foreground text-sm">Aucune résolution enregistrée</p>
            </div>
          )}
        </div>

        {/* Infos latérales */}
        <div className="space-y-4">
          <div className="coplio-card">
            <h3 className="font-semibold text-coplio-text mb-4">Informations</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs mb-0.5">Date et heure</dt>
                <dd className="font-medium text-coplio-text flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-coplio-green flex-shrink-0" />
                  {formatDate(ag.date_ag)}
                </dd>
                <dd className="text-muted-foreground text-xs mt-0.5 ml-5">
                  {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </dd>
              </div>

              <div>
                <dt className="text-muted-foreground text-xs mb-0.5">Lieu</dt>
                <dd className="font-medium text-coplio-text flex items-center gap-1.5">
                  {ag.est_visio ? (
                    <>
                      <Video className="w-3.5 h-3.5 text-coplio-blue flex-shrink-0" />
                      Visioconférence
                    </>
                  ) : ag.lieu ? (
                    <>
                      <MapPin className="w-3.5 h-3.5 text-coplio-green flex-shrink-0" />
                      {ag.lieu}
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-muted-foreground text-xs mb-0.5">Type</dt>
                <dd className="font-medium text-coplio-text capitalize">
                  {ag.type === 'ordinaire' ? 'AG Ordinaire' : 'AG Extraordinaire'}
                </dd>
              </div>

              {ag.tantiemes_presents > 0 && (
                <div>
                  <dt className="text-muted-foreground text-xs mb-0.5">Tantièmes représentés</dt>
                  <dd className="font-medium text-coplio-text flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-coplio-green flex-shrink-0" />
                    {ag.tantiemes_presents}
                    {ag.tantiemes_requis ? ` / ${ag.tantiemes_requis} requis` : ''}
                  </dd>
                </div>
              )}

              {ag.convocations_envoyees_at && (
                <div>
                  <dt className="text-muted-foreground text-xs mb-0.5">Convocations envoyées</dt>
                  <dd className="text-coplio-text text-xs">{formatDate(ag.convocations_envoyees_at)}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="coplio-card">
            <h3 className="font-semibold text-coplio-text mb-3">Copropriété</h3>
            <Link
              href={`/coproprietes/${ag.copropriete?.id}`}
              className="text-sm text-coplio-green hover:underline"
            >
              {ag.copropriete?.nom}
            </Link>
            {ag.copropriete?.adresse && (
              <p className="text-xs text-muted-foreground mt-0.5">{ag.copropriete.adresse}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
