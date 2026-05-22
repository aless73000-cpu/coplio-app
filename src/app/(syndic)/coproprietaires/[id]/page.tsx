import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, User, Mail, Phone, Home, MapPin, Pencil,
  Smartphone, TrendingDown, CheckCircle2, Clock, AlertTriangle,
  MessageSquare, StickyNote, CreditCard,
} from 'lucide-react'
import { formatEuro, formatDate } from '@/lib/utils'
import { InviterPortailButton } from '@/components/syndic/InviterPortailButton'
import { DeleteCoproprietaireButton } from '@/components/syndic/DeleteCoproprietaireButton'

export default async function CopropriétairePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  // Fiche copropriétaire
  const { data: copropriétaire } = await admin
    .from('coproprietaires')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!copropriétaire) notFound()

  // Lots via table de jonction
  const { data: junctionData } = await admin
    .from('coproprietaire_lots')
    .select('lot_id')
    .eq('coproprietaire_id', params.id)

  const lotIds = (junctionData ?? []).map((j: { lot_id: string }) => j.lot_id)

  // Données lots + appels de charges en parallèle
  const [lotsData, appelsData] = await Promise.all([
    lotIds.length > 0
      ? admin
          .from('lots')
          .select('id, numero, type, etage, surface, tantiemes, solde_compte, copropriete:coproprietes(id, nom)')
          .in('id', lotIds)
          .order('numero')
          .then((r) => r.data)
      : Promise.resolve([]),

    lotIds.length > 0
      ? admin
          .from('appels_charges')
          .select('id, libelle, montant, montant_paye, paye, date_echeance, date_paiement, copropriete:coproprietes(nom)')
          .in('lot_id', lotIds)
          .order('date_echeance', { ascending: false })
          .limit(20)
          .then((r) => r.data)
      : Promise.resolve([]),
  ])

  const lots = (lotsData ?? []).map((lot) => ({ lot }))

  // ─── Calculs financiers ───────────────────────────────────
  type Appel = {
    id: string
    libelle: string
    montant: number
    montant_paye: number
    paye: boolean
    date_echeance: string
    date_paiement?: string | null
    copropriete?: { nom?: string } | null
  }
  const appels = (appelsData ?? []) as Appel[]

  const soldeTotalDu = appels
    .filter((a) => !a.paye)
    .reduce((s, a) => s + (a.montant - a.montant_paye), 0)

  const dernierPaiement = appels
    .filter((a) => a.date_paiement)
    .sort((a, b) => new Date(b.date_paiement!).getTime() - new Date(a.date_paiement!).getTime())[0]

  const nbImpayes = appels.filter((a) => !a.paye && new Date(a.date_echeance) < new Date()).length

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <Link href="/coproprietaires" className="text-muted-foreground hover:text-coplio-text transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-coplio-text">
            {copropriétaire.prenom} {copropriétaire.nom}
          </h1>
          <p className="text-muted-foreground text-sm">
            {lots.length} lot{lots.length > 1 ? 's' : ''} · {appels.length} appel{appels.length > 1 ? 's' : ''} de charges
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DeleteCoproprietaireButton
            id={params.id}
            nom={`${copropriétaire.prenom} ${copropriétaire.nom}`}
          />
          <Link
            href={`/coproprietaires/${params.id}/edit`}
            className="flex items-center gap-2 bg-coplio-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-coplio-green/90 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Modifier
          </Link>
        </div>
      </div>

      {/* ── Solde financier — carte proéminente ────────────────── */}
      <div className={`rounded-2xl border p-5 ${
        soldeTotalDu > 0
          ? 'bg-red-50 border-red-200'
          : 'bg-coplio-green-light border-coplio-green/20'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              soldeTotalDu > 0 ? 'bg-red-100' : 'bg-coplio-green/20'
            }`}>
              <CreditCard className={`w-5 h-5 ${soldeTotalDu > 0 ? 'text-red-500' : 'text-coplio-green'}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Solde dû</p>
              <p className={`text-2xl font-bold ${soldeTotalDu > 0 ? 'text-red-600' : 'text-coplio-green'}`}>
                {formatEuro(soldeTotalDu)}
              </p>
            </div>
          </div>

          <div className="text-right space-y-1">
            {nbImpayes > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
                <AlertTriangle className="w-3 h-3" />
                {nbImpayes} impayé{nbImpayes > 1 ? 's' : ''}
              </span>
            )}
            {dernierPaiement && (
              <p className="text-xs text-muted-foreground">
                Dernier paiement : {formatDate(dernierPaiement.date_paiement!)}
              </p>
            )}
            {!dernierPaiement && appels.length > 0 && (
              <p className="text-xs text-muted-foreground">Aucun paiement enregistré</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Fiche contact ──────────────────────────────────────── */}
      <div className="coplio-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-14 h-14 bg-coplio-green/10 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-7 h-7 text-coplio-green" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-coplio-text text-lg">
              {copropriétaire.prenom} {copropriétaire.nom}
            </p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              copropriétaire.portail_actif
                ? 'bg-coplio-green-light text-coplio-green'
                : 'bg-coplio-bg text-muted-foreground'
            }`}>
              {copropriétaire.portail_actif ? 'Portail actif' : 'Portail inactif'}
            </span>
          </div>
          {/* Bouton message direct */}
          {copropriétaire.profile_id && (
            <Link
              href={`/messages?copro=${copropriétaire.profile_id}`}
              className="flex items-center gap-2 text-sm font-medium text-coplio-green border border-coplio-green/30 px-3 py-2 rounded-lg hover:bg-coplio-green-light transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Message
            </Link>
          )}
        </div>

        <dl className="space-y-3 text-sm">
          {copropriétaire.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <a href={`mailto:${copropriétaire.email}`} className="text-coplio-green hover:underline">
                {copropriétaire.email}
              </a>
            </div>
          )}
          {copropriétaire.telephone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <a href={`tel:${copropriétaire.telephone}`} className="text-coplio-text hover:text-coplio-green">
                {copropriétaire.telephone}
              </a>
            </div>
          )}
          {copropriétaire.adresse_correspondance && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <span className="text-coplio-text">{copropriétaire.adresse_correspondance}</span>
            </div>
          )}
        </dl>
      </div>

      {/* ── Notes internes ─────────────────────────────────────── */}
      {(copropriétaire as unknown as { notes_internes?: string }).notes_internes && (
        <div className="coplio-card border-l-4 border-l-amber-400">
          <div className="flex items-center gap-2 mb-2">
            <StickyNote className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-coplio-text text-sm">Notes internes</h2>
            <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Visible syndic uniquement</span>
          </div>
          <p className="text-sm text-coplio-text whitespace-pre-line">{(copropriétaire as unknown as { notes_internes?: string }).notes_internes}</p>
        </div>
      )}

      {/* ── Historique des charges ─────────────────────────────── */}
      <div className="coplio-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-coplio-text">Historique des charges</h2>
          </div>
          <Link
            href={`/appels-charges`}
            className="text-xs text-coplio-green hover:underline"
          >
            Voir tous les appels
          </Link>
        </div>

        {appels.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Aucun appel de charges pour ce copropriétaire
          </p>
        ) : (
          <div className="space-y-2">
            {appels.map((appel) => {
              const isLate = !appel.paye && new Date(appel.date_echeance) < new Date()
              const restant = appel.montant - appel.montant_paye
              return (
                <div
                  key={appel.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    isLate
                      ? 'bg-red-50 border-red-100'
                      : appel.paye
                      ? 'bg-coplio-bg border-transparent'
                      : 'bg-white border-border'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    appel.paye ? 'bg-coplio-green/10' : isLate ? 'bg-red-100' : 'bg-amber-50'
                  }`}>
                    {appel.paye
                      ? <CheckCircle2 className="w-4 h-4 text-coplio-green" />
                      : isLate
                      ? <AlertTriangle className="w-4 h-4 text-red-500" />
                      : <Clock className="w-4 h-4 text-amber-500" />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-coplio-text truncate">{appel.libelle}</p>
                    <p className="text-xs text-muted-foreground">
                      Éch. {formatDate(appel.date_echeance)}
                      {(appel.copropriete as { nom?: string } | null)?.nom && (
                        <span> · {(appel.copropriete as { nom?: string }).nom}</span>
                      )}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-semibold ${
                      appel.paye ? 'text-coplio-green' : isLate ? 'text-red-600' : 'text-coplio-text'
                    }`}>
                      {appel.paye ? formatEuro(appel.montant) : formatEuro(restant)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {appel.paye
                        ? appel.date_paiement ? `Payé le ${formatDate(appel.date_paiement)}` : 'Payé'
                        : isLate ? 'En retard' : 'En attente'
                      }
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Portail copropriétaire ─────────────────────────────── */}
      <div className="coplio-card">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-coplio-text">Portail copropriétaire</h2>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              copropriétaire.portail_actif
                ? 'bg-coplio-green-light text-coplio-green'
                : 'bg-coplio-bg text-muted-foreground'
            }`}>
              {copropriétaire.portail_actif ? 'Accès actif' : 'Accès inactif'}
            </span>
            {copropriétaire.invitation_envoyee_at && (
              <p className="text-xs text-muted-foreground mt-1.5">
                Invitation envoyée le {formatDate(copropriétaire.invitation_envoyee_at)}
              </p>
            )}
          </div>
        </div>

        {copropriétaire.email ? (
          <InviterPortailButton
            coproprietaireId={copropriétaire.id}
            email={copropriétaire.email}
            invitationDejaSent={!!copropriétaire.invitation_envoyee_at}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Ajoutez un email pour pouvoir inviter ce copropriétaire.
          </p>
        )}
      </div>

      {/* ── Lots ──────────────────────────────────────────────── */}
      <div className="coplio-card">
        <h2 className="font-semibold text-coplio-text mb-4">Lots</h2>
        {lots.length > 0 ? (
          <div className="space-y-3">
            {lots.map((cl) => {
              const lot = cl.lot as { id: string; numero: string; type?: string; etage?: string; surface?: number; tantiemes?: number; solde_compte?: number; copropriete?: { id: string; nom: string } | { id: string; nom: string }[] | null }
              const coproprieteNom = Array.isArray(lot.copropriete) ? lot.copropriete[0]?.nom : lot.copropriete?.nom
              return (
                <Link
                  key={lot.id}
                  href={`/lots/${lot.id}`}
                  className="flex items-center gap-3 p-3 bg-coplio-bg rounded-xl hover:bg-border transition-colors"
                >
                  <div className="w-9 h-9 bg-coplio-green/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Home className="w-4 h-4 text-coplio-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-coplio-text">
                      Lot {lot.numero}
                      {lot.etage && <span className="text-muted-foreground font-normal"> · {lot.etage}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {coproprieteNom}
                      {lot.surface && ` · ${lot.surface} m²`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground">{lot.tantiemes} t.</p>
                    {(lot.solde_compte ?? 0) !== 0 && (
                      <p className={`text-xs font-medium ${(lot.solde_compte ?? 0) < 0 ? 'text-red-500' : 'text-coplio-green'}`}>
                        {formatEuro(lot.solde_compte ?? 0)}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Aucun lot assigné</p>
        )}
      </div>
    </div>
  )
}
