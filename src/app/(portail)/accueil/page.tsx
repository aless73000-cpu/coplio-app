import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Accueil' }
import {
  FileText, Wrench, MessageCircle,
  AlertTriangle, CheckCircle2,
  Landmark, UserX, Calendar, User,
  Bell, CreditCard, ArrowRight,
  CalendarDays, Vote, ChevronRight, Crown, BookUser, Zap,
} from 'lucide-react'
import { formatEuro, formatDate } from '@/lib/utils'
import type { AppelCharges, Document, Sinistre, Notification } from '@/types'
import { Sparkles } from 'lucide-react'

const CONSEIL_ROLE_LABELS: Record<string, string> = {
  president: 'Président du conseil syndical',
  vice_president: 'Vice-président du conseil syndical',
  tresorier: 'Trésorier du conseil syndical',
  secretaire: 'Secrétaire du conseil syndical',
  membre: 'Membre du conseil syndical',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  if (days < 7) return `Il y a ${days} j`
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem.`
  return formatDate(dateStr)
}

const SHORTCUTS = [
  { href: '/mes-charges',    label: 'Mes charges',   icon: CreditCard,   color: '#e0f2fe', iconColor: '#0284c7' },
  { href: '/mes-documents',  label: 'Documents',     icon: FileText,     color: '#f0fdf4', iconColor: '#16a34a' },
  { href: '/mes-assemblees', label: 'Assemblées',    icon: CalendarDays, color: '#fef3c7', iconColor: '#d97706' },
  { href: '/mes-travaux',    label: 'Travaux',       icon: Wrench,       color: '#fce7f3', iconColor: '#be185d' },
  { href: '/mes-votes',      label: 'Votes',         icon: Vote,         color: '#ede9fe', iconColor: '#7c3aed' },
  { href: '/mes-messages',   label: 'Messages',      icon: MessageCircle,color: '#f1f5f9', iconColor: '#475569' },
  { href: '/mes-contacts',   label: 'Annuaire',      icon: BookUser,     color: '#ecfdf5', iconColor: '#059669' },
]

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
  const prenom = profile?.prenom ?? 'vous'

  // ── Cas sans lot ───────────────────────────────────────────────
  if (!lotId) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bonjour, {prenom} 👋</h1>
          <p className="text-slate-500 text-sm mt-0.5">Espace copropriétaire</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserX className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Aucun lot associé</h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
            Votre compte n&apos;est pas encore lié à un logement. Contactez votre syndic pour finaliser la configuration.
          </p>
          <Link href="/mes-messages"
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors">
            <MessageCircle className="w-4 h-4" />
            Contacter le syndic
          </Link>
        </div>
      </div>
    )
  }

  // ── Requêtes ───────────────────────────────────────────────────
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
    { data: conseilEntry },
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
    // Vérifier si cet utilisateur est membre du conseil syndical
    coproprieteId && profile?.email
      ? supabase.from('conseil_syndical')
          .select('id, role')
          .eq('copropriete_id', coproprieteId)
          .eq('email', profile.email)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const montantDu = (appels ?? []).reduce(
    (s: number, a) => s + (a.montant - (a.montant_paye ?? 0)), 0
  )
  const prochainAppel = (appels ?? [])[0]
  const hasOverdue = (appels ?? []).some((a) => new Date(a.date_echeance) < new Date())

  // ── Statut charges ─────────────────────────────────────────────
  type StatusBanner = { bg: string; border: string; accent: string; icon: React.ReactNode; title: string; subtitle: string }
  let statusBanner: StatusBanner

  if (montantDu > 0 && hasOverdue) {
    statusBanner = {
      bg: '#fff1f2', border: '#fecdd3', accent: '#e11d48',
      icon: <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
      title: `${formatEuro(montantDu)} en retard`,
      subtitle: 'Échéance dépassée — contactez votre syndic si vous avez payé',
    }
  } else if (montantDu > 0) {
    statusBanner = {
      bg: '#fffbeb', border: '#fde68a', accent: '#d97706',
      icon: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
      title: `${formatEuro(montantDu)} à régler`,
      subtitle: prochainAppel
        ? `Échéance le ${formatDate(prochainAppel.date_echeance)}`
        : 'Consultez votre espace charges',
    }
  } else {
    statusBanner = {
      bg: '#f0fdf4', border: '#bbf7d0', accent: '#16a34a',
      icon: <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />,
      title: 'Compte à jour',
      subtitle: prochainAG
        ? `Prochaine AG : ${new Date(prochainAG.date_ag).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
        : 'Aucun paiement en attente',
    }
  }

  // ── Activité récente ───────────────────────────────────────────
  type FeedItem = { id: string; icon: React.ReactNode; text: string; sub?: string; date: string; href?: string }
  const feedItems: FeedItem[] = []

  ;(documents ?? []).forEach((doc: Document) => {
    if (!doc.created_at) return
    feedItems.push({ id: `doc-${doc.id}`, icon: <FileText className="w-3.5 h-3.5 text-blue-500" />, text: doc.nom, sub: 'Nouveau document', date: doc.created_at, href: '/mes-documents' })
  })
  ;(sinistres ?? []).forEach((s: { id: string; titre: string; status: string | null; reference: string | null; created_at: string | null }) => {
    if (!s.created_at) return
    feedItems.push({ id: `sin-${s.id}`, icon: <Wrench className="w-3.5 h-3.5 text-amber-500" />, text: s.titre, sub: `Dossier ${s.reference ?? ''} · ${s.status ?? ''}`, date: s.created_at, href: '/mes-travaux' })
  })
  ;(notifications ?? []).slice(0, 5).forEach((n) => {
    if (!n.created_at) return
    feedItems.push({
      id: `notif-${n.id}`,
      icon: <Bell className={`w-3.5 h-3.5 ${n.type === 'urgent' ? 'text-rose-500' : n.type === 'alerte' ? 'text-amber-500' : 'text-slate-400'}`} />,
      text: n.titre, sub: n.message ?? undefined, date: n.created_at, href: n.lien ?? undefined,
    })
  })
  feedItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const recentFeed = feedItems.slice(0, 6)

  // ── Welcome screen : profil récent (< 7 jours) sans activité ──
  const profileAge = profile?.created_at
    ? (Date.now() - new Date(profile.created_at).getTime()) / 86400000
    : 999
  const isNewUser = profileAge < 7 && recentFeed.length === 0 && (appels ?? []).length === 0

  return (
    <div className="max-w-2xl mx-auto space-y-5 py-2">

      {/* ── En-tête ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900" style={{ letterSpacing: '-0.03em' }}>
          Bonjour, {prenom} 👋
        </h1>
        {lot?.copropriete && (
          <p className="text-slate-400 text-sm mt-0.5">
            {lot.copropriete.nom}
            {lot.numero && ` · Lot ${lot.numero}`}
            {lot.copropriete.ville && ` · ${lot.copropriete.ville}`}
          </p>
        )}
      </div>

      {/* ── Welcome screen premier login ── */}
      {isNewUser && (
        <div className="rounded-2xl border overflow-hidden shadow-sm"
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', borderColor: '#1e3a5f' }}>
          <div className="px-5 py-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.12)' }}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-white">Bienvenue sur votre portail !</p>
                <p className="text-sm text-white/60 mt-1 leading-relaxed">
                  Votre espace est prêt. Dès que votre syndic aura configuré vos informations, vous retrouverez ici vos charges, documents, et les actualités de votre copropriété.
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link href="/mes-messages"
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}>
                <MessageCircle className="w-4 h-4 flex-shrink-0" />
                <span>Contacter le syndic</span>
              </Link>
              <Link href="/mon-compte"
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
                <User className="w-4 h-4 flex-shrink-0" />
                <span>Mon compte</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Badge Conseil syndical ── */}
      {conseilEntry && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
          style={{ background: '#fefce8', borderColor: '#fde68a' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#fef3c7' }}>
            <Crown className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-900">
              {CONSEIL_ROLE_LABELS[(conseilEntry as { id: string; role: string }).role] ?? 'Membre du conseil syndical'}
            </p>
            <p className="text-xs text-amber-700/70 mt-0.5">
              Vous avez accès aux documents et informations de toute la copropriété
            </p>
          </div>
        </div>
      )}

      {/* ── Signalement Express ── */}
      <Link
        href="/signaler"
        className="flex items-center gap-4 bg-slate-900 rounded-2xl px-5 py-4 text-white hover:bg-slate-800 transition-all group shadow-sm"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/15">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">Signaler un problème</p>
          <p className="text-xs text-white/60 mt-0.5">Photo + description → votre syndic est alerté instantanément</p>
        </div>
        <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors flex-shrink-0" />
      </Link>

      {/* ── Bandeau statut charges ── */}
      <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border"
        style={{ background: statusBanner.bg, borderColor: statusBanner.border }}>
        {statusBanner.icon}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">{statusBanner.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{statusBanner.subtitle}</p>
        </div>
        {montantDu > 0 && (
          <Link href="/mes-charges"
            className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            Voir <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      {/* ── Raccourcis (6 tuiles) ── */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Accès rapide</p>
        <div className="grid grid-cols-3 gap-3">
          {SHORTCUTS.map(({ href, label, icon: Icon, color, iconColor }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all group text-center shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: color }}>
                <Icon className="w-5 h-5" style={{ color: iconColor }} />
              </div>
              <span className="text-xs font-semibold text-slate-700 leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Fonds de travaux ── */}
      {!isNewUser && !fondsTravaux && coproprieteId && (
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border bg-white border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#f1f5f9' }}>
            <Landmark className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Fonds de travaux ALUR</p>
            <p className="text-sm text-slate-400 mt-0.5">Données non disponibles — contactez votre syndic</p>
          </div>
        </div>
      )}
      {fondsTravaux && (
        <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#e0f2fe' }}>
                <Landmark className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Fonds de travaux ALUR</p>
                <p className="text-xl font-bold text-blue-600">{formatEuro(fondsTravaux.solde_actuel ?? 0)}</p>
              </div>
            </div>
            {fondsTravaux.objectif_5ans && fondsTravaux.objectif_5ans > 0 && (
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-slate-400 mb-1.5">Objectif : {formatEuro(fondsTravaux.objectif_5ans)}</p>
                <div className="w-28 h-1.5 bg-blue-50 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.round(((fondsTravaux.solde_actuel ?? 0) / fondsTravaux.objectif_5ans) * 100))}%` }} />
                </div>
                <p className="text-xs text-blue-600 font-semibold mt-1">
                  {Math.min(100, Math.round(((fondsTravaux.solde_actuel ?? 0) / fondsTravaux.objectif_5ans) * 100))}%
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Prochaine AG ── */}
      {prochainAG && (
        <Link href="/mes-assemblees"
          className="flex items-center gap-4 bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm hover:border-slate-300 hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#fef3c7' }}>
            <Calendar className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 font-medium">Prochaine assemblée générale</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">{prochainAG.titre}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {new Date(prochainAG.date_ag).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              {prochainAG.lieu && ` · ${prochainAG.lieu}`}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
        </Link>
      )}

      {/* ── Activité récente ── */}
      {recentFeed.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Activité récente</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {recentFeed.map((item) => {
              const inner = (
                <>
                  <div className="w-7 h-7 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.text}</p>
                    {item.sub && <p className="text-xs text-slate-400 mt-0.5 truncate">{item.sub}</p>}
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">{timeAgo(item.date)}</span>
                </>
              )
              return item.href ? (
                <Link key={item.id} href={item.href} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                  {inner}
                </Link>
              ) : (
                <div key={item.id} className="flex items-center gap-3 px-5 py-3">{inner}</div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── État vide ── */}
      {recentFeed.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Bell className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Aucune activité récente</p>
          <p className="text-xs text-slate-400 mt-1">Documents et notifications de votre syndic apparaîtront ici.</p>
        </div>
      )}
    </div>
  )
}
