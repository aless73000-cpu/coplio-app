import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, CreditCard, CheckCircle2, Clock, AlertTriangle, FileDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatEuro, formatDate, getOverdueDays } from '@/lib/utils'
import { PayerButton } from '@/components/syndic/PayerButton'
import { ExportAppelsButton } from '@/components/syndic/ExportAppelsButton'
import type { AppelCharges, Lot, Copropriete } from '@/types'

type AppelWithDetails = AppelCharges & {
  lot?: Pick<Lot, 'id' | 'numero' | 'etage'>
  copropriete?: Pick<Copropriete, 'id' | 'nom'>
}

const PAGE_SIZE = 50

export default async function AppelsChargesPage({
  searchParams,
}: {
  searchParams: { copropriete?: string; statut?: string; page?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()

  // Une seule requête coproprietes avec nom pour le filtre ET les IDs pour la clause IN
  const { data: coprops } = await supabase
    .from('coproprietes')
    .select('id, nom')
    .eq('cabinet_id', profile?.cabinet_id ?? '')
    .order('nom')

  const coproprieteIds = (coprops ?? []).map((c) => c.id)

  const page = Math.max(0, parseInt(searchParams.page ?? '0', 10) || 0)
  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('appels_charges')
    .select(`
      *,
      lot:lots(id, numero, etage),
      copropriete:coproprietes(id, nom)
    `, { count: 'exact' })
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

  const { data: appels, count } = await query.range(from, to)
  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const stats = {
    total: totalCount,
    payes: (appels ?? []).filter((a) => a.paye).length,
    enRetard: (appels ?? []).filter(
      (a) => !a.paye && new Date(a.date_echeance) < new Date()
    ).length,
    montantDu: (appels ?? []).reduce(
      (s, a) => (!a.paye ? s + (a.montant - (a.montant_paye ?? 0)) : s),
      0
    ),
  }

  // Construit l'URL de pagination en préservant les filtres existants
  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (searchParams.copropriete) params.set('copropriete', searchParams.copropriete)
    if (searchParams.statut) params.set('statut', searchParams.statut)
    if (p > 0) params.set('page', String(p))
    const qs = params.toString()
    return `/appels-charges${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-coplio-text">Appels de charges</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {totalCount} appel{totalCount > 1 ? 's' : ''} · {stats.enRetard} en retard
            {totalPages > 1 && ` · page ${page + 1}/${totalPages}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {appels && appels.length > 0 && (
            <ExportAppelsButton appels={appels as AppelWithDetails[]} />
          )}
          <Link
            href="/appels-charges/new"
            className="flex items-center gap-2 bg-[#111827] text-white px-3 py-2 rounded-lg
                       text-sm font-medium hover:bg-[#111827]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouvel appel</span>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="coplio-card flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-[#111827]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-coplio-text">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>
        <div className="coplio-card flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-[#111827]" />
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
                  ? 'bg-[#111827] text-white border-[#111827]'
                  : 'bg-white text-coplio-text border-border hover:border-[#111827]/30'
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
                  ? 'bg-[#111827] text-white border-[#111827]'
                  : 'bg-white text-coplio-text border-border hover:border-[#111827]/30'
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
                    ? 'bg-[#111827] text-white border-[#111827]'
                    : 'bg-white text-coplio-text border-border hover:border-[#111827]/30'
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
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-7 h-7 text-[#111827]" />
          </div>
          <h3 className="font-semibold text-coplio-text mb-1">Aucun appel de charges</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Créez votre premier appel de charges pour l&apos;envoyer aux copropriétaires.
          </p>
          <Link
            href="/appels-charges/new"
            className="inline-flex items-center gap-2 bg-[#111827] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#111827]/90 transition-colors"
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
                {[
                  { label: 'Libellé' },
                  { label: 'Copropriété / Lot', mobile: false },
                  { label: 'Montant' },
                  { label: 'Échéance', mobile: false },
                  { label: 'Retard', mobile: false },
                  { label: 'Statut' },
                  { label: 'Action' },
                ].map(({ label, mobile = true }) => (
                  <th key={label} className={`text-left py-2.5 text-xs text-muted-foreground font-medium first:pl-1${mobile ? '' : ' hidden md:table-cell'}`}>{label}</th>
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
                    <td className="py-3 hidden md:table-cell">
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
                    <td className="py-3 text-muted-foreground hidden md:table-cell">{formatDate(appel.date_echeance)}</td>
                    <td className="py-3 hidden md:table-cell">
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
                        <span className="flex items-center gap-1 text-xs font-medium text-[#111827]">
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
                      <div className="flex items-center gap-2">
                        {!appel.paye && <PayerButton appelId={appel.id} />}
                        <a
                          href={`/api/appels-charges/${appel.id}/pdf`}
                          download
                          title="Télécharger le PDF"
                          className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-slate-100 transition-colors text-muted-foreground hover:text-[#111827]"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">
            {from + 1}–{Math.min(from + PAGE_SIZE, totalCount)} sur {totalCount}
          </p>
          <div className="flex items-center gap-2">
            {page > 0 ? (
              <Link href={pageUrl(page - 1)} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-coplio-bg transition-colors">
                <ChevronLeft className="w-4 h-4" />Précédent
              </Link>
            ) : (
              <span className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-border opacity-40 cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />Précédent
              </span>
            )}
            {page < totalPages - 1 ? (
              <Link href={pageUrl(page + 1)} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-coplio-bg transition-colors">
                Suivant<ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-border opacity-40 cursor-not-allowed">
                Suivant<ChevronRight className="w-4 h-4" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
