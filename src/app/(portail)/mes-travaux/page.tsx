'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Wrench, CheckCircle2, Plus, X, AlertTriangle, Clock, Send, HardHat, Shield, Euro } from 'lucide-react'
import { formatDate, formatEuro } from '@/lib/utils'
import type { Sinistre } from '@/types'
import { SINISTRE_STATUS_LABELS } from '@/types'

const STEP_ORDER: Sinistre['status'][] = [
  'signale', 'assurance_declaree', 'expertise', 'travaux', 'cloture',
]

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
  realisation: 'bg-coplio-green-light text-coplio-green',
  reception: 'bg-coplio-green-light text-coplio-green',
  archive: 'bg-gray-100 text-gray-400',
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
    .select('lot_id, cabinet_id, lot:lots(copropriete_id)')
    .eq('id', user.id)
    .single()

  if (!profile?.lot_id) return

  const coproprieteId = (profile.lot as { copropriete_id?: string } | null)?.copropriete_id
  const now = new Date()
  const reference = `SIN-${now.getFullYear()}-${Math.floor(Math.random() * 90000) + 10000}`

  await supabase.from('sinistres').insert({
    titre: `[${TYPE_OPTIONS.find(t => t.value === type)?.label ?? type}] ${titre}`,
    description,
    status: urgence ? 'urgence' : 'signale',
    reference,
    copropriete_id: coproprieteId ?? null,
    cabinet_id: profile.cabinet_id ?? null,
    lots_concernes: [profile.lot_id],
    date_sinistre: now.toISOString().split('T')[0],
  })

  redirect('/mes-travaux')
}

