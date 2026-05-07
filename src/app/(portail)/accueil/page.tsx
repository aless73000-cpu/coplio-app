import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  CreditCard,
  FileText,
  Wrench,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Bell,
  Plus,
} from 'lucide-react'
import { formatEuro, formatDate } from '@/lib/utils'
import type { AppelCharges, Document, Sinistre, Notification } from '@/types'

export default async function AccueilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, lot:lots(id, numero, type, etage, copropriete:coproprietes(id, nom, adresse, ville))')
    .eq('id', user.id)
    .single()

  const lotId = profile?.lot_id
  const lot = profile?.lot as {
    id: string
    numero: string
    type: string
    etage?: string
    copropriete: { id: string; nom: string; adresse?: string; ville?: string }
  } | null

  // Charges à régler
  const { data: appels } = lotId
    ? await supabase
        .from('appels_charges')
        .select('*')
        .eq('lot_id', lotId)
        .eq('paye', false)
        .order('date_echeance', { ascending: true })
        .limit(3)
    : { data: [] }

  const montantDu = (appels ?? []).reduce(
    (s: number, a: AppelCharges) => s + (a.montant - a.montant_paye),
    0
  )
  const prochainAppel = (appels ?? [])[0] as AppelCharges | undefined

  // Documents récents
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('visible_coproprietaires', true)
    .or(`lot_id.eq.${lotId ?? 'null'},lot_id.is.null`)
    .order('created_at', { ascending: false })
    .limit(3)

  // Sinistres en cours
  const { data: sinistres } = lotId
    ? await supabase
        .from('sinistres')
        .select('id, titre, status, reference')
        .contains('lots_concernes', [lotId])
        .neq('status', 'cloture')
        .order('created_at', { ascending: false })
        .limit(3)
    : { data: [] }

  // Notifications non lues
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('lu', false)
    .order('created_at', { ascending: false })
    .limit(5)

  const nbNotifs = notifications?.length ?? 0

  const prenom = profile?.prenom ?? 'Bienvenue'

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="bg-coplio-green px-6 pt-12 pb-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-white/70 text-sm">Bonjour,</p>
            <h1 className="text-2xl font-bold mt-0.5">{prenom} 👋</h1>
            {lot?.copropriete && (
              <p className="text-white/70 text-sm mt-1">
                {lot.copropriete.nom} · Lot {lot.numero}
              </p>
            )}
          </div>

          {/* Cloche notifs */}
          <Link href="/mes-messages" className="relative mt-1">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            {nbNotifs > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-coplio-amber rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                {nbNotifs > 9 ? '9+' : nbNotifs}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="px-4 space-y-5 -mt-4">
        {/* Card solde */}
        <div className={`rounded-2xl shadow-sm border p-5 ${
          montantDu > 0
            ? 'bg-coplio-red-bg border-coplio-red/20'
            : 'bg-white border-border'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Solde à régler</p>
              <p className={`text-3xl font-bold mt-1 ${montantDu > 0 ? 'text-coplio-red' : 'text-coplio-green'}`}>
                {formatEuro(montantDu)}
              </p>
              {prochainAppel && (
                <p className="text-xs text-muted-foreground mt-1">
                  Prochain appel : {prochainAppel.libelle} — {formatDate(prochainAppel.date_echeance)}
                </p>
              )}
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              montantDu > 0 ? 'bg-coplio-red/10' : 'bg-coplio-green-light'
            }`}>
              {montantDu > 0
                ? <AlertTriangle className="w-7 h-7 text-coplio-red" />
                : <CheckCircle2 className="w-7 h-7 text-coplio-green" />
              }
            </div>
          </div>
          <Link
            href="/mes-charges"
            className={`mt-4 flex items-center gap-1 text-sm font-medium ${
              montantDu > 0 ? 'text-coplio-red' : 'text-coplio-green'
            }`}
          >
            Voir mes charges <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Raccourcis */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/mes-documents"
            className="bg-white border border-border rounded-2xl p-4 flex flex-col gap-2 active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 bg-coplio-green-light rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-coplio-green" />
            </div>
            <div>
              <p className="font-semibold text-sm text-coplio-text">Documents</p>
              <p className="text-xs text-muted-foreground">
                {documents?.length ?? 0} disponible{(documents?.length ?? 0) > 1 ? 's' : ''}
              </p>
            </div>
          </Link>

          <Link
            href="/mes-travaux"
            className="bg-white border border-border rounded-2xl p-4 flex flex-col gap-2 active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 bg-coplio-amber-bg rounded-xl flex items-center justify-center">
              <Wrench className="w-5 h-5 text-coplio-amber" />
            </div>
            <div>
              <p className="font-semibold text-sm text-coplio-text">Travaux</p>
              <p className="text-xs text-muted-foreground">
                {sinistres?.length ?? 0} dossier{(sinistres?.length ?? 0) > 1 ? 's' : ''} en cours
              </p>
            </div>
          </Link>

          <Link
            href="/mes-messages"
            className="bg-white border border-border rounded-2xl p-4 flex flex-col gap-2 active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 bg-coplio-blue-bg rounded-xl flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-coplio-blue" />
            </div>
            <div>
              <p className="font-semibold text-sm text-coplio-text">Messages</p>
              <p className="text-xs text-muted-foreground">
                {nbNotifs > 0 ? `${nbNotifs} non lu${nbNotifs > 1 ? 's' : ''}` : 'Aucun nouveau'}
              </p>
            </div>
          </Link>

          <Link
            href="/mes-travaux?nouveau=1"
            className="bg-coplio-green border border-coplio-green rounded-2xl p-4 flex flex-col gap-2 active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm text-white">Signaler</p>
              <p className="text-xs text-white/70">un problème</p>
            </div>
          </Link>
        </div>

        {/* Documents récents */}
        {documents && documents.length > 0 && (
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-coplio-bg">
              <h2 className="font-semibold text-sm text-coplio-text">Documents récents</h2>
              <Link href="/mes-documents" className="text-xs text-coplio-green font-medium flex items-center gap-0.5">
                Tout voir <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {(documents as Document[]).map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 bg-coplio-green-light rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-coplio-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-coplio-text truncate">{doc.nom}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(doc.created_at)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sinistres en cours */}
        {sinistres && sinistres.length > 0 && (
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-coplio-bg">
              <h2 className="font-semibold text-sm text-coplio-text">Travaux en cours</h2>
              <Link href="/mes-travaux" className="text-xs text-coplio-green font-medium flex items-center gap-0.5">
                Tout voir <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {(sinistres as Pick<Sinistre, 'id' | 'titre' | 'status' | 'reference'>[]).map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 bg-coplio-amber-bg rounded-lg flex items-center justify-center flex-shrink-0">
                    <Wrench className="w-4 h-4 text-coplio-amber" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-coplio-text truncate">{s.titre}</p>
                    <p className="text-xs text-muted-foreground">{s.reference}</p>
                  </div>
                  <span className="badge-attention flex-shrink-0 text-[10px]">{s.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notifications récentes */}
        {notifications && notifications.length > 0 && (
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-coplio-bg">
              <h2 className="font-semibold text-sm text-coplio-text">Notifications</h2>
            </div>
            <div className="divide-y divide-border">
              {(notifications as Notification[]).map((notif) => (
                <div key={notif.id} className="flex items-start gap-3 px-4 py-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    notif.type === 'urgent' ? 'bg-coplio-red' :
                    notif.type === 'alerte' ? 'bg-coplio-amber' :
                    'bg-coplio-green'
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
          </div>
        )}
      </div>
    </div>
  )
}
