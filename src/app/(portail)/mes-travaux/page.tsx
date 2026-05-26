'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Wrench, Plus, X, AlertTriangle, Clock,
  HardHat, Euro, Vote, CheckCircle2,
} from 'lucide-react'
import { formatDate, formatEuro } from '@/lib/utils'
import type { Sinistre } from '@/types'
import { MesVotesClient } from '@/components/portail/MesVotesClient'
import { SinistreFormClient } from '@/components/portail/SinistreFormClient'
import { SinistreCard } from '@/components/portail/SinistreCard'

const TYPE_OPTIONS = [
  { value: 'degat_eaux', label: 'Dégât des eaux' },
  { value: 'infiltration', label: 'Infiltration / humidité' },
  { value: 'electricite', label: 'Problème électrique' },
  { value: 'ascenseur', label: 'Ascenseur en panne' },
  { value: 'parties_communes', label: 'Parties communes' },
  { value: 'nuisance', label: 'Nuisance / trouble du voisinage' },
  { value: 'securite', label: 'Sécurité (serrure, porte...)' },
  { value: 'autre', label: 'Autre problème' },
]

const TRAVAUX_STATUT_LABELS: Record<string, string> = {
  demande: 'Demande',
  devis: 'Devis en cours',
  vote: 'Vote AG requis',
  commande: 'Commandé',
  realisation: 'En cours',
  reception: 'Réception',
  archive: 'Archivé',
}

const TRAVAUX_STATUT_COLORS: Record<string, string> = {
  demande: 'bg-gray-100 text-gray-600',
  devis: 'bg-blue-50 text-blue-600',
  vote: 'bg-purple-50 text-purple-600',
  commande: 'bg-coplio-amber-bg text-coplio-amber',
  realisation: 'bg-slate-100 text-[#374151]',
  reception: 'bg-slate-100 text-[#374151]',
  archive: 'bg-gray-100 text-gray-400',
}

const TRAVAUX_PRIORITE_COLORS: Record<string, { dot: string; label: string }> = {
  urgente: { dot: 'bg-coplio-red', label: 'Urgente' },
  haute: { dot: 'bg-coplio-amber', label: 'Haute' },
  normale: { dot: 'bg-blue-400', label: 'Normale' },
  basse: { dot: 'bg-gray-300', label: 'Basse' },
}