export default async function MesTravaux({
  searchParams,
}: {
  searchParams: { nouveau?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portail')

  const { data: profile } = await supabase
    .from('profiles')
    .select('lot_id, lot:lots(copropriete_id)')
    .eq('id', user.id)
    .single()

  const coproprieteId = (profile?.lot as { copropriete_id?: string } | null)?.copropriete_id

  const { data: sinistres } = await supabase
    .from('sinistres')
    .select('*, copropriete:coproprietes(nom)')
    .contains('lots_concernes', [profile?.lot_id ?? ''])
    .order('created_at', { ascending: false })

  // Travaux du bâtiment planifiés par le syndic
  const { data: travauxBatiment } = coproprieteId
    ? await supabase
        .from('travaux')
        .select('id, titre, description, statut, priorite, montant_estime, created_at')
        .eq('copropriete_id', coproprieteId)
        .neq('statut', 'archive')
        .order('created_at', { ascending: false })
    : { data: [] }

  const enCours = (sinistres ?? []).filter((s) => s.status !== 'cloture')
  const clotures = (sinistres ?? []).filter((s) => s.status === 'cloture')
  const showForm = searchParams?.nouveau === '1'

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Travaux & sinistres</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {enCours.length} dossier{enCours.length > 1 ? 's' : ''} en cours
            {clotures.length > 0 && ` · ${clotures.length} clôturé${clotures.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <a
          href="/mes-travaux?nouveau=1"
          className="flex items-center gap-2 bg-coplio-green text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-coplio-green/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Signaler un problème
        </a>
      </div>

      {/* Formulaire de signalement */}
      {showForm && (
        <div className="coplio-card border-coplio-green/30 bg-coplio-green-light/30">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-coplio-green rounded-xl flex items-center justify-center">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-coplio-text">Signaler un problème</h2>
                <p className="text-xs text-muted-foreground">Votre syndic sera notifié immédiatement</p>
              </div>
            </div>
            <a href="/mes-travaux" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </a>
          </div>

          <form action={signalerProbleme} method="POST">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">
                  Type de problème <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  required
                  className="w-full px-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coplio-green focus:border-transparent"
                >
                  <option value="">Sélectionnez...</option>
                  {TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">
                  Titre court <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="titre"
                  required
                  placeholder="Ex : Fuite sous l'évier de la cuisine"
                  className="w-full px-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coplio-green focus:border-transparent"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-coplio-text mb-1.5">
                Description détaillée <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                required
                rows={4}
                placeholder="Décrivez le problème : depuis quand, localisation précise, impact sur votre logement..."
                className="w-full px-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coplio-green focus:border-transparent resize-none"
              />
            </div>

            <div className="flex items-center gap-3 mb-6 p-3 bg-coplio-red-bg rounded-xl border border-coplio-red/20">
              <input
                type="checkbox"
                id="urgence"
                name="urgence"
                className="w-4 h-4 accent-coplio-red"
              />
              <label htmlFor="urgence" className="flex items-center gap-2 text-sm text-coplio-text cursor-pointer">
                <AlertTriangle className="w-4 h-4 text-coplio-red" />
                <span>
                  <strong className="text-coplio-red">Urgence</strong> — Ce problème nécessite une intervention immédiate
                </span>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="flex items-center gap-2 bg-coplio-green text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-coplio-green/90 transition-colors"
              >
                <Send className="w-4 h-4" />
                Envoyer au syndic
              </button>
              <a href="/mes-travaux" className="text-sm text-muted-foreground hover:text-coplio-text transition-colors">
                Annuler
              </a>
            </div>
          </form>
        </div>
      )}

      {/* Travaux du bâtiment */}
      {(travauxBatiment ?? []).length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <HardHat className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-coplio-text text-sm uppercase tracking-wide">Travaux du bâtiment</h2>
            <span className="text-xs text-muted-foreground">({(travauxBatiment?.length ?? 0)} chantier{(travauxBatiment?.length ?? 0) > 1 ? 's' : ''})</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {(travauxBatiment ?? []).map((t) => (
              <div key={t.id} className="coplio-card">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 pr-3">
                    <h3 className="font-semibold text-coplio-text text-sm">{t.titre}</h3>
                    {t.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.description}</p>
                    )}
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                    TRAVAUX_STATUT_COLORS[t.statut] ?? 'bg-gray-100 text-gray-600'
                  }`}>
                    {TRAVAUX_STATUT_LABELS[t.statut] ?? t.statut}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border mt-2">
                  {t.montant_estime ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Euro className="w-3 h-3" />
                      Budget estimé : <strong className="text-coplio-text">{formatEuro(t.montant_estime)}</strong>
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Budget non défini</span>
                  )}
                  <span className="text-xs text-muted-foreground">{formatDate(t.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liste vide */}
      {(!sinistres || sinistres.length === 0) && !showForm && (
        <div className="coplio-card text-center py-16">
          <div className="w-14 h-14 bg-coplio-green-light rounded-full flex items-center justify-center mx-auto mb-3">
            <Wrench className="w-7 h-7 text-coplio-green" />
          </div>
          <p className="font-medium text-coplio-text">Aucun sinistre en cours</p>
          <p className="text-sm text-muted-foreground mt-1">Vous n&apos;avez pas de dossier vous concernant.</p>
          <a
            href="/mes-travaux?nouveau=1"
            className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-coplio-green hover:underline"
          >
            <Plus className="w-4 h-4" /> Signaler un premier problème
          </a>
        </div>
      )}

      {/* Dossiers en cours */}
      {enCours.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-coplio-amber" />
            <h2 className="font-semibold text-coplio-text text-sm uppercase tracking-wide">Mes sinistres en cours</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {enCours.map((sinistre: Sinistre & { copropriete?: { nom: string } }) => (
              <TravauxCard key={sinistre.id} sinistre={sinistre} />
            ))}
          </div>
        </div>
      )}

      {/* Dossiers clôturés */}
      {clotures.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-coplio-green" />
            <h2 className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">Clôturés</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {clotures.map((sinistre: Sinistre & { copropriete?: { nom: string } }) => (
              <TravauxCard key={sinistre.id} sinistre={sinistre} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TravauxCard({ sinistre }: { sinistre: Sinistre & { copropriete?: { nom: string } } }) {
  const stepIndex = STEP_ORDER.indexOf(sinistre.status as Sinistre['status'])
  const progress = Math.round(((stepIndex + 1) / STEP_ORDER.length) * 100)
  const isClosed = sinistre.status === 'cloture'
  const isUrgent = sinistre.status === 'urgence'

  const hasAssurance = sinistre.compagnie_assurance || sinistre.numero_declaration_assurance
  const indemnise = sinistre.montant_indemnisation ?? 0
  const estime = sinistre.montant_travaux_estime ?? 0

  return (
    <div className={`coplio-card ${isUrgent ? 'border-coplio-red/30' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0 pr-3">
          <h3 className="font-semibold text-coplio-text">{sinistre.titre}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {sinistre.reference} · {sinistre.copropriete?.nom}
          </p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
          isClosed ? 'bg-coplio-green-light text-coplio-green' :
          isUrgent ? 'bg-coplio-red-bg text-coplio-red' :
          'bg-coplio-amber-bg text-coplio-amber'
        }`}>
          {SINISTRE_STATUS_LABELS[sinistre.status as Sinistre['status']]}
        </span>
      </div>

      {/* Progression */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Avancement</span>
          <span className={isClosed ? 'text-coplio-green font-medium' : ''}>{progress}%</span>
        </div>
        <div className="h-2 bg-coplio-bg rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isUrgent ? 'bg-coplio-red' : isClosed ? 'bg-coplio-green' : 'bg-coplio-green-medium'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Étapes */}
      <div className="flex items-start gap-1">
        {STEP_ORDER.map((step, i) => {
          const done = stepIndex >= i
          const isCurrent = stepIndex === i
          return (
            <div key={step} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="relative w-full flex items-center">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center z-10 flex-shrink-0 mx-auto ${
                  done ? (isUrgent ? 'bg-coplio-red border-coplio-red' : 'bg-coplio-green border-coplio-green') :
                  isCurrent ? 'border-coplio-green bg-white' :
                  'bg-white border-border'
                }`}>
                  {done && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                {i < STEP_ORDER.length - 1 && (
                  <div className={`absolute left-1/2 w-full h-0.5 top-2.5 ${
                    done && stepIndex > i ? (isUrgent ? 'bg-coplio-red' : 'bg-coplio-green') : 'bg-border'
                  }`} />
                )}
              </div>
              <span className="text-[9px] text-muted-foreground text-center leading-tight">
                {SINISTRE_STATUS_LABELS[step].split(' ')[0]}
              </span>
            </div>
          )
        })}
      </div>

      {/* Détails assurance */}
      {hasAssurance && (
        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 mb-2">
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs font-semibold text-coplio-text">Assurance</span>
          </div>
          <div className="space-y-1">
            {sinistre.compagnie_assurance && (
              <p className="text-xs text-muted-foreground">
                Compagnie : <span className="text-coplio-text font-medium">{sinistre.compagnie_assurance}</span>
              </p>
            )}
            {sinistre.numero_declaration_assurance && (
              <p className="text-xs text-muted-foreground">
                N° déclaration : <span className="text-coplio-text font-medium">{sinistre.numero_declaration_assurance}</span>
              </p>
            )}
            {estime > 0 && (
              <p className="text-xs text-muted-foreground">
                Montant estimé : <span className="text-coplio-text font-medium">{formatEuro(estime)}</span>
              </p>
            )}
            {indemnise > 0 && (
              <p className="text-xs text-muted-foreground">
                Indemnisation : <span className="text-coplio-green font-semibold">{formatEuro(indemnise)}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {sinistre.date_sinistre && (
        <div className={`mt-3 pt-3 border-t border-border ${hasAssurance ? '' : 'mt-4'}`}>
          <p className="text-xs text-muted-foreground">
            Déclaré le {formatDate(sinistre.date_sinistre)}
            {sinistre.date_cloture && ` · Clôturé le ${formatDate(sinistre.date_cloture)}`}
          </p>
        </div>
      )}
    </div>
  )
}
