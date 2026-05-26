'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Calendar, MapPin, Video, Clock, CheckCircle2, XCircle, MinusCircle, ThumbsUp, ThumbsDown, Minus, FileText, Lock } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { AssembleeGenerale, AgResolution, AgVote, VoteValue } from '@/types'
import { VOTE_TYPE_LABELS } from '@/types'
import { getSignedDocumentUrl } from '@/lib/storage'

const AG_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  planifiee:               { label: 'Planifiée',             color: 'bg-blue-50 text-blue-600' },
  convocations_envoyees:   { label: 'Convocation envoyée',   color: 'bg-coplio-amber-bg text-coplio-amber' },
  en_cours:                { label: 'En cours',              color: 'bg-slate-100 text-[#374151]' },
  terminee:                { label: 'Terminée',              color: 'bg-gray-100 text-gray-500' },
  annulee:                 { label: 'Annulée',               color: 'bg-coplio-red-bg text-coplio-red' },
}

async function voterResolution(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const resolutionId = formData.get('resolution_id') as string
  const valeur = formData.get('valeur') as VoteValue
  if (!resolutionId || !valeur) return

  // Résoudre coproprietaires.id depuis profile_id
  const admin = createAdminClient()
  const { data: copro } = await admin
    .from('coproprietaires')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!copro) return

  // Récupérer la copropriété concernée par cette résolution
  const { data: resolution } = await admin
    .from('ag_resolutions')
    .select('ag_id, assemblees_generales(copropriete_id)')
    .eq('id', resolutionId)
    .single()

  const coproprieteId = (resolution?.assemblees_generales as { copropriete_id?: string } | null)?.copropriete_id
  if (!coproprieteId) return

  // Art. 22 : les tantièmes du vote = SOMME de tous les lots actifs du copropriétaire
  // dans cette copropriété (multi-lots possible)
  const { data: lotsActifs } = await admin
    .from('v_lots_actifs')
    .select('tantiemes')
    .eq('coproprietaire_id', copro.id)
    .eq('copropriete_id', coproprieteId)

  const tantiemes = (lotsActifs ?? []).reduce((sum, l) => sum + (l.tantiemes ?? 0), 0)
  if (tantiemes === 0) return // Ce copropriétaire n'a aucun lot actif dans cette copropriété

  // Upsert : si déjà voté, on met à jour (conflit sur la nouvelle contrainte UNIQUE)
  await admin.from('ag_votes').upsert({
    resolution_id: resolutionId,
    coproprietaire_id: copro.id,
    lot_id: null, // nullable depuis Sprint 1 — vote par copropriétaire, pas par lot
    valeur,
    tantiemes,
    vote_a: new Date().toISOString(),
  }, { onConflict: 'resolution_id,coproprietaire_id' })

  // Recalculer les compteurs sur ag_resolutions à partir de tous les votes
  // Note Sprint 2 : le champ `adoptee` sera calculé par le MajorityEngine
  const { data: tousVotes } = await admin
    .from('ag_votes')
    .select('valeur, tantiemes')
    .eq('resolution_id', resolutionId)

  const compteurs = (tousVotes ?? []).reduce(
    (acc, v) => {
      if (v.valeur === 'pour') {
        acc.voix_pour += 1
        acc.tantiemes_pour += v.tantiemes ?? 0
      } else if (v.valeur === 'contre') {
        acc.voix_contre += 1
        acc.tantiemes_contre += v.tantiemes ?? 0
      } else {
        acc.voix_abstention += 1
      }
      return acc
    },
    { voix_pour: 0, voix_contre: 0, voix_abstention: 0, tantiemes_pour: 0, tantiemes_contre: 0 }
  )

  await admin
    .from('ag_resolutions')
    .update(compteurs)
    .eq('id', resolutionId)

  redirect('/mes-assemblees')
}

