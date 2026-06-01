import Link from 'next/link'
import {
  Flag, Wrench, FileText, BookUser, MessageCircle,
  ArrowRight, CheckCircle2, Clock, AlertTriangle, Home,
} from 'lucide-react'

interface SinistreLite {
  id: string
  titre: string
  status: string
  created_at: string | null
}

interface Props {
  prenom: string | null
  coproprieteNom: string | null
  lotNumero: string | null
  signalements: SinistreLite[]
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  signale:             { label: 'Signalé',          cls: 'bg-amber-50 text-amber-700' },
  urgence:             { label: 'Urgence',          cls: 'bg-red-50 text-red-700' },
  assurance_declaree:  { label: 'Assurance',        cls: 'bg-blue-50 text-blue-700' },
  expertise:           { label: 'Expertise',        cls: 'bg-blue-50 text-blue-700' },
  travaux:             { label: 'Travaux en cours', cls: 'bg-indigo-50 text-indigo-700' },
  cloture:             { label: 'Clôturé',          cls: 'bg-green-50 text-green-700' },
}

const SHORTCUTS = [
  { href: '/signaler',      label: 'Signaler',         icon: Flag,          color: '#fee2e2', iconColor: '#dc2626' },
  { href: '/mes-travaux',   label: 'Mes signalements', icon: Wrench,        color: '#fce7f3', iconColor: '#be185d' },
  { href: '/mes-documents', label: 'Documents',        icon: FileText,      color: '#f0fdf4', iconColor: '#16a34a' },
  { href: '/mes-contacts',  label: 'Annuaire',         icon: BookUser,      color: '#ecfdf5', iconColor: '#059669' },
  { href: '/mes-messages',  label: 'Messages',         icon: MessageCircle, color: '#f1f5f9', iconColor: '#475569' },
]

export function TenantHome({ prenom, coproprieteNom, lotNumero, signalements }: Props) {
  const enCours = signalements.filter(s => s.status !== 'cloture')

  return (
    <div className="max-w-3xl mx-auto py-2 space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
          Bonjour {prenom ?? ''} 👋
        </h1>
        <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-1.5">
          <Home className="w-3.5 h-3.5" />
          {coproprieteNom ?? 'Votre résidence'}{lotNumero && ` · Lot ${lotNumero}`}
        </p>
      </div>

      {/* CTA Signaler — proéminent */}
      <Link
        href="/signaler"
        className="group flex items-center gap-4 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md transition-all"
        style={{ background: '#0f172a' }}
      >
        <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
          <Flag className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-white">Signaler un problème</p>
          <p className="text-sm text-white/60">Une fuite, une panne, un souci ? Prévenez votre syndic en 30 s.</p>
        </div>
        <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      </Link>

      {/* Raccourcis */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {SHORTCUTS.map(({ href, label, icon: Icon, color, iconColor }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-2 bg-white rounded-2xl border border-slate-200 p-3.5 hover:border-slate-300 hover:shadow-sm transition-all text-center"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color }}>
              <Icon className="w-5 h-5" style={{ color: iconColor }} />
            </div>
            <span className="text-xs font-medium text-slate-600 leading-tight">{label}</span>
          </Link>
        ))}
      </div>

      {/* Mes signalements en cours */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center">
              <Wrench className="w-3.5 h-3.5 text-pink-600" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Mes signalements</h2>
          </div>
          <Link href="/mes-travaux" className="text-xs font-medium text-slate-400 hover:text-slate-700 flex items-center gap-1">
            Tout voir <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {signalements.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600">Aucun signalement</p>
            <p className="text-xs text-slate-400 mt-0.5">Tout va bien ! Signalez un problème dès qu&apos;il survient.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {signalements.slice(0, 4).map((s) => {
              const st = STATUS_LABEL[s.status] ?? { label: s.status, cls: 'bg-slate-100 text-slate-600' }
              return (
                <div key={s.id} className="px-5 py-3.5 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    s.status === 'cloture' ? 'bg-green-50' : s.status === 'urgence' ? 'bg-red-50' : 'bg-amber-50'
                  }`}>
                    {s.status === 'cloture'
                      ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                      : s.status === 'urgence'
                        ? <AlertTriangle className="w-4 h-4 text-red-600" />
                        : <Clock className="w-4 h-4 text-amber-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{s.titre}</p>
                    {s.created_at && <p className="text-xs text-slate-400">{new Date(s.created_at).toLocaleDateString('fr-FR')}</p>}
                  </div>
                  <span className={`flex-shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {enCours.length > 0 && (
        <p className="text-xs text-slate-400 text-center">
          {enCours.length} signalement{enCours.length > 1 ? 's' : ''} en cours de traitement par votre syndic.
        </p>
      )}
    </div>
  )
}
