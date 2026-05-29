import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  Plus,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Lock,
  ChevronRight,
} from 'lucide-react'
import { formatDate, formatEuro } from '@/lib/utils'


export const metadata = { title: 'Écritures' }

const STATUT_CONFIG = {
  brouillon: { label: 'Brouillon', color: 'bg-amber-50 text-amber-700' },
  valide:    { label: 'Validée',   color: 'bg-slate-100 text-slate-600' },
  cloture:   { label: 'Clôturée', color: 'bg-slate-100 text-slate-400' },
}

const PAGE_SIZE = 50

export default async function EcrituresPage({
  searchParams,
}: {
  searchParams: { copropriete?: string; statut?: string; journal?: string; page?: string }
}) {
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

  // Journaux de la copropriété sélectionnée
  const { data: journaux } = selectedId
    ? await supabase
        .from('journaux')
        .select('id, code, libelle')
        .eq('copropriete_id', selectedId)
        .order('code')
    : { data: null }

  const page = Math.max(0, parseInt(searchParams.page ?? '0', 10) || 0)
  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('ecritures_comptables')
    .select(`
      id, date_ecriture, numero_piece, libelle, reference, statut,
      journal:journaux(code, libelle)
    `, { count: 'exact' })
    .order('date_ecriture', { ascending: false })

  if (selectedId) query = query.eq('copropriete_id', selectedId)
  if (searchParams.statut) query = query.eq('statut', searchParams.statut)
  if (searchParams.journal) query = query.eq('journal_id', searchParams.journal)

  const { data: ecritures, count } = await query.range(from, to)
  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // Stats rapides
  const nbBrouillons = (ecritures ?? []).filter(e => e.statut === 'brouillon').length
  const nbValidees   = (ecritures ?? []).filter(e => e.statut === 'valide').length

  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (selectedId) params.set('copropriete', selectedId)
    if (searchParams.statut) params.set('statut', searchParams.statut)
    if (searchParams.journal) params.set('journal', searchParams.journal)
    if (p > 0) params.set('page', String(p))
    const qs = params.toString()
    return `/comptabilite/ecritures${qs ? `?${qs}` : ''}`
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
            <h1 className="text-xl md:text-2xl font-bold text-coplio-text">Écritures comptables</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {totalCount} écriture{totalCount > 1 ? 's' : ''}
              {totalPages > 1 && ` · page ${page + 1}/${totalPages}`}
            </p>
          </div>
        </div>
        {selectedId && (
          <Link
            href={`/comptabilite/ecritures/new?copropriete=${selectedId}`}
            className="flex items-center gap-2 bg-[#374151] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#374151]/90 transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouvelle écriture</span>
          </Link>
        )}
      </div>

      {/* Sélecteur copropriété */}
      {coprops && coprops.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {coprops.map((c) => (
            <Link
              key={c.id}
              href={`/comptabilite/ecritures?copropriete=${c.id}`}
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

      {/* Filtres statut + journal */}
      <div className="flex gap-2 flex-wrap items-center">
        {[
          { label: 'Toutes', value: '' },
          { label: 'Brouillons', value: 'brouillon' },
          { label: 'Validées', value: 'valide' },
          { label: 'Clôturées', value: 'cloture' },
        ].map(({ label, value }) => (
          <Link
            key={value}
            href={`/comptabilite/ecritures?${selectedId ? `copropriete=${selectedId}&` : ''}${value ? `statut=${value}` : ''}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              (searchParams.statut ?? '') === value
                ? 'bg-[#374151] text-white border-[#374151]'
                : 'bg-white text-coplio-text border-border hover:border-[#374151]/30'
            }`}
          >
            {label}
          </Link>
        ))}

        {journaux && journaux.length > 0 && (
          <div className="ml-auto flex gap-1.5">
            {journaux.map((j) => (
              <Link
                key={j.id}
                href={`/comptabilite/ecritures?${selectedId ? `copropriete=${selectedId}&` : ''}journal=${j.id}${searchParams.statut ? `&statut=${searchParams.statut}` : ''}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  searchParams.journal === j.id
                    ? 'bg-[#374151] text-white border-[#374151]'
                    : 'bg-white text-coplio-text border-border hover:border-[#374151]/30'
                }`}
              >
                {j.code}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Contenu */}
      {!selectedId ? (
        <div className="coplio-card text-center py-12">
          <ArrowRightLeft className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-coplio-text">Sélectionnez une copropriété</p>
        </div>
      ) : (!ecritures || ecritures.length === 0) ? (
        <div className="coplio-card text-center py-16">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ArrowRightLeft className="w-7 h-7 text-[#374151]" />
          </div>
          <h3 className="font-semibold text-coplio-text mb-1">Aucune écriture</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Commencez par créer un journal puis saisissez vos premières écritures.
          </p>
          <Link
            href={`/comptabilite/ecritures/new?copropriete=${selectedId}`}
            className="inline-flex items-center gap-2 bg-[#374151] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#374151]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Saisir une écriture
          </Link>
        </div>
      ) : (
        <div className="coplio-card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50/50">
                {['Date', 'Journal', 'Libellé', 'Pièce', 'Statut', ''].map((h) => (
                  <th key={h} className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium first:pl-5 last:pr-5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {// eslint-disable-next-line @typescript-eslint/no-explicit-any
              (ecritures as any[]).map((e) => {
                const statut = STATUT_CONFIG[e.statut as keyof typeof STATUT_CONFIG]
                return (
                  <tr key={e.id} className="border-b border-border last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="py-3 pl-5 text-muted-foreground whitespace-nowrap">
                      {formatDate(e.date_ecriture)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">
                        {e.journal?.code ?? '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-coplio-text truncate max-w-xs">{e.libelle}</p>
                      {e.reference && (
                        <p className="text-xs text-muted-foreground">{e.reference}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">
                      {e.numero_piece ?? '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statut?.color}`}>
                        {statut?.label}
                      </span>
                    </td>
                    <td className="py-3 pr-5">
                      <Link
                        href={`/comptabilite/ecritures/${e.id}?copropriete=${selectedId}`}
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
            {page > 0 ? (
              <Link href={pageUrl(page - 1)} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-slate-50 transition-colors">
                <ChevronLeft className="w-4 h-4" />Précédent
              </Link>
            ) : (
              <span className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-border opacity-40 cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />Précédent
              </span>
            )}
            {page < totalPages - 1 ? (
              <Link href={pageUrl(page + 1)} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-slate-50 transition-colors">
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