export default async function MesAssemblees() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portail')

  const { data: profile } = await supabase
    .from('profiles')
    .select('lot_id, lot:lots(copropriete_id, tantiemes)')
    .eq('id', user.id)
    .single()

  const coproprieteId = (profile?.lot as { copropriete_id?: string } | null)?.copropriete_id

  // Résoudre coproprietaires.id pour les votes
  const admin = createAdminClient()
  const { data: copro } = profile?.lot_id
    ? await admin.from('coproprietaires').select('id').eq('profile_id', user.id).single()
    : { data: null }

  if (!coproprieteId) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-coplio-text mb-6">Assemblées générales</h1>
        <div className="coplio-card text-center py-12">
          <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-coplio-text">Aucun lot associé</p>
          <p className="text-sm text-muted-foreground mt-1">Contactez votre syndic pour accéder à vos assemblées.</p>
        </div>
      </div>
    )
  }

  // AGs de la copropriété — pas de join FK (trop fragile), query séparée pour les PV
  const { data: ags } = await supabase
    .from('assemblees_generales')
    .select('*')
    .eq('copropriete_id', coproprieteId)
    .order('date_ag', { ascending: false })

  // Résolutions + votes de l'utilisateur
  const agIds = (ags ?? []).map((ag) => ag.id)
  const { data: resolutions } = agIds.length > 0
    ? await supabase.from('ag_resolutions').select('*').in('ag_id', agIds).order('ordre')
    : { data: [] }

  const resolutionIds = (resolutions ?? []).map((r) => r.id)
  const { data: mesVotes } = resolutionIds.length > 0 && copro
    ? await admin.from('ag_votes')
        .select('*')
        .in('resolution_id', resolutionIds)
        .eq('coproprietaire_id', copro.id)
    : { data: [] }

  const votesByResolution = Object.fromEntries(
    (mesVotes ?? []).map((v) => [v.resolution_id, v])
  )
  const resolutionsByAg = Object.groupBy(resolutions ?? [], (r) => r.ag_id)

  const agsAVenir  = (ags ?? []).filter((ag) =>
    ['planifiee', 'convocations_envoyees', 'en_cours'].includes(ag.status ?? ''))
  const agsPassees = (ags ?? []).filter((ag) =>
    ['terminee', 'annulee'].includes(ag.status ?? ''))

  // Récupérer les documents PV pour les AGs passées (query séparée)
  const pvDocIds = agsPassees
    .map((ag) => ag.pv_document_id)
    .filter((id): id is string => !!id)

  const { data: pvDocuments } = pvDocIds.length > 0
    ? await supabase
        .from('documents')
        .select('id, nom, storage_path, storage_bucket')
        .in('id', pvDocIds)
    : { data: [] }

  const pvDocMap: Record<string, { nom: string; storage_path: string; storage_bucket: string }> = {}
  for (const doc of pvDocuments ?? []) {
    pvDocMap[doc.id] = { nom: doc.nom, storage_path: doc.storage_path, storage_bucket: doc.storage_bucket ?? 'documents' }
  }

  // Signed URLs pour les PV (cachées 45 min)
  const pvUrlEntries = await Promise.all(
    agsPassees
      .filter(ag => ag.pv_document_id && pvDocMap[ag.pv_document_id])
      .map(async (ag) => {
        const doc = pvDocMap[ag.pv_document_id!]
        const url = await getSignedDocumentUrl(doc.storage_bucket, doc.storage_path)
        return url ? [ag.id, { url, nom: doc.nom }] as const : null
      })
  )
  const pvUrls: Record<string, { url: string; nom: string }> = Object.fromEntries(
    pvUrlEntries.filter((e): e is readonly [string, { url: string; nom: string }] => e !== null)
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-coplio-text">Assemblées générales</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {agsAVenir.length > 0
            ? `${agsAVenir.length} à venir · ${agsPassees.length} passée${agsPassees.length > 1 ? 's' : ''}`
            : 'Aucune AG planifiée pour le moment'}
        </p>
      </div>

      {/* AGs à venir */}
      {agsAVenir.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-coplio-text flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#374151]" /> À venir
          </h2>
          {agsAVenir.map((ag) => {
            const agResolutions = (resolutionsByAg[ag.id] ?? []) as AgResolution[]
            const peutVoter = ['convocations_envoyees', 'en_cours'].includes(ag.status ?? '')
            const statusInfo = AG_STATUS_LABELS[ag.status ?? ''] ?? { label: ag.status, color: 'bg-gray-100 text-gray-500' }

            return (
              <div key={ag.id} className="coplio-card border-[#374151]/20">
                {/* Header AG */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-[#374151]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-coplio-text text-base sm:text-lg leading-snug">{ag.titre}</h3>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(ag.date_ag).toLocaleDateString('fr-FR', {
                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                          })} à {new Date(ag.date_ag).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {ag.lieu && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {ag.lieu}
                          </span>
                        )}
                        {ag.est_visio && ag.lien_visio && (
                          <a href={ag.lien_visio} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[#374151] hover:underline">
                            <Video className="w-3.5 h-3.5" /> Rejoindre en visio
                          </a>
                        )}
                      </div>
                      {ag.date_limite_vote && (
                        <p className="text-xs text-coplio-amber mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Vote possible jusqu&apos;au {formatDate(ag.date_limite_vote)}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full self-start sm:flex-shrink-0 ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                {/* Résolutions */}
                {agResolutions.length === 0 ? (
                  <div className="bg-coplio-bg rounded-xl p-4 text-center">
                    <p className="text-sm text-muted-foreground">L&apos;ordre du jour n&apos;a pas encore été publié.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-coplio-text">
                      Ordre du jour — {agResolutions.length} résolution{agResolutions.length > 1 ? 's' : ''}
                    </p>
                    {agResolutions.map((res: AgResolution, idx: number) => {
                      const monVote = votesByResolution[res.id] as AgVote | undefined
                      return (
                        <ResolutionCard
                          key={res.id}
                          resolution={res}
                          index={idx + 1}
                          monVote={monVote}
                          peutVoter={peutVoter}
                          voterAction={voterResolution}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Aucune AG */}
      {agsAVenir.length === 0 && agsPassees.length === 0 && (
        <div className="coplio-card text-center py-16">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-7 h-7 text-[#374151]" />
          </div>
          <p className="font-medium text-coplio-text">Aucune assemblée générale</p>
          <p className="text-sm text-muted-foreground mt-1">Votre syndic n&apos;a pas encore planifié d&apos;AG.</p>
        </div>
      )}

      {/* AGs passées */}
      {agsPassees.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Passées
          </h2>
          {agsPassees.map((ag) => {
            const agResolutions = (resolutionsByAg[ag.id] ?? []) as AgResolution[]
            const statusInfo = AG_STATUS_LABELS[ag.status ?? ''] ?? { label: ag.status, color: 'bg-gray-100 text-gray-500' }
            const pvEntry = pvUrls[ag.id]
            return (
              <div key={ag.id} className="coplio-card">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${pvEntry ? 'bg-slate-100' : 'bg-coplio-bg'}`}>
                      <FileText className={`w-5 h-5 ${pvEntry ? 'text-[#374151]' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-coplio-text truncate">{ag.titre}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ag.date_ag).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {agResolutions.length > 0 && ` · ${agResolutions.length} résolution${agResolutions.length > 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    {pvEntry && (
                      <a
                        href={pvEntry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={pvEntry.nom}
                        className="flex items-center gap-1 text-xs font-medium text-[#374151] bg-slate-100 px-2.5 py-1 rounded-full hover:bg-[#374151] hover:text-white transition-colors"
                      >
                        <FileText className="w-3 h-3" /> Télécharger le PV
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Carte résolution avec vote ─────────────────────────────── */
function ResolutionCard({
  resolution, index, monVote, peutVoter, voterAction,
}: {
  resolution: AgResolution
  index: number
  monVote?: AgVote
  peutVoter: boolean
  voterAction: (fd: FormData) => Promise<void>
}) {
  const total = resolution.voix_pour + resolution.voix_contre + resolution.voix_abstention
  const pctPour = total > 0 ? Math.round((resolution.voix_pour / total) * 100) : 0

  return (
    <div className={`rounded-xl border p-4 ${monVote ? 'border-[#374151]/30 bg-slate-100/20' : 'border-border bg-coplio-bg'}`}>
      {/* Title + description — full width */}
      <div className="flex items-start gap-2 mb-3">
        <span className="text-xs font-bold text-muted-foreground bg-white border border-border rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
          {index}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-coplio-text text-sm leading-snug">{resolution.titre}</h4>
          {resolution.description && (
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">{resolution.description}</p>
          )}
          <span className="text-[10px] text-muted-foreground bg-white border border-border px-2 py-0.5 rounded-full">
            {VOTE_TYPE_LABELS[resolution.type_vote]}
          </span>
        </div>
      </div>

      {/* Vote row — below title on all screens */}
      {monVote ? (
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
            monVote.valeur === 'pour' ? 'bg-[#374151] text-white' :
            monVote.valeur === 'contre' ? 'bg-coplio-red text-white' :
            'bg-gray-200 text-gray-600'
          }`}>
            {monVote.valeur === 'pour' && <ThumbsUp className="w-3 h-3" />}
            {monVote.valeur === 'contre' && <ThumbsDown className="w-3 h-3" />}
            {monVote.valeur === 'abstention' && <Minus className="w-3 h-3" />}
            {monVote.valeur === 'pour' ? 'Pour' : monVote.valeur === 'contre' ? 'Contre' : 'Abstention'}
          </span>
          {peutVoter && (
            <form action={voterAction}>
              <input type="hidden" name="resolution_id" value={resolution.id} />
              <input type="hidden" name="valeur" value={monVote.valeur === 'pour' ? 'contre' : 'pour'} />
              <button type="submit" className="text-[10px] text-muted-foreground hover:text-coplio-text underline">
                Modifier
              </button>
            </form>
          )}
        </div>
      ) : peutVoter ? (
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          {(['pour', 'abstention', 'contre'] as VoteValue[]).map((val) => (
            <form key={val} action={voterAction} className="flex-1 sm:flex-none">
              <input type="hidden" name="resolution_id" value={resolution.id} />
              <input type="hidden" name="valeur" value={val} />
              <button
                type="submit"
                title={val === 'pour' ? 'Pour' : val === 'contre' ? 'Contre' : 'Abstention'}
                className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  val === 'pour'
                    ? 'border-[#374151] text-[#374151] hover:bg-[#374151] hover:text-white'
                    : val === 'contre'
                    ? 'border-coplio-red text-coplio-red hover:bg-coplio-red hover:text-white'
                    : 'border-gray-300 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {val === 'pour' && <ThumbsUp className="w-3.5 h-3.5" />}
                {val === 'contre' && <ThumbsDown className="w-3.5 h-3.5" />}
                {val === 'abstention' && <Minus className="w-3.5 h-3.5" />}
                <span>{val === 'pour' ? 'Pour' : val === 'contre' ? 'Contre' : 'Abstention'}</span>
              </button>
            </form>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t border-border/50">
          <Lock className="w-3 h-3" /> Vote non ouvert
        </div>
      )}

      {/* Résultats si votes existants */}
      {total > 0 && (
        <div className="mt-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <CheckCircle2 className="w-3 h-3 text-[#374151]" />
            <span>{resolution.voix_pour} pour</span>
            <XCircle className="w-3 h-3 text-coplio-red ml-1" />
            <span>{resolution.voix_contre} contre</span>
            <MinusCircle className="w-3 h-3 text-gray-400 ml-1" />
            <span>{resolution.voix_abstention} abstention{resolution.voix_abstention > 1 ? 's' : ''}</span>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden flex">
            <div className="bg-[#374151] h-full" style={{ width: `${pctPour}%` }} />
            <div className="bg-gray-300 h-full" style={{ width: `${total > 0 ? Math.round((resolution.voix_abstention / total) * 100) : 0}%` }} />
            <div className="bg-coplio-red h-full flex-1" />
          </div>
        </div>
      )}
    </div>
  )
}
