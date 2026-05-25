import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Crown, TrendingUp, AlertTriangle, FileText,
  Wrench, CalendarDays, Users, ChevronRight,
  CheckCircle2, Euro, ArrowRight, Building2,
} from 'lucide-react'
import { formatEuro, formatDate } from '@/lib/utils'

export const metadata = { title: 'Espace conseil syndical' }

const CONSEIL_ROLE_LABELS: Record<string, string> = {
  president: 'Président',
  vice_president: 'Vice-président',
  tresorier: 'Trésorier',
  secretaire: 'Secrétaire',
  membre: 'Membre',
}

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  president:      { bg: '#fef3c7', text: '#92400e' },
  vice_president: { bg: '#ede9fe', text: '#5b21b6' },
  tresorier:      { bg: '#dcfce7', text: '#166534' },
  secretaire:     { bg: '#dbeafe', text: '#1e40af' },
  membre:         { bg: '#f1f5f9', text: '#334155' },
}

export default async function EspaceConseilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portail')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, lot:lots(id, numero, copropriete:coproprietes(id, nom))')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/portail')

  const lot = profile.lot as { id: string; numero: string; copropriete: { id: string; nom: string } } | null
  const coproprieteId = lot?.copropriete?.id

  // ── Vérification accès conseil syndical ─────────────────────
  const { data: conseilSelf } = coproprieteId && profile.email
    ? await supabase
        .from('conseil_syndical')
        .select('id, role')
        .eq('copropriete_id', coproprieteId)
        .eq('email', profile.email)
        .maybeSingle()
    : { data: null }

  if (!conseilSelf) redirect('/accueil')

  const myRole = (conseilSelf as { id: string; role: string }).role

  // ── Requêtes avec droits élargis (admin) ────────────────────
  const admin = createAdminClient()

  const [
    { data: appelsCharges },
    { data: sinistres },
    { data: documents },
    { data: conseilMembres },
    { data: prochainAG },
    { data: fondsTravaux },
    { data: copropriete },
  ] = await Promise.all([
    // Tous les appels de charges de la copropriété
    coproprieteId
      ? admin.from('appels_charges')
          .select('id, montant, montant_paye, paye, date_echeance, libelle')
          .eq('copropriete_id', coproprieteId)
      : Promise.resolve({ data: [] }),

    // Tous les sinistres actifs
    coproprieteId
      ? admin.from('sinistres')
          .select('id, titre, status, reference, created_at, lots_concernes')
          .eq('copropriete_id', coproprieteId)
          .neq('status', 'cloture')
          .order('created_at', { ascending: false })
          .limit(8)
      : Promise.resolve({ data: [] }),

    // Tous les documents (pas seulement ceux filtrés par lot)
    coproprieteId
      ? admin.from('documents')
          .select('id, nom, created_at, lot_id')
          .eq('copropriete_id', coproprieteId)
          .order('created_at', { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [] }),

    // Membres du conseil
    coproprieteId
      ? admin.from('conseil_syndical')
          .select('id, prenom, nom, role, email, telephone')
          .eq('copropriete_id', coproprieteId)
          .order('role')
      : Promise.resolve({ data: [] }),

    // Prochaine AG
    coproprieteId
      ? admin.from('assemblees_generales')
          .select('id, titre, date_ag, lieu, status')
          .eq('copropriete_id', coproprieteId)
          .gte('date_ag', new Date().toISOString())
          .order('date_ag', { ascending: true })
          .limit(3)
      : Promise.resolve({ data: [] }),

    // Fonds de travaux
    coproprieteId
      ? admin.from('fonds_travaux')
          .select('solde_actuel, objectif_5ans, annee')
          .eq('copropriete_id', coproprieteId)
          .order('annee', { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),

    // Infos copropriété
    coproprieteId
      ? admin.from('coproprietes')
          .select('nom, adresse, ville, nb_lots, nb_coproprietaires')
          .eq('id', coproprieteId)
          .single()
      : Promise.resolve({ data: null }),
  ])

  // ── Calculs financiers ───────────────────────────────────────
  const allAppels = (appelsCharges ?? []) as { montant: number; montant_paye: number; paye: boolean; date_echeance: string }[]
  const totalEmis = allAppels.reduce((s, a) => s + a.montant, 0)
  const totalRecouvre = allAppels.reduce((s, a) => s + a.montant_paye, 0)
  const totalImpayes = allAppels.filter(a => !a.paye).reduce((s, a) => s + (a.montant - a.montant_paye), 0)
  const tauxRecouvrement = totalEmis > 0 ? Math.round((totalRecouvre / totalEmis) * 100) : 100
  const nbImpayes = allAppels.filter(a => !a.paye && new Date(a.date_echeance) < new Date()).length

  const myRoleColors = ROLE_COLORS[myRole] ?? ROLE_COLORS.membre

  return (
    <div className="max-w-2xl mx-auto space-y-5 py-2">

      {/* ── En-tête ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: myRoleColors.bg }}>
            <Crown className="w-3.5 h-3.5" style={{ color: myRoleColors.text }} />
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: myRoleColors.bg, color: myRoleColors.text }}>
            {CONSEIL_ROLE_LABELS[myRole] ?? 'Membre'} du conseil syndical
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900" style={{ letterSpacing: '-0.03em' }}>
          Espace conseil
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">{copropriete?.nom}</p>
      </div>

      {/* ── KPIs financiers ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Taux de recouvrement */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Recouvrement</p>
          <p className={`text-3xl font-bold ${tauxRecouvrement >= 90 ? 'text-green-600' : tauxRecouvrement >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
            {tauxRecouvrement}%
          </p>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${tauxRecouvrement >= 90 ? 'bg-green-500' : tauxRecouvrement >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${tauxRecouvrement}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-1.5">{formatEuro(totalRecouvre)} / {formatEuro(totalEmis)}</p>
        </div>

        {/* Impayés */}
        <div className={`bg-white rounded-2xl border shadow-sm p-4 ${totalImpayes > 0 ? 'border-red-200' : 'border-slate-200'}`}>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Impayés</p>
          <p className={`text-3xl font-bold ${totalImpayes > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {totalImpayes > 0 ? formatEuro(totalImpayes) : '✓'}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            {nbImpayes > 0
              ? `${nbImpayes} échéance${nbImpayes > 1 ? 's' : ''} en retard`
              : totalImpayes > 0 ? 'En attente' : 'Aucun impayé'}
          </p>
        </div>

        {/* Fonds de travaux */}
        {fondsTravaux && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Fonds travaux</p>
            <p className="text-2xl font-bold text-blue-600">{formatEuro(fondsTravaux.solde_actuel ?? 0)}</p>
            {fondsTravaux.objectif_5ans && fondsTravaux.objectif_5ans > 0 && (
              <>
                <div className="mt-2 h-1.5 bg-blue-50 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.round(((fondsTravaux.solde_actuel ?? 0) / fondsTravaux.objectif_5ans) * 100))}%` }} />
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  Objectif {formatEuro(fondsTravaux.objectif_5ans)}
                </p>
              </>
            )}
          </div>
        )}

        {/* Copropriété info */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Copropriété</p>
          <p className="text-2xl font-bold text-slate-900">{copropriete?.nb_lots ?? '—'}</p>
          <p className="text-xs text-slate-400 mt-1">lots · {copropriete?.nb_coproprietaires ?? 0} copropriétaires</p>
        </div>
      </div>

      {/* ── Prochaines AG ── */}
      {(prochainAG ?? []).length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                <CalendarDays className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Prochaines assemblées générales</h2>
            </div>
            <Link href="/mes-assemblees" className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {(prochainAG ?? []).map((ag: { id: string; titre: string; date_ag: string; lieu?: string | null; status: string | null }) => (
              <div key={ag.id} className="px-5 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{ag.titre}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(ag.date_ag).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {ag.lieu && ` · ${ag.lieu}`}
                  </p>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-lg bg-amber-50 text-amber-700 flex-shrink-0">
                  {ag.status === 'planifiee' ? 'Planifiée' : 'Convocations envoyées'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Sinistres actifs ── */}
      {(sinistres ?? []).length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                <Wrench className="w-3.5 h-3.5 text-red-500" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">
                Sinistres en cours · {(sinistres ?? []).length}
              </h2>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {(sinistres ?? []).map((s: { id: string; titre: string; status: string | null; reference: string | null; created_at: string | null }) => (
              <div key={s.id} className="px-5 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{s.titre}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {s.reference && `Réf. ${s.reference} · `}
                    {s.created_at && formatDate(s.created_at)}
                  </p>
                </div>
                {s.status && (
                  <span className="text-xs font-medium px-2 py-1 rounded-lg bg-slate-100 text-slate-600 flex-shrink-0 capitalize">
                    {s.status.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Documents ── */}
      {(documents ?? []).length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Documents de la copropriété</h2>
            </div>
            <Link href="/mes-documents" className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {(documents ?? []).map((doc: { id: string; nom: string; created_at: string | null; lot_id?: string | null }) => (
              <div key={doc.id} className="px-5 py-3 flex items-center gap-3">
                <div className="w-7 h-7 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{doc.nom}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {doc.lot_id ? 'Document de lot' : 'Document commun'}
                    {doc.created_at && ` · ${formatDate(doc.created_at)}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Membres du conseil syndical ── */}
      {(conseilMembres ?? []).length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
              <Crown className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">
              Conseil syndical · {(conseilMembres ?? []).length} membre{(conseilMembres ?? []).length > 1 ? 's' : ''}
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {(conseilMembres ?? []).map((m: { id: string; prenom: string; nom: string; role: string | null; email?: string | null; telephone?: string | null }) => {
              const role = m.role ?? 'membre'
              const colors = ROLE_COLORS[role] ?? ROLE_COLORS.membre
              const isMe = m.email === profile.email
              return (
                <div key={m.id} className="px-5 py-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                    style={{ background: colors.bg, color: colors.text }}>
                    {m.prenom[0]}{m.nom[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{m.prenom} {m.nom}</p>
                      {isMe && <span className="text-xs text-slate-400">(vous)</span>}
                    </div>
                    {m.email && !isMe && (
                      <a href={`mailto:${m.email}`} className="text-xs text-blue-600 hover:underline truncate block">
                        {m.email}
                      </a>
                    )}
                    {m.telephone && !isMe && (
                      <a href={`tel:${m.telephone}`} className="text-xs text-slate-400 hover:text-slate-600">
                        {m.telephone}
                      </a>
                    )}
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ background: colors.bg, color: colors.text }}>
                    {CONSEIL_ROLE_LABELS[role] ?? role}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
