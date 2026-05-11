import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, CreditCard, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { formatEuro, formatDate, getOverdueDays } from '@/lib/utils'
import { PayerButton } from '@/components/syndic/PayerButton'
import type { AppelCharges, Lot, Copropriete } from '@/types'

type AppelWithDetails = AppelCharges & {
  lot?: Pick<Lot, 'id' | 'numero' | 'etage'>
  copropriete?: Pick<Copropriete, 'id' | 'nom'>
}

export default async function AppelsChargesPage({
  searchParams,
}: {
  searchParams: { copropriete?: string; statut?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()

  const { data: coproprietes } = await supabase
    .from('coproprietes')
    .select('id')
    .eq('cabinet_id', profile?.cabinet_id ?? '')

  const coproprieteIds = (coproprietes ?? []).map((c) => c.id)

  let query = supabase
    .from('appels_charges')
    .select(`
      *,
      lot:lots(id, numero, etage),
      copropriete:coproprietes(id, nom)
    `)
    .in('copropriete_id', coproprieteIds.length > 0 ? coproprieteIds : ['none'])
    .order('date_echeance', { ascending: false })

  if (searchParams.copropriete) {
    query = query.eq('copropriete_id', searchParams.copropriete)
  }
  if (searchParams.statut === 'paye') {
    query = query.eq('paye', true)
  } else if (searchParams.statut === 'impaye') {
    query = query.eq('paye', false)
  }

  const { data: appels } = await query.limit(100)

  const stats = {
    total: appels?.length ?? 0,
    payes: (appels ?? []).filter((a) => a.paye).length,
    enRetard: (appels ?? []).filter(
      (a) => !a.paye && new Date(a.date_echeance) < new Date()
    ).length,
    montantDu: (appels ?? []).reduce(
      (s, a) => (!a.paye ? s + (a.montant - a.montant_paye) : s),
      0
    ),
  }

  // Récupérer les copropriétés pour le filtre
  const { data: coprops } = await supabase
    .from('coproprietes')
    .select('id, nom')
    .eq('cabinet_id', profile?.cabinet_id ?? '')
    .order('nom')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Appels de charges</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {stats.total} appel{stats.total > 1 ? 's' : ''} · {stats.enRetard} en retard
          </p>
        </div>
        <Link
          href="/appels-charges/new"
          className="flex items-center gap-2 bg-coplio-green text-white px-4 py-2.5 rounded-lg
                     text-sm font-medium hover:bg-coplio-green/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvel appel
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="coplio-card flex items-center gap-3">
          <div className="w-10 h-10 bg-coplio-green-light rounded-xl flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-coplio-green" />
          </div>
          <div>
            <p className="text-2xl font-bold text-coplio-text">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>
        <div className="coplio-card flex items-center gap-3">
          <div className="w-10 h-10 bg-coplio-green-light rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-coplio-green" />
          </div>
          <div>
            <p className="text-2xl font-bold text-coplio-text">{stats.payes}</p>
            <p className="text-xs text-muted-foreground">Payés</p>
          </div>
        </div>
        <div className="coplio-card flex items-center gap-3">
          <div className="w-10 h-10 bg-coplio-red-bg rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-coplio-red" />
          </div>
          <div>
            <p className="text-2xl font-bold text-coplio-red">{stats.enRetard}</p>
            <p className="text-xs text-muted-foreground">En retard</p>
          </div>
        </div>
        <div className="coplio-card flex items-center gap-3">
          <div className="w-10 h-10 bg-coplio-amber-bg rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-coplio-amber" />
          </div>
          <div>
            <p className="text-xl font-bold text-coplio-amber">{formatEuro(stats.montantDu)}</p>
            <p className="text-xs text-muted-foreground">À recouvrer</p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex gap-2">
          {[
            { label: 'Tous', value: '' },
            { label: 'Payés', value: 'paye' },
            { label: 'Impayés', value: 'impaye' },
          ].map(({ label, value }) => (
            <Link
              key={value}
              href={`/appels-charges${value ? `?statut=${value}` : ''}${searchParams.copropriete ? `${value ? '&' : '?'}copropriete=${searchParams.copropriete}` : ''}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                (searchParams.statut ?? '') === value
                  ? 'bg-coplio-green text-white border-coplio-green'
                  : 'bg-white text-coplio-text border-border hover:border-coplio-green/30'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {coprops && coprops.length > 1 && (
          <div className="ml-auto flex gap-1 flex-wrap">
            <Link
              href={`/appels-charges${searchParams.statut ? `?statut=${searchParams.statut}` : ''}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                !searchParams.copropriete
                  ? 'bg-coplio-green text-white border-coplio-green'
                  : 'bg-white text-coplio-text border-border hover:border-coplio-green/30'
              }`}
            >
              Toutes
            </Link>
            {coprops.map((c) => (
              <Link
                key={c.id}
                href={`/appels-charges?copropriete=${c.id}${searchParams.statut ? `&statut=${searchParams.statut}` : ''}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  searchParams.copropriete === c.id
                    ? 'bg-coplio-green text-white border-coplio-green'
                    : 'bg-white text-coplio-text border-border hover:border-coplio-green/30'
                }`}
              >
                {c.nom}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Tableau */}
      {(!appels || appels.length === 0) ? (
        <div className="coplio-card text-center py-16">
          <div className="w-14 h-14 bg-coplio-green-light rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-7 h-7 text-coplio-green" />
          </div>
          <h3 className="font-semibold text-coplio-text mb-1">Aucun appel de charges</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Créez votre premier appel de charges pour l&apos;envoyer aux copropriétaires.
          </p>
          <Link
            href="/appels-charges/new"
            className="inline-flex items-center gap-2 bg-coplio-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-coplio-green/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Créer un appel de charges
          </Link>
        </div>
      ) : (
        <div className="coplio-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Libellé', 'Copropriété / Lot', 'Montant', 'Échéance', 'Retard', 'Statut', 'Action'].map((h) => (
                  <th key={h} className="text-left py-2.5 text-xs text-muted-foreground font-medium first:pl-1">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(appels as AppelWithDetails[]).map((appel) => {
                const overdue = !appel.paye ? getOverdueDays(appel.date_echeance) : 0
                const isLate = !appel.paye && new Date(appel.date_echeance) < new Date()
                const restant = appel.montant - appel.montant_paye

                return (
                  <tr key={appel.id} className="border-b border-border hover:bg-coplio-bg transition-colors">
                    <td className="py-3 pl-1">
                      <p className="font-medium text-coplio-text">{appel.libelle}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(appel.date_appel)}</p>
                    </td>
                    <td className="py-3">
                      <p className="text-coplio-text">{(appel.copropriete as { nom?: string })?.nom}</p>
                      <p className="text-xs text-muted-foreground">
                        Lot {appel.lot?.numero}
                        {appel.lot?.etage && ` · ${appel.lot.etage}`}
                      </p>
                    </td>
                    <td className="py-3">
                      <p className="font-medium text-coplio-text">{formatEuro(appel.montant)}</p>
                      {appel.montant_paye > 0 && !appel.paye && (
                        <p className="text-xs text-muted-foreground">Reste {formatEuro(restant)}</p>
                      )}
                    </td>
                    <td className="py-3 text-muted-foreground">{formatDate(appel.date_echeance)}</td>
                    <td className="py-3">
                      {isLate ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full badge-urgent">
                          J+{overdue}
                        </span>
                      ) : appel.paye ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-coplio-blue-bg text-coplio-blue">
                          À venir
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      {appel.paye ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-coplio-green">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Payé
                        </span>
                      ) : (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          isLate ? 'badge-urgent' : 'badge-attention'
                        }`}>
                          {isLate ? 'En retard' : 'En attente'}
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      {!appel.paye && <PayerButton appelId={appel.id} />}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