async function signalerProbleme(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const titre = formData.get('titre') as string
  const description = formData.get('description') as string
  const type = formData.get('type') as string
  const urgence = formData.get('urgence') === 'on'

  if (!titre?.trim() || !description?.trim()) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('lot_id, prenom, nom, cabinet_id, lot:lots(copropriete_id)')
    .eq('id', user.id)
    .single()

  if (!profile?.lot_id || !profile.cabinet_id) return

  const coproprieteId = (profile.lot as { copropriete_id?: string } | null)?.copropriete_id
  const now = new Date()
  const reference = `SIN-${now.getFullYear()}-${Math.floor(Math.random() * 90000) + 10000}`
  const titreComplet = `[${TYPE_OPTIONS.find(t => t.value === type)?.label ?? type}] ${titre}`

  const { data: sinistre } = await supabase.from('sinistres').insert({
    titre: titreComplet,
    description,
    status: urgence ? 'urgence' : 'signale',
    reference,
    copropriete_id: coproprieteId!,
    cabinet_id: profile.cabinet_id,
    lots_concernes: [profile.lot_id],
    date_sinistre: now.toISOString().split('T')[0],
  }).select('id').single()

  // createAdminClient est utilisé ici uniquement pour contourner les RLS
  // sur les tables notifications et documents (INSERT inter-cabinets non couvert).
  // L'utilisateur est déjà authentifié et son lot_id/cabinet_id vérifiés
  // via le client normal ci-dessus — l'admin n'est appelé qu'après ces checks.
  if (sinistre?.id) {
    const admin = createAdminClient()
    const { data: syndics } = await admin
      .from('profiles')
      .select('id')
      .eq('cabinet_id', profile.cabinet_id)
      .neq('role', 'owner_resident')

    if (syndics && syndics.length > 0) {
      await admin.from('notifications').insert(
        syndics.map((s: { id: string }) => ({
          user_id: s.id,
          cabinet_id: profile.cabinet_id,
          type: urgence ? 'urgent' : 'info',
          titre: urgence
            ? `⚠️ Urgence signalée par ${profile.prenom} ${profile.nom}`
            : `Nouveau signalement : ${titreComplet}`,
          message: description,
          lien: `/sinistres/${sinistre.id}`,
          sinistre_id: sinistre.id,
          lu: false,
        }))
      )
    }
  }

  const photos = formData.getAll('photos') as File[]
  const validPhotos = photos.filter(f => f.size > 0)
  if (sinistre?.id && validPhotos.length > 0) {
    const adminForPhotos = createAdminClient()
    for (const photo of validPhotos.slice(0, 5)) {
      const ext = photo.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const path = `sinistres/${sinistre.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const bytes = await photo.arrayBuffer()
      const { error: uploadError } = await adminForPhotos.storage
        .from('documents')
        .upload(path, bytes, { contentType: photo.type, upsert: false })
      if (!uploadError) {
        await adminForPhotos.from('documents').insert({
          cabinet_id: profile.cabinet_id,
          copropriete_id: coproprieteId,
          sinistre_id: sinistre.id,
          nom: photo.name,
          type_mime: photo.type,
          taille_bytes: photo.size,
          storage_path: path,
          storage_bucket: 'documents',
          categorie: 'sinistre',
          visible_coproprietaires: true,
          upload_par: user.id,
        })
      }
    }
  }

  redirect('/mes-travaux')
}

export default async function MesTravaux({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; nouveau?: string }>
}) {
  const params = await searchParams
  const activeTab = params.tab === 'batiment' ? 'batiment' : params.tab === 'votes' ? 'votes' : 'demandes'
  const showForm = params.nouveau === '1'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portail')

  const { data: profile } = await supabase
    .from('profiles')
    .select('lot_id, lot:lots(copropriete_id)')
    .eq('id', user.id)
    .single()

  const coproprieteId = (profile?.lot as { copropriete_id?: string } | null)?.copropriete_id

  const admin = createAdminClient()

  const [
    { data: sinistres },
    { data: travauxBatiment },
    { data: votes },
    { data: copro },
  ] = await Promise.all([
    supabase
      .from('sinistres')
      .select('*, copropriete:coproprietes(nom)')
      .contains('lots_concernes', [profile?.lot_id ?? ''])
      .order('created_at', { ascending: false }),
    coproprieteId
      ? supabase
          .from('travaux')
          .select('id, titre, description, statut, priorite, montant_estime, created_at')
          .eq('copropriete_id', coproprieteId)
          .neq('statut', 'archive')
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    coproprieteId
      ? admin
          .from('votes')
          .select('*, options:vote_options(*), reponses:vote_reponses(id, option_id, coproprietaire_id)')
          .eq('copropriete_id', coproprieteId)
          .eq('statut', 'ouvert')
          .order('date_fin', { ascending: true })
      : Promise.resolve({ data: [] }),
    admin
      .from('coproprietaires')
      .select('id')
      .eq('profile_id', user.id)
      .maybeSingle(),
  ])

  const enCours = (sinistres ?? []).filter((s) => s.status !== 'cloture')
  const clotures = (sinistres ?? []).filter((s) => s.status === 'cloture')
  const votesOuverts = votes ?? []

  // Récupérer les photos de tous les sinistres en une seule requête
  const sinistreIds = (sinistres ?? []).map((s) => s.id)
  const { data: photosDocs } = sinistreIds.length > 0
    ? await admin
        .from('documents')
        .select('id, sinistre_id, storage_path, storage_bucket, nom')
        .in('sinistre_id', sinistreIds)
        .eq('categorie', 'sinistre')
        .eq('visible_coproprietaires', true)
        .order('created_at', { ascending: true })
    : { data: [] }

  // Map sinistre_id → photos avec URLs publiques
  const photosBySinistre: Record<string, string[]> = {}
  for (const doc of (photosDocs ?? [])) {
    if (!doc.sinistre_id || !doc.storage_path) continue
    const { data: urlData } = admin.storage.from(doc.storage_bucket ?? 'documents').getPublicUrl(doc.storage_path)
    if (!photosBySinistre[doc.sinistre_id]) photosBySinistre[doc.sinistre_id] = []
    photosBySinistre[doc.sinistre_id].push(urlData.publicUrl)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Travaux & sinistres</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {enCours.length} demande{enCours.length > 1 ? 's' : ''} en cours
            {(travauxBatiment?.length ?? 0) > 0 && ` · ${travauxBatiment?.length} chantier${(travauxBatiment?.length ?? 0) > 1 ? 's' : ''}`}
            {votesOuverts.length > 0 && ` · ${votesOuverts.length} vote${votesOuverts.length > 1 ? 's' : ''} ouvert${votesOuverts.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <a
          href="/mes-travaux?nouveau=1"
          className="flex items-center justify-center gap-2 bg-[#374151] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#374151]/90 transition-colors sm:flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Signaler un problème
        </a>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-border rounded-xl p-1 w-full sm:w-fit overflow-x-auto no-scrollbar">
        <a
          href="/mes-travaux"
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'demandes'
              ? 'bg-[#374151] text-white shadow-sm'
              : 'text-muted-foreground hover:text-coplio-text hover:bg-coplio-bg'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          Mes demandes
          {enCours.length > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
              activeTab === 'demandes' ? 'bg-white/20 text-white' : 'bg-coplio-amber-bg text-coplio-amber'
            }`}>
              {enCours.length}
            </span>
          )}
        </a>
        <a
          href="/mes-travaux?tab=batiment"
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'batiment'
              ? 'bg-[#374151] text-white shadow-sm'
              : 'text-muted-foreground hover:text-coplio-text hover:bg-coplio-bg'
          }`}
        >
          <HardHat className="w-3.5 h-3.5" />
          Bâtiment
          {(travauxBatiment?.length ?? 0) > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
              activeTab === 'batiment' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
            }`}>
              {travauxBatiment?.length}
            </span>
          )}
        </a>
        <a
          href="/mes-travaux?tab=votes"
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'votes'
              ? 'bg-[#374151] text-white shadow-sm'
              : 'text-muted-foreground hover:text-coplio-text hover:bg-coplio-bg'
          }`}
        >
          <Vote className="w-3.5 h-3.5" />
          Votes
          {votesOuverts.length > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
              activeTab === 'votes' ? 'bg-white/20 text-white' : 'bg-purple-50 text-purple-600'
            }`}>
              {votesOuverts.length}
            </span>
          )}
        </a>
      </div>

      {/* ── Tab: Mes demandes ─────────────────────────────────── */}
      {activeTab === 'demandes' && (
        <div className="space-y-6">
          {/* Formulaire de signalement */}
          {showForm && (
            <div className="coplio-card border-[#374151]/30 bg-slate-100/20">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#374151] rounded-xl flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-coplio-text">Signaler un problème</h2>
                    <p className="text-xs text-muted-foreground">Votre syndic sera notifié immédiatement</p>
                  </div>
                </div>
                <a href="/mes-travaux" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/80 transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </a>
              </div>

              <SinistreFormClient action={signalerProbleme} />
            </div>
          )}

          {/* Empty state */}
          {(!sinistres || sinistres.length === 0) && !showForm && (
            <div className="coplio-card text-center py-16">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Wrench className="w-7 h-7 text-[#374151]" />
              </div>
              <p className="font-medium text-coplio-text">Aucune demande en cours</p>
              <p className="text-sm text-muted-foreground mt-1">Vous n&apos;avez pas de dossier vous concernant.</p>
              <a
                href="/mes-travaux?nouveau=1"
                className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-[#374151] hover:underline"
              >
                <Plus className="w-4 h-4" /> Signaler un premier problème
              </a>
            </div>
          )}

          {/* En cours */}
          {enCours.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-coplio-amber" />
                <h2 className="font-semibold text-coplio-text text-sm uppercase tracking-wide">En cours</h2>
                <span className="text-xs text-muted-foreground">({enCours.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enCours.map((sinistre) => (
                  <SinistreCard key={sinistre.id} sinistre={sinistre} photos={photosBySinistre[sinistre.id] ?? []} />
                ))}
              </div>
            </div>
          )}

          {/* Clôturés */}
          {clotures.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-[#374151]" />
                <h2 className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">Clôturés</h2>
                <span className="text-xs text-muted-foreground">({clotures.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clotures.map((sinistre) => (
                  <SinistreCard key={sinistre.id} sinistre={sinistre} photos={photosBySinistre[sinistre.id] ?? []} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Travaux du bâtiment ──────────────────────────── */}
      {activeTab === 'batiment' && (
        <div className="space-y-4">
          {(!travauxBatiment || travauxBatiment.length === 0) ? (
            <div className="coplio-card text-center py-16">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <HardHat className="w-7 h-7 text-blue-500" />
              </div>
              <p className="font-medium text-coplio-text">Aucun chantier en cours</p>
              <p className="text-sm text-muted-foreground mt-1">Votre syndic n&apos;a pas planifié de travaux pour le moment.</p>
            </div>
          ) : (
            travauxBatiment.map((t) => {
              const priorite = TRAVAUX_PRIORITE_COLORS[t.priorite ?? 'normale'] ?? TRAVAUX_PRIORITE_COLORS.normale
              return (
                <div key={t.id} className="coplio-card hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                        <HardHat className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-coplio-text">{t.titre}</h3>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <span className={`w-1.5 h-1.5 rounded-full ${priorite.dot}`} />
                            {priorite.label}
                          </span>
                        </div>
                        {t.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                        )}
                        {t.montant_estime && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                            <Euro className="w-3 h-3" />
                            Budget : <strong className="text-coplio-text ml-0.5">{formatEuro(t.montant_estime)}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        TRAVAUX_STATUT_COLORS[t.statut] ?? 'bg-gray-100 text-gray-600'
                      }`}>
                        {TRAVAUX_STATUT_LABELS[t.statut] ?? t.statut}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDate(t.created_at)}</span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ── Tab: Votes ────────────────────────────────────────── */}
      {activeTab === 'votes' && (
        <MesVotesClient
          userId={copro?.id ?? user.id}
          votes={(votesOuverts) as Parameters<typeof MesVotesClient>[0]['votes']}
        />
      )}
    </div>
  )
}

// SinistreCard est dans @/components/portail/SinistreCard.tsx
