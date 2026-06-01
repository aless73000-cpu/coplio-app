import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Plus, Receipt, AlertCircle, Clock, Building2 } from 'lucide-react'
import { formatDate, formatEuro } from '@/lib/utils'


export const metadata = { title: 'Factures' }

const STATUT_CONFIG: Record<string, { label: string; color: string }> = {
  recu:          { label: 'Reçue',        color: 'bg-blue-50 text-blue-700' },
  valide:        { label: 'Validée',      color: 'bg-amber-50 text-amber-700' },
  comptabilise:  { label: 'Comptabilisée', color: 'bg-slate-100 text-slate-600' },
  paye:          { label: 'Payée',        color: 'bg-emerald-50 text-emerald-700' },
  annule:        { label: 'Annulée',      color: 'bg-red-50 text-red-400' },
  en_retard:     { label: 'En retard',    color: 'bg-red-50 text-red-700' },
  partiel:       { label: 'Partiel',      color: 'bg-orange-50 text-orange-700' },
}

const TYPE_CONFIG: Record<string, { label: string }> = {
  facture: { label: 'Facture' },
  devis:   { label: 'Devis' },
  avoir:   { label: 'Avoir' },
}

const PAGE_SIZE = 50

export default async function FacturesPage(
  props: {
    searchParams: Promise<{
      copropriete?: string
      statut?: string
      type?: string
      page?: string
    }>
  }
) {
  const searchParams = await props.searchParams;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()
  if (!profile?.cabinet_id) redirect('/onboarding')

  const { data: coprops } = await supabase
    .from('coproprietes')
    .select('id, nom')
    .eq('cabinet_id', profile.cabinet_id)
    .order('nom')

  const selectedId = searchParams.copropriete ?? (coprops ?? [])[0]?.id ?? null

  const page = Math.max(0, parseInt(searchParams.page ?? '0', 10) || 0)
  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // Factures avec fournisseur et solde
  let query = supabase
    .from('factures')
    .select(`
      id, type_document, numero_facture, numero_interne, date_document,
      date_echeance, montant_ttc, statut, libelle,
      fournisseur:fournisseurs(nom)
    `, { count: 'exact' })
    .order('date_document', { ascending: false })

  if (selectedId)           query = query.eq('copropriete_id', selectedId)
  if (searchParams.statut)  query = query.eq('statut', searchParams.statut)
  if (searchParams.type)    query = query.eq('type_document', searchParams.type)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: factures, count } = await (query as any).range(from, to)
  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // KPIs rapides (sur la page courante pour perf)
  const today = new Date().toISOString().slice(0, 10)
  const { data: kpiData } = selectedId
    ? await supabase
        .from('factures')
        .select('statut, montant_ttc, date_echeance')
        .eq('copropriete_id', selectedId)
        .not('statut', 'eq', 'annule')
    : { data: null }

  const totalAttente = (kpiData ?? [])
    .filter(f => ['recu', 'valide'].includes(f.statut))
    .reduce((s, f) => s + (f.montant_ttc ?? 0), 0)

  const totalEnRetard = (kpiData ?? [])
    .filter(f => f.date_echeance && f.date_echeance < today && !['paye', 'annule'].includes(f.statut))
    .reduce((s, f) => s + (f.montant_ttc ?? 0), 0)

  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (selectedId)          params.set('copropriete', selectedId)
    if (searchParams.statut) params.set('statut', searchParams.statut)
    if (searchParams.type)   params.set('type', searchParams.type)
    if (p > 0)               params.set('page', String(p))
    return `/comptabilite/factures?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/comptabilite${selectedId ? `?copropriete=${selectedId}` : ''}`}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-coplio-text">Factures</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {totalCount} document{totalCount > 1 ? 's' : ''}
              {totalPages > 1 && ` · page ${page + 1}/${totalPages}`}
            </p>
          </div>
        </div>
        {selectedId && (
          <div className="flex items-center gap-2">
            <Link
              href="/comptabilite/fournisseurs"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground border border-border px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors flex-shrink-0"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Fournisseurs</span>
            </Link>
            <Link
              href={`/comptabilite/factures/new?copropriete=${selectedId}`}
              className="flex items-center gap-2 bg-[#374151] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#374151]/90 transition-colors flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouvelle facture</span>
            </Link>
          </div>
        )}
      </div>

      {/* Sélecteur copropriété */}
      {coprops && coprops.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {coprops.map((c) => (
            <Link
              key={c.id}
              href={`/comptabilite/factures?copropriete=${c.id}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                selectedId === c.id
                  ? 'bg-[#374151] text-white border-[#374151]'
                  : 'bg-white text-coplio-text border-border hover:border-[#374151]/30'
              }`}
            >
              {c.nom}
            </Link>
          ))}
        </div>
      )}

      {/* KPIs */}
      {selectedId && kpiData && kpiData.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="coplio-card flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-4.5 h-4.5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">En attente</p>
              <p className="font-semibold text-coplio-text">{formatEuro(totalAttente)}</p>
            </div>
          </div>
          <div className={`coplio-card flex items-center gap-3 ${totalEnRetard > 0 ? 'border-red-100' : ''}`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              totalEnRetard > 0 ? 'bg-red-50' : 'bg-slate-100'
            }`}>
              <AlertCircle className={`w-4.5 h-4.5 ${totalEnRetard > 0 ? 'text-red-600' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">En retard</p>
              <p className={`font-semibold ${totalEnRetard > 0 ? 'text-red-600' : 'text-coplio-text'}`}>
                {formatEuro(totalEnRetard)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap items-center">
        {/* Type */}
        <div className="flex gap-1.5">
          {[
            { label: 'Tous', value: '' },
            { label: 'Factures', value: 'facture' },
            { label: 'Devis', value: 'devis' },
            { label: 'Avoirs', value: 'avoir' },
          ].map(({ label, value }) => (
            <Link
              key={value}
              href={`/comptabilite/factures?${selectedId ? `copropriete=${selectedId}&` : ''}${value ? `type=${value}` : ''}${searchParams.statut ? `&statut=${searchParams.statut}` : ''}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                (searchParams.type ?? '') === value
                  ? 'bg-[#374151] text-white border-[#374151]'
                  : 'bg-white text-coplio-text border-border hover:border-[#374151]/30'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Statut */}
        <div className="ml-auto flex gap-1.5 flex-wrap">
          {[
            { label: 'Tous statuts', value: '' },
            { label: 'À traiter', value: 'recu' },
            { label: 'Payées', value: 'paye' },
            { label: 'En retard', value: 'en_retard' },
          ].map(({ label, value }) => (
            <Link
              key={value}
              href={`/comptabilite/factures?${selectedId ? `copropriete=${selectedId}&` : ''}${value ? `statut=${value}` : ''}${searchParams.type ? `&type=${searchParams.type}` : ''}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                (searchParams.statut ?? '') === value
                  ? 'bg-[#374151] text-white border-[#374151]'
                  : 'bg-white text-coplio-text border-border hover:border-[#374151]/30'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Contenu */}
      {!selectedId ? (
        <div className="coplio-card text-center py-12">
          <Receipt className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-coplio-text">Sélectionnez une copropriété</p>
        </div>
      ) : !factures || factures.length === 0 ? (
        <div className="coplio-card text-center py-16">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-7 h-7 text-[#374151]" />
          </div>
          <h3 className="font-semibold text-coplio-text mb-1">Aucune facture</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Enregistrez vos factures fournisseurs pour les comptabiliser.
          </p>
          <Link
            href={`/comptabilite/factures/new?copropriete=${selectedId}`}
            className="inline-flex items-center gap-2 bg-[#374151] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#374151]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Saisir une facture
          </Link>
        </div>
      ) : (
        <div className="coplio-card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50/50">
                {['Date', 'Type', 'Fournisseur', 'Libellé', 'Échéance', 'TTC', 'Statut', ''].map((h) => (
                  <th key={h} className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium first:pl-5 last:pr-5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {// eslint-disable-next-line @typescript-eslint/no-explicit-any
              (factures as any[]).map((f) => {
                const statutInfo = STATUT_CONFIG[f.statut] ?? STATUT_CONFIG['recu']
                const typeInfo = TYPE_CONFIG[f.type_document] ?? { label: f.type_document }
                const isEnRetard = f.date_echeance && f.date_echeance < today && !['paye', 'annule'].includes(f.statut)
                return (
                  <tr key={f.id} className="border-b border-border last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="py-3 pl-5 text-muted-foreground whitespace-nowrap text-xs">
                      {formatDate(f.date_document)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-medium text-muted-foreground">
                        {typeInfo.label}
                      </span>
                      {f.numero_facture && (
                        <p className="text-xs text-muted-foreground font-mono">{f.numero_facture}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-coplio-text font-medium truncate max-w-[140px]">
                        {f.fournisseur?.nom ?? '—'}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-coplio-text truncate max-w-[180px]">{f.libelle}</p>
                    </td>
                    <td className={`py-3 px-4 text-xs whitespace-nowrap ${isEnRetard ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                      {f.date_echeance ? formatDate(f.date_echeance) : '—'}
                      {isEnRetard && <span className="ml-1">⚠</span>}
                    </td>
                    <td className="py-3 px-4 font-mono text-sm font-semibold text-coplio-text whitespace-nowrap">
                      {formatEuro(f.montant_ttc)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statutInfo.color}`}>
                        {statutInfo.label}
                      </span>
                    </td>
                    <td className="py-3 pr-5">
                      <Link
                        href={`/comptabilite/factures/${f.id}?copropriete=${selectedId}`}
                        className="text-xs text-muted-foreground hover:text-[#374151] font-medium transition-colors"
                      >
                        Voir →
                      </Link>
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
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {from + 1}–{Math.min(from + PAGE_SIZE, totalCount)} sur {totalCount}
          </p>
          <div className="flex items-center gap-2">
            {page > 0 && (
              <Link href={pageUrl(page - 1)} className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-slate-50 transition-colors">
                Précédent
              </Link>
            )}
            {page < totalPages - 1 && (
              <Link href={pageUrl(page + 1)} className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-slate-50 transition-colors">
                Suivant
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
