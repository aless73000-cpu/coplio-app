import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, User, Mail, Phone, CreditCard, CheckCircle2, AlertTriangle, Clock, UserPlus } from 'lucide-react'
import { formatEuro, formatDate } from '@/lib/utils'
import { LOT_TYPE_LABELS } from '@/types'
import type { AppelCharges } from '@/types'


export const metadata = { title: 'Détail lot' }

export default async function LotPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()
  if (!profile?.cabinet_id) redirect('/onboarding')

  const { data: lot } = await supabase
    .from('lots')
    .select('*, copropriete:coproprietes(id, nom, adresse, cabinet_id)')
    .eq('id', params.id)
    .single()

  if (!lot) notFound()

  // Vérifier que le lot appartient à ce cabinet (via sa copropriété)
  const copropCabinetId = (lot.copropriete as { cabinet_id?: string } | null)?.cabinet_id
  if (copropCabinetId && copropCabinetId !== profile.cabinet_id) notFound()

  // Copropriétaires liés à ce lot
  const { data: occupants } = await supabase
    .from('profiles')
    .select('id, prenom, nom, email, telephone, role, created_at')
    .eq('lot_id', params.id)
    .eq('cabinet_id', profile.cabinet_id)

  // Appels de charges de ce lot
  const { data: appels } = await supabase
    .from('appels_charges')
    .select('*')
    .eq('lot_id', params.id)
    .order('date_echeance', { ascending: false })
    .limit(10)

  const totalDu = (appels ?? []).reduce(
    (s: number, a) => (!a.paye ? s + (a.montant - (a.montant_paye ?? 0)) : s), 0
  )
  const dernierAppel = (appels ?? [])[0]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <Link href={`/coproprietes/${lot.copropriete?.id}/lots`} className="text-muted-foreground hover:text-coplio-text transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-coplio-text">Lot {lot.numero}</h1>
          <p className="text-muted-foreground text-sm">
            <Link href={`/coproprietes/${lot.copropriete?.id}`} className="hover:text-[#374151]">
              {lot.copropriete?.nom}
            </Link>
          </p>
        </div>
        <Link
          href={`/lots/${lot.id}/edit`}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm hover:bg-coplio-bg transition-colors"
        >
          <Edit className="w-4 h-4" />
          Modifier
        </Link>
      </div>

      {/* Infos + solde */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 coplio-card">
          <h2 className="font-semibold text-coplio-text mb-4">Informations</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {[
              { label: 'Type', value: LOT_TYPE_LABELS[lot.type as keyof typeof LOT_TYPE_LABELS] ?? lot.type },
              { label: 'Étage', value: lot.etage ?? '—' },
              { label: 'Surface', value: lot.surface ? `${lot.surface} m²` : '—' },
              { label: 'Tantièmes', value: lot.tantiemes?.toString() ?? '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-muted-foreground text-xs mb-0.5">{label}</dt>
                <dd className="font-medium text-coplio-text">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className={`coplio-card ${totalDu > 0 ? 'border-coplio-red/30 bg-coplio-red-bg' : 'border-[#374151]/20 bg-slate-100'}`}>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Solde dû</p>
          <p className={`text-2xl font-bold ${totalDu > 0 ? 'text-coplio-red' : 'text-[#374151]'}`}>
            {formatEuro(totalDu)}
          </p>
          {totalDu > 0 ? (
            <p className="text-xs text-coplio-red/70 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> À recouvrer
            </p>
          ) : (
            <p className="text-xs text-[#374151]/70 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> À jour
            </p>
          )}
          {dernierAppel && (
            <p className="text-xs text-muted-foreground mt-2">
              Dernier appel : {formatDate(dernierAppel.date_echeance)}
            </p>
          )}
        </div>
      </div>

      {/* Copropriétaires */}
      <div className="coplio-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-coplio-text">Occupants / Copropriétaires</h2>
          <Link
            href={`/coproprietaires/new?lot_id=${lot.id}&copropriete_id=${lot.copropriete?.id}`}
            className="flex items-center gap-1.5 text-xs font-medium text-[#374151] hover:underline"
          >
            <UserPlus className="w-3.5 h-3.5" /> Inviter
          </Link>
        </div>

        {!occupants || occupants.length === 0 ? (
          <div className="text-center py-8 bg-coplio-bg rounded-xl">
            <User className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-coplio-text">Aucun occupant assigné</p>
            <p className="text-xs text-muted-foreground mt-1">
              Invitez le copropriétaire pour qu&apos;il accède au portail.
            </p>
            <Link
              href={`/coproprietaires/new?lot_id=${lot.id}&copropriete_id=${lot.copropriete?.id}`}
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-[#374151] bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-[#374151] hover:text-white transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" /> Inviter un copropriétaire
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {occupants.map((p) => (
              <Link
                key={p.id}
                href={`/coproprietaires/${p.id}`}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-coplio-bg transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#374151] font-bold text-sm">
                    {`${p.prenom?.[0] ?? ''}${p.nom?.[0] ?? ''}`.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-coplio-text group-hover:text-[#374151] transition-colors">
                    {p.prenom} {p.nom}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {p.email && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                        <Mail className="w-3 h-3 flex-shrink-0" />{p.email}
                      </span>
                    )}
                    {p.telephone && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3 flex-shrink-0" />{p.telephone}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  Depuis {formatDate(p.created_at ?? '')}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Historique appels de charges */}
      <div className="coplio-card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-coplio-text flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
            Appels de charges récents
          </h2>
          <Link
            href={`/appels-charges?lot_id=${lot.id}`}
            className="text-xs text-[#374151] font-medium hover:underline"
          >
            Tout voir
          </Link>
        </div>

        {!appels || appels.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Aucun appel de charges</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-coplio-bg">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-6 py-3">Libellé</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3 hidden md:table-cell">Échéance</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">Montant</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide px-6 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(appels as AppelCharges[]).map((appel) => {
                const isLate = !appel.paye && new Date(appel.date_echeance) < new Date()
                return (
                  <tr key={appel.id} className="hover:bg-coplio-bg/50 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-coplio-text">{appel.libelle}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{formatDate(appel.date_echeance)}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-coplio-text">{formatEuro(appel.montant)}</td>
                    <td className="px-6 py-3 text-right">
                      {appel.paye ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#374151] bg-slate-100 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Payé
                        </span>
                      ) : isLate ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-coplio-red bg-coplio-red-bg px-2.5 py-1 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> En retard
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-coplio-amber bg-coplio-amber-bg px-2.5 py-1 rounded-full">
                          <Clock className="w-3 h-3" /> En attente
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  )
}
