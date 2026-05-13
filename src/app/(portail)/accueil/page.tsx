import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  CreditCard, FileText, Wrench, MessageCircle,
  AlertTriangle, CheckCircle2, ChevronRight, Bell, Plus,
  Landmark, PenLine, UserX,
} from 'lucide-react'
import { formatEuro, formatDate } from '@/lib/utils'
import type { AppelCharges, Document, Sinistre, Notification } from '@/types'

export default async function AccueilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portail')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, lot:lots(id, numero, type, etage, copropriete:coproprietes(id, nom, adresse, ville))')
    .eq('id', user.id)
    .single()

  const lotId = profile?.lot_id
  const lot = profile?.lot as {
    id: string; numero: string; type: string; etage?: string
    copropriete: { id: string; nom: string; adresse?: string; ville?: string }
  } | null

  const coproprieteId = lot?.copropriete?.id

  const { data: appels } = lotId
    ? await supabase.from('appels_charges').select('*').eq('lot_id', lotId).eq('paye', false)
        .order('date_echeance', { ascending: true }).limit(3)
    : { data: [] }

  const montantDu = (appels ?? []).reduce(
    (s: number, a: AppelCharges) => s + (a.montant - a.montant_paye), 0
  )
  const prochainAppel = (appels ?? [])[0] as AppelCharges | undefined

  const { data: documents } = await supabase
    .from('documents').select('*').eq('visible_coproprietaires', true)
    .or(`lot_id.eq.${lotId ?? 'null'},lot_id.is.null`)
    .order('created_at', { ascending: false }).limit(4)

  const { data: sinistres } = lotId
    ? await supabase.from('sinistres').select('id, titre, status, reference')
        .contains('lots_concernes', [lotId]).neq('status', 'cloture')
        .order('created_at', { ascending: false }).limit(4)
    : { data: [] }

  const { data: notifications } = await supabase
    .from('notifications').select('*').eq('user_id', user.id).eq('lu', false)
    .order('created_at', { ascending: false }).limit(5)

  // Fonds de travaux ALUR
  const { data: fondsTravaux } = coproprieteId
    ? await supabase
        .from('fonds_travaux')
        .select('id, annee, solde_actuel, objectif_5ans')
        .eq('copropriete_id', coproprieteId)
        .order('annee', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null }

  const nbNotifs = notifications?.length ?? 0
  const prenom = profile?.prenom ?? 'Bienvenue'

  // Si pas de lot, afficher un état vide clair
  if (!lotId) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Bonjour, {prenom} 👋</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Espace copropriétaire</p>
        </div>
        <div className="coplio-card text-center py-20">
          <div className="w-16 h-16 bg-coplio-amber-bg rounded-full flex items-center justify-center mx-auto mb-4">
            <UserX className="w-8 h-8 text-coplio-amber" />
          </div>
          <h2 className="text-lg font-semibold text-coplio-text mb-2">Aucun lot associé à votre compte</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Votre compte n&apos;est pas encore lié à un lot de copropriété. Contactez votre syndic
            pour qu&apos;il vous associe à votre appartement.
          </p>
          <Link
            href="/mes-messages"
            className="inline-flex items-center gap-2 mt-6 bg-coplio-green text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-coplio-green/90 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Contacter le syndic
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Bonjour, {prenom} 👋</h1>
          {lot?.copropriete && (
            <p className="text-muted-foreground text-sm mt-0.5">
              {lot.copropriete.nom} · Lot {lot.numero}
              {lot.copropriete.ville && ` · ${lot.copropriete.ville}`}
            </p>
          )}
        </div>
        <Link href="/mes-messages" className="relative">
          <div className="w-10 h-10 bg-white border border-border rounded-xl flex items-center justify-center hover:border-coplio-green transition-colors">
            <Bell className="w-5 h-5 text-muted-foreground" />
          </div>
          {nbNotifs > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-coplio-red rounded-full flex items-center justify-center text-white text-[10px] font-bold">
              {nbNotifs > 9 ? '9+' : nbNotifs}
            </span>
          )}
        </Link>
      </div>

      {/* Ligne 1 : Solde + Raccourcis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Solde */}
        <div className={`coplio-card ${montantDu > 0 ? 'border-coplio-red/30 bg-coplio-red-bg' : ''}`}>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Solde à régler</p>
          <p className={`text-4xl font-bold ${montantDu > 0 ? 'text-coplio-red' : 'text-coplio-green'}`}>
            {formatEuro(montantDu)}
          </p>
          {prochainAppel && (
            <p className="text-xs text-muted-foreground mt-2">
              Prochain : {prochainAppel.libelle} · {formatDate(prochainAppel.date_echeance)}
            </p>
          )}
          <div className={`mt-3 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
            montantDu > 0 ? 'bg-coplio-red/10 text-coplio-red' : 'bg-coplio-green-light text-coplio-green'
          }`}>
            {montantDu > 0
              ? <><AlertTriangle className="w-3 h-3" /> {(appels ?? []).length} impayé{(appels ?? []).length > 1 ? 's' : ''}</>
              : <><CheckCircle2 className="w-3 h-3" /> À jour</>
            }
          </div>
          <Link href="/mes-charges" className="flex items-center gap-1 text-sm font-medium text-coplio-green mt-4 hover:underline">
            Voir mes charges <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Raccourcis */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          {[
            { href: '/mes-charges', icon: CreditCard, label: 'Mes charges', color: 'bg-coplio-green-light', iconColor: 'text-coplio-green', sub: `${(appels ?? []).length} en attente` },
            { href: '/mes-documents', icon: FileText, label: 'Mes documents', color: 'bg-blue-50', iconColor: 'text-blue-600', sub: `${documents?.length ?? 0} disponible${(documents?.length ?? 0) > 1 ? 's' : ''}` },
            { href: '/mes-travaux', icon: Wrench, label: 'Travaux & sinistres', color: 'bg-coplio-amber-bg', iconColor: 'text-coplio-amber', sub: `${sinistres?.length ?? 0} dossier${(sinistres?.length ?? 0) > 1 ? 's' : ''} en cours` },
            { href: '/mes-signatures', icon: PenLine, label: 'Signatures', color: 'bg-purple-50', iconColor: 'text-purple-600', sub: 'Documents à signer' },
          ].map(({ href, icon: Icon, label, color, iconColor, sub }) => (
            <Link key={href} href={href}
              className="coplio-card flex items-center gap-4 hover:border-coplio-green/30 hover:shadow-sm transition-all group"
            >
              <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
              <div>
                <p className="font-semibold text-coplio-text group-hover:text-coplio-green transition-colors">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Fonds de travaux */}
      {fondsTravaux && (
        <div className="coplio-card border-blue-200 bg-blue-50/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Landmark className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Fonds de travaux ALUR</p>
                <p className="font-bold text-xl text-blue-700">{formatEuro(fondsTravaux.solde_actuel ?? 0)}</p>
              </div>
            </div>
            {fondsTravaux.objectif_5ans && fondsTravaux.objectif_5ans > 0 && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">
                  Objectif 5 ans : {formatEuro(fondsTravaux.objectif_5ans)}
                </p>
                <div className="w-40 h-2 bg-blue-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.round(((fondsTravaux.solde_actuel ?? 0) / fondsTravaux.objectif_5ans) * 100))}%` }}
                  />
                </div>
                <p className="text-xs text-blue-600 font-medium mt-1">
                  {Math.min(100, Math.round(((fondsTravaux.solde_actuel ?? 0) / fondsTravaux.objectif_5ans) * 100))}% atteint
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ligne 2 : Documents récents + Travaux + Notifications */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Documents récents */}
        <div className="coplio-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-coplio-text">Documents récents</h2>
            <Link href="/mes-documents" className="text-xs text-coplio-green font-medium hover:underline flex items-center gap-0.5">
              Tout voir <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {!documents || documents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucun document</p>
          ) : (
            <div className="space-y-2">
              {(documents as Document[]).map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-coplio-bg transition-colors">
                  <div className="w-8 h-8 bg-coplio-green-light rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-coplio-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-coplio-text truncate">{doc.nom}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(doc.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Travaux en cours */}
        <div className="coplio-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-coplio-text">Travaux en cours</h2>
            <Link href="/mes-travaux" className="text-xs text-coplio-green font-medium hover:underline flex items-center gap-0.5">
              Tout voir <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {!sinistres || sinistres.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Aucun dossier en cours</p>
              <Link
                href="/mes-travaux?nouveau=1"
                className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-coplio-green hover:underline"
              >
                <Plus className="w-3 h-3" /> Signaler un problème
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {(sinistres as Pick<Sinistre, 'id' | 'titre' | 'status' | 'reference'>[]).map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-coplio-bg transition-colors">
                  <div className="w-8 h-8 bg-coplio-amber-bg rounded-lg flex items-center justify-center flex-shrink-0">
                    <Wrench className="w-4 h-4 text-coplio-amber" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-coplio-text truncate">{s.titre}</p>
                    <p className="text-xs text-muted-foreground">{s.reference}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="coplio-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-coplio-text">Notifications</h2>
            {nbNotifs > 0 && (
              <span className="bg-coplio-red text-white text-xs font-bold px-2 py-0.5 rounded-full">{nbNotifs}</span>
            )}
          </div>
          {!notifications || notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune notification</p>
          ) : (
            <div className="space-y-3">
              {(notifications as Notification[]).map((notif) => (
                <div key={notif.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    notif.type === 'urgent' ? 'bg-coplio-red' :
                    notif.type === 'alerte' ? 'bg-coplio-amber' : 'bg-coplio-green'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-coplio-text">{notif.titre}</p>
                    {notif.message && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">{formatDate(notif.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
