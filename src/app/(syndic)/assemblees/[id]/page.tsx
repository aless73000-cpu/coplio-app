import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, MapPin, Video, Users } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { ConvocationButton } from '@/components/syndic/ConvocationButton'
import { ExportAGButton } from '@/components/syndic/ExportAGButton'
import { AgStatutButtons } from '@/components/syndic/AgStatutButtons'
import { AgResolutionsManager } from '@/components/syndic/AgResolutionsManager'
import { AgPVSection } from '@/components/syndic/AgPVSection'
import { getSignedDocumentUrl } from '@/lib/storage'
import type { AgStatus } from '@/types'

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  planifiee:             { label: 'Planifiée',             cls: 'bg-coplio-blue-bg text-coplio-blue' },
  convocations_envoyees: { label: 'Convoquée',             cls: 'badge-attention' },
  en_cours:              { label: 'En cours',              cls: 'bg-purple-50 text-purple-700' },
  terminee:              { label: 'Terminée',              cls: 'badge-a-jour' },
  annulee:               { label: 'Annulée',               cls: 'bg-coplio-bg text-muted-foreground' },
}

export default async function AssembléePage({ params }: { params: { id: string } }) {
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
  const { label: statusLabel, cls: statusCls } = STATUS_CONFIG[ag.status ?? 'planifiee'] ?? STATUS_CONFIG.planifiee
  const resolutions = (ag.resolutions ?? []).sort((a: { ordre: number }, b: { ordre: number }) => a.ordre - b.ordre)

  // PV document
  let pvNom: string | null = null
  let pvUrl: string | null = null
  if (ag.pv_document_id) {
    const { data: pvDoc } = await supabase
      .from('documents')
      .select('nom, storage_path, storage_bucket')
      .eq('id', ag.pv_document_id)
      .single()
    if (pvDoc) {
      pvNom = pvDoc.nom
      pvUrl = await getSignedDocumentUrl(pvDoc.storage_bucket ?? 'documents', pvDoc.storage_path)
    }
  }

  // L'AG est éditable si elle n'est pas terminée ni annulée
  const canEdit = ag.status !== 'terminee' && ag.status !== 'annulee'

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link href="/assemblees" className="text-muted-foreground hover:text-coplio-text transition-colors flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-coplio-text truncate">{ag.titre}</h1>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${statusCls}`}>
                {statusLabel}
              </span>
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              <Link href={`/coproprietes/${ag.copropriete?.id}`} className="hover:text-[#374151]">
                {ag.copropriete?.nom}
              </Link>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ExportAGButton
            titre={ag.titre ?? 'Assemblée générale'}
            dateAg={ag.date_ag}
            lieu={ag.lieu ?? undefined}
            coproprieteNom={ag.copropriete?.nom ?? undefined}
            statut={ag.status ?? ''}
            resolutions={resolutions as unknown as Parameters<typeof ExportAGButton>[0]['resolutions']}
          />
          {ag.status !== 'terminee' && ag.status !== 'annulee' && (
            <ConvocationButton
              agId={ag.id}
              status={ag.status ?? ''}
              convocationsEnvoyeesAt={ag.convocations_envoyees_at}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Résolutions */}
          <AgResolutionsManager
            agId={ag.id}
            initialResolutions={resolutions as unknown as Parameters<typeof AgResolutionsManager>[0]['initialResolutions']}
            canEdit={canEdit}
          />
        </div>

        {/* Colonne latérale */}
        <div className="space-y-4">
          {/* Infos */}
          <div className="coplio-card">
            <h3 className="font-semibold text-coplio-text mb-4">Informations</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs mb-0.5">Date et heure</dt>
                <dd className="font-medium text-coplio-text flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-[#374151] flex-shrink-0" />
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
                      <MapPin className="w-3.5 h-3.5 text-[#374151] flex-shrink-0" />
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

              {(ag.tantiemes_presents ?? 0) > 0 && (
                <div>
                  <dt className="text-muted-foreground text-xs mb-0.5">Tantièmes représentés</dt>
                  <dd className="font-medium text-coplio-text flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#374151] flex-shrink-0" />
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

          {/* Copropriété */}
          <div className="coplio-card">
            <h3 className="font-semibold text-coplio-text mb-3">Copropriété</h3>
            <Link
              href={`/coproprietes/${ag.copropriete?.id}`}
              className="text-sm text-[#374151] hover:underline"
            >
              {ag.copropriete?.nom}
            </Link>
            {ag.copropriete?.adresse && (
              <p className="text-xs text-muted-foreground mt-0.5">{ag.copropriete.adresse}</p>
            )}
          </div>

          {/* PV */}
          <div className="coplio-card">
            <AgPVSection agId={ag.id} pvNom={pvNom} pvUrl={pvUrl} />
          </div>

          {/* Changer statut */}
          {canEdit && (
            <div className="coplio-card">
              <AgStatutButtons agId={ag.id} status={ag.status as AgStatus} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
