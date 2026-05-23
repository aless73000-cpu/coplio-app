import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  FileText, Wrench, MessageCircle,
  AlertTriangle, CheckCircle2, ChevronRight,
  Landmark, UserX, Calendar,
  Bell, CreditCard, ArrowRight,
} from 'lucide-react'
import { formatEuro, formatDate } from '@/lib/utils'
import type { AppelCharges, Document, Sinistre, Notification } from '@/types'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  if (days < 7) return `Il y a ${days} jours`
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem.`
  return formatDate(dateStr)
}

export default async function AccueilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portail')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, lot:lots(id, numero, type, etage, solde_compte, copropriete:coproprietes(id, nom, adresse, ville))')
    .eq('id', user.id)
    .single()

  const lotId = profile?.lot_id
  const lot = profile?.lot as {
    id: string; numero: string; type: string; etage?: string; solde_compte?: number | null
    copropriete: { id: string; nom: string; adresse?: string; ville?: string }
  } | null

  const coproprieteId = lot?.copropriete?.id
  const prenom = profile?.prenom ?? 'Bienvenue'

  if (!lotId) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Bonjour, {prenom} 👋</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Espace copropriétaire</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-10 text-center shadow-sm">
          <div className="w-16 h-16 bg-coplio-amber-bg rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserX className="w-8 h-8 text-coplio-amber" />
          </div>
          <h2 className="text-lg font-semibold text-coplio-text mb-2">Aucun lot associé</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
            Votre compte n&apos;est pas encore lié à un logement. Contactez votre syndic pour finaliser la configuration.
          </p>
          <Link
            href="/mes-messages"
            className="inline-flex items-center gap-2 bg-coplio-green text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-coplio-green/90 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Contacter le syndic
          </Link>
        </div>
      </div>
    )
  }

  // Build document query with RGPD filter
  const documentsQuery = supabase
    .from('documents')
    .select('*')
    .eq('visible_coproprietaires', true)
    .order('created_at', { ascending: false })
    .limit(5)

  if (lotId && coproprieteId) {
    documentsQuery.or(`lot_id.eq.${lotId},and(lot_id.is.null,copropriete_id.eq.${coproprieteId})`)
  } else if (coproprieteId) {
    documentsQuery.is('lot_id', null).eq('copropriete_id', coproprieteId)
  } else {
    documentsQuery.eq('lot_id', lotId ?? '')
  }

  const [
    { data: appels },
    { data: documents },
    { data: sinistres },
    { data: notifications },
    { data: fondsTravaux },
    { data: prochainAG },
  ] = await Promise.all([
    lotId
      ? supabase.from('appels_charges').select('*').eq('lot_id', lotId).eq('paye', false)
          .order('date_echeance', { ascending: true }).limit(5)
      : Promise.resolve({ data: [] as AppelCharges[] }),
    documentsQuery,
    lotId
      ? supabase.from('sinistres').select('id, titre, status, reference, created_at')
          .contains('lots_concernes', [lotId]).neq('status', 'cloture')
          .order('created_at', { ascending: false }).limit(3)
      : Promise.resolve({ data: [] }),
    supabase.from('notifications').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(8),
    coproprieteId
      ? supabase.from('fonds_travaux').select('id, annee, solde_actuel, objectif_5ans')
          .eq('copropriete_id', coproprieteId).order('annee', { ascending: false })
          .limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
    coproprieteId
      ? supabase.from('assemblees_generales').select('id, titre, date_ag, lieu')
          .eq('copropriete_id', coproprieteId)
          .gte('date_ag', new Date().toISOString())
          .order('date_ag', { ascending: true }).limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const montantDu = (appels ?? []).reduce(
    (s: number, a) => s + (a.montant - (a.montant_paye ?? 0)), 0
  )
  const prochainAppel = (appels ?? [])[0]
  const hasOverdue = (appels ?? []).some(
    (a) => new Date(a.date_echeance) < new Date()
  )

  // Hero banner state
  type HeroBanner = {
    bg: string
    border: string
    icon: React.ReactNode
    text: React.ReactNode
  }

  let heroBanner: HeroBanner

  if (montantDu > 0 && hasOverdue) {
    heroBanner = {
      bg: 'bg-coplio-red-bg',
      border: 'border-coplio-red/20',
      icon: <AlertTriangle className="w-5 h-5 text-coplio-red flex-shrink-0" />,
      text: (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-coplio-red">
            Appel de charges en retard — {formatEuro(montantDu)}
          </p>
          <p className="text-xs text-coplio-red/70 mt-0.5">
            Échéance dépassée. Contactez votre syndic si vous avez déjà effectué le paiement.
          </p>
        </div>
      ),
    }
  } else if (montantDu > 0) {
    heroBanner = {
      bg: 'bg-coplio-amber-bg',
      border: 'border-coplio-amber/20',
      icon: <AlertTriangle className="w-5 h-5 text-coplio-amber flex-shrink-0" />,
      text: (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-coplio-amber">
            {formatEuro(montantDu)} à régler
            {prochainAppel && ` · Échéance le ${formatDate(prochainAppel.date_echeance)}`}
          </p>
          <p className="text-xs text-coplio-amber/70 mt-0.5">
            Effectuez un virement aux coordonnées de votre syndic.
          </p>
        </div>
      ),
    }
  } else {
    heroBanner = {
      bg: 'bg-coplio-green-light',
      border: 'border-coplio-green/20',
      icon: <CheckCircle2 className="w-5 h-5 text-coplio-green flex-shrink-0" />,
      text: (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-coplio-green">
            Votre compte est à jour ✓
          </p>
          <p className="text-xs text-coplio-green/70 mt-0.5">
            {prochainAG
              ? `Prochaine AG : ${new Date(prochainAG.date_ag).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
              : 'Aucun paiement en attente'
            }
          </p>
        </div>
      ),
    }
  }

  // Build unified activity feed
  type FeedItem = {
    id: string
    icon: React.ReactNode
    text: string
    sub?: string
    date: string
    href?: string
    cta?: string
  }

  const feedItems: FeedItem[] = []

  // Documents
  ;(documents ?? []).forEach((doc: Document) => {
    if (!doc.created_at) return
    feedItems.push({
      id: `doc-${doc.id}`,
      icon: <FileText className="w-4 h-4 text-coplio-blue" />,
      text: doc.nom,
      sub: 'Document disponible',
      date: doc.created_at,
      href: '/mes-documents',
      cta: 'Voir',
    })
  })

  // Sinistres
  ;(sinistres ?? []).forEach((s: { id: string; titre: string; status: string | null; reference: string | null; created_at: string | null }) => {
    if (!s.created_at) return
    feedItems.push({
      id: `sin-${s.id}`,
      icon: <Wrench className="w-4 h-4 text-coplio-amber" />,
      text: s.titre,
      sub: `Dossier ${s.reference ?? ''} · ${s.status ?? ''}`,
      date: s.created_at,
      href: '/mes-travaux',
    })
  })

  // Notifications
  ;(notifications ?? []).slice(0, 5).forEach((n) => {
    if (!n.created_at) return
    feedItems.push({
      id: `notif-${n.id}`,
      icon: <Bell className={`w-4 h-4 ${n.type === 'urgent' ? 'text-coplio-red' : n.type === 'alerte' ? 'text-coplio-amber' : 'text-coplio-green'}`} />,
      text: n.titre,
      sub: n.message ?? undefined,
      date: n.created_at,
      href: n.lien ?? undefined,
    })
  })

  // Sort by date descending, take top 8
  feedItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const recentFeed = feedItems.slice(0, 8)

  return (
    <div className="max-w-3xl mx-auto space-y-5 py-2">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-coplio-text">Bonjour, {prenom} 👋</h1>
        {lot?.copropriete && (
          <p className="text-muted-foreground text-sm mt-0.5">
            {lot.copropriete.nom}
            {lot.numero && ` · Lot ${lot.numero}`}
            {lot.copropriete.ville && ` · ${lot.copropriete.ville}`}
          </p>
        )}
      </div>

      {/* Hero Banner */}
      <div className={`flex items-start gap-3 p-4 rounded-2xl border ${heroBanner.bg} ${heroBanner.border}`}>
        {heroBanner.icon}
        {heroBanner.text}
        {montantDu > 0 && (
          <Link
            href="/mes-charges"
            className="flex-shrink-0 text-xs font-medium text-coplio-text bg-white/80 hover:bg-white px-3 py-1.5 rounded-lg border border-border transition-colors flex items-center gap-1"
          >
            Voir <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      {/* Two info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Charges card */}
        <Link href="/mes-charges" className="bg-white rounded-2xl border border-border p-5 shadow-sm hover:shadow-md hover:border-coplio-green/30 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-coplio-green-light rounded-xl flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-coplio-green" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Mes charges</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-coplio-green transition-colors" />
          </div>
          <p className={`text-3xl font-bold ${montantDu > 0 ? 'text-coplio-red' : 'text-coplio-green'}`}>
            {montantDu > 0 ? formatEuro(montantDu) : '✓ À jour'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {montantDu > 0 ? 'Montant à régler' : 'Aucun impayé'}
          </p>
        </Link>

        {/* Next event card */}
        <Link
          href={prochainAG ? '/mes-assemblees' : '/mon-calendrier'}
          className="bg-white rounded-2xl border border-border p-5 shadow-sm hover:shadow-md hover:border-coplio-green/30 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                <Calendar className="w-4 h-4 text-coplio-blue" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {prochainAG ? 'Prochaine AG' : 'Calendrier'}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-coplio-green transition-colors" />
          </div>
          {prochainAG ? (
            <>
              <p className="text-base font-bold text-coplio-text line-clamp-1">{prochainAG.titre}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(prochainAG.date_ag).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                {prochainAG.lieu && ` · ${prochainAG.lieu}`}
              </p>
            </>
          ) : (
            <>
              <p className="text-base font-semibold text-muted-foreground">Aucun événement prévu</p>
              <p className="text-xs text-muted-foreground mt-1">Consultez votre agenda</p>
            </>
          )}
        </Link>
      </div>

      {/* Fonds de travaux */}
      {fondsTravaux && (
        <div className="bg-white rounded-2xl border border-coplio-blue-bg p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-coplio-blue-bg rounded-xl flex items-center justify-center flex-shrink-0">
                <Landmark className="w-5 h-5 text-coplio-blue" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Fonds de travaux ALUR</p>
                <p className="font-bold text-xl text-coplio-blue">{formatEuro(fondsTravaux.solde_actuel ?? 0)}</p>
              </div>
            </div>
            {fondsTravaux.objectif_5ans && fondsTravaux.objectif_5ans > 0 && (
              <div className="sm:text-right">
                <p className="text-xs text-muted-foreground mb-1.5">
                  Objectif : {formatEuro(fondsTravaux.objectif_5ans)}
                </p>
                <div className="w-full sm:w-32 h-1.5 bg-coplio-blue-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-coplio-blue rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.round(((fondsTravaux.solde_actuel ?? 0) / fondsTravaux.objectif_5ans) * 100))}%` }}
                  />
                </div>
                <p className="text-xs text-coplio-blue font-medium mt-1">
                  {Math.min(100, Math.round(((fondsTravaux.solde_actuel ?? 0) / fondsTravaux.objectif_5ans) * 100))}%
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activity feed */}
      {recentFeed.length > 0 && (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-coplio-text text-sm">Activité récente</h2>
          </div>
          <div className="divide-y divide-border">
            {recentFeed.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-coplio-bg/50 transition-colors">
                <div className="w-8 h-8 bg-coplio-bg rounded-xl flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-coplio-text truncate">{item.text}</p>
                  {item.sub && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.sub}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(item.date)}</span>
                  {item.href && (
                    <Link
                      href={item.href}
                      className="text-xs font-medium text-coplio-green hover:text-coplio-green/70 transition-colors"
                    >
                      {item.cta ?? '→'}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {recentFeed.length === 0 && (
        <div className="bg-white rounded-2xl border border-border p-10 text-center shadow-sm">
          <div className="w-12 h-12 bg-coplio-bg rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Bell className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-coplio-text">Aucune activité récente</p>
          <p className="text-xs text-muted-foreground mt-1">Les documents et notifications de votre syndic apparaîtront ici.</p>
        </div>
      )}
    </div>
  )
}
