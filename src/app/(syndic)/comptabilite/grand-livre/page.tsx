import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, FileText, Download } from 'lucide-react'
import { formatDate, formatEuro } from '@/lib/utils'

const PAGE_SIZE = 100

export default async function GrandLivrePage({
  searchParams,
}: {
  searchParams: { copropriete?: string; exercice?: string; compte?: string; page?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()

  const { data: coprops } = await supabase
    .from('coproprietes')
    .select('id, nom')
    .eq('cabinet_id', profile?.cabinet_id ?? '')
    .order('nom')

  const selectedId = searchParams.copropriete ?? (coprops ?? [])[0]?.id ?? null

  const { data: exercices } = selectedId
    ? await supabase
        .from('exercices')
        .select('id, annee, statut')
        .eq('copropriete_id', selectedId)
        .order('annee', { ascending: false })
    : { data: null }

  const selectedExercice = searchParams.exercice ?? exercices?.[0]?.id ?? null

  // Comptes avec mouvement sur cet exercice
  const { data: comptesActifs } = selectedExercice
    ? await supabase
        .from('v_balance_comptes')
        .select('compte_id, compte_numero, compte_libelle')
        .eq('copropriete_id', selectedId!)
        .eq('exercice_id', selectedExercice)
        .order('compte_numero')
    : { data: null }

  const selectedCompte = searchParams.compte ?? comptesActifs?.[0]?.compte_id ?? null

  const page = Math.max(0, parseInt(searchParams.page ?? '0', 10) || 0)

  // Lignes du grand livre pour ce compte
  let lignesQuery = supabase
    .from('v_grand_livre')
    .select('*', { count: 'exact' })
    .eq('copropriete_id', selectedId!)
    .order('date_ecriture', { ascending: true })
    .order('ordre', { ascending: true })

  if (selectedExercice) lignesQuery = lignesQuery.eq('exercice_id', selectedExercice)
  if (selectedCompte)   lignesQuery = lignesQuery.eq('compte_id', selectedCompte)

  const { data: lignes, count } = selectedId && selectedCompte
    ? await lignesQuery.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    : { data: null, count: 0 }

  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // Solde progressif
  let soldeProgressif = 0
  const lignesAvecSolde = (lignes ?? []).map((l) => {
    soldeProgressif += (l.debit ?? 0) - (l.credit ?? 0)
    return { ...l, solde_progressif: soldeProgressif }
  })

  const totalDebit  = (lignes ?? []).reduce((s, l) => s + (l.debit ?? 0), 0)
  const totalCredit = (lignes ?? []).reduce((s, l) => s + (l.credit ?? 0), 0)

  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (selectedId)      params.set('copropriete', selectedId)
    if (selectedExercice) params.set('exercice', selectedExercice)
    if (selectedCompte)   params.set('compte', selectedCompte)
    if (p > 0)            params.set('page', String(p))
    return `/comptabilite/grand-livre?${params.toString()}`
  }

  const compteInfo = comptesActifs?.find(c => c.compte_id === selectedCompte)

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
            <h1 className="text-xl md:text-2xl font-bold text-coplio-text">Grand livre</h1>
            {compteInfo && (
              <p className="text-muted-foreground text-sm mt-0.5">
                <span className="font-mono">{compteInfo.compte_numero}</span> — {compteInfo.compte_libelle}
              </p>
            )}
          </div>
        </div>
        {lignes && lignes.length > 0 && (
          <button className="flex items-center gap-2 btn-secondary text-xs flex-shrink-0">
            <Download className="w-3.5 h-3.5" />
            Exporter
          </button>
        )}
      </div>

      {/* Sélecteurs */}
      <div className="flex gap-3 flex-wrap">
        {/* Copropriétés */}
        {coprops && coprops.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {coprops.map((c) => (
              <Link
                key={c.id}
                href={`/comptabilite/grand-livre?copropriete=${c.id}`}
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

        {/* Exercices */}
        {exercices && exercices.length > 0 && (
          <div className="flex gap-2">
            {exercices.map((ex) => (
              <Link
                key={ex.id}
                href={`/comptabilite/grand-livre?${selectedId ? `copropriete=${selectedId}&` : ''}exercice=${ex.id}`}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  selectedExercice === ex.id
                    ? 'bg-[#374151] text-white border-[#374151]'
                    : 'bg-white text-coplio-text border-border hover:border-[#374151]/30'
                }`}
              >
                {ex.annee}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Sélecteur de compte — liste latérale + contenu */}
      {selectedId && selectedExercice ? (
        <div className="flex gap-4">
          {/* Sidebar comptes */}
          {comptesActifs && comptesActifs.length > 0 && (
            <div className="w-52 flex-shrink-0 coplio-card p-0 overflow-hidden self-start">
              <div className="px-4 py-2.5 border-b border-border">
                <p className="text-xs font-medium text-muted-foreground">Comptes mouvementés</p>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {comptesActifs.map((c) => (
                  <Link
                    key={c.compte_id}
                    href={`/comptabilite/grand-livre?${selectedId ? `copropriete=${selectedId}&` : ''}${selectedExercice ? `exercice=${selectedExercice}&` : ''}compte=${c.compte_id}`}
                    className={`flex items-center gap-2 px-4 py-2.5 border-b border-border last:border-0 text-sm transition-colors ${
                      selectedCompte === c.compte_id
                        ? 'bg-[#374151] text-white'
                        : 'hover:bg-slate-50 text-coplio-text'
                    }`}
                  >
                    <span className="font-mono text-xs">{c.compte_numero}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Table grand livre */}
          <div className="flex-1 min-w-0">
            {!selectedCompte ? (
              <div className="coplio-card text-center py-12">
                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold text-coplio-text">Sélectionnez un compte</p>
              </div>
            ) : !lignes || lignes.length === 0 ? (
              <div className="coplio-card text-center py-12">
                <p className="text-muted-foreground text-sm">Aucune écriture sur ce compte.</p>
              </div>
            ) : (
              <div className="coplio-card overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-slate-50/40">
                      <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium">Date</th>
                      <th className="text-left py-2.5 px-3 text-xs text-muted-foreground font-medium">Jl</th>
                      <th className="text-left py-2.5 px-3 text-xs text-muted-foreground font-medium">Libellé</th>
                      <th className="text-right py-2.5 px-3 text-xs text-muted-foreground font-medium">Débit</th>
                      <th className="text-right py-2.5 px-3 text-xs text-muted-foreground font-medium">Crédit</th>
                      <th className="text-right py-2.5 px-4 text-xs text-muted-foreground font-medium">Solde</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignesAvecSolde.map((ligne) => (
                      <tr key={ligne.ligne_id} className="border-b border-border last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-4 text-muted-foreground whitespace-nowrap text-xs">
                          {formatDate(ligne.date_ecriture)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                            {ligne.journal_code}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="text-coplio-text truncate max-w-[200px]">
                            {ligne.libelle_ligne ?? ligne.libelle_ecriture}
                          </p>
                          {ligne.numero_piece && (
                            <p className="text-xs text-muted-foreground">{ligne.numero_piece}</p>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-sm">
                          {(ligne.debit ?? 0) > 0
                            ? <span className="text-red-600">{formatEuro(ligne.debit ?? 0)}</span>
                            : <span className="text-muted-foreground">—</span>
                          }
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-sm">
                          {(ligne.credit ?? 0) > 0
                            ? <span className="text-emerald-600">{formatEuro(ligne.credit ?? 0)}</span>
                            : <span className="text-muted-foreground">—</span>
                          }
                        </td>
                        <td className={`py-2.5 px-4 text-right font-mono text-sm font-semibold ${
                          ligne.solde_progressif > 0 ? 'text-red-600' : ligne.solde_progressif < 0 ? 'text-emerald-600' : 'text-muted-foreground'
                        }`}>
                          {ligne.solde_progressif !== 0
                            ? `${formatEuro(Math.abs(ligne.solde_progressif))} ${ligne.solde_progressif > 0 ? 'D' : 'C'}`
                            : '—'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Totaux */}
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-border">
                      <td colSpan={3} className="py-3 px-4 text-sm font-semibold text-coplio-text">
                        Total
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-sm font-bold text-red-600">
                        {formatEuro(totalDebit)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-sm font-bold text-emerald-600">
                        {formatEuro(totalCredit)}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono text-sm font-bold ${
                        soldeProgressif > 0 ? 'text-red-600' : 'text-emerald-600'
                      }`}>
                        {formatEuro(Math.abs(totalDebit - totalCredit))} {totalDebit > totalCredit ? 'D' : 'C'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-muted-foreground">
                  {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} sur {totalCount}
                </p>
                <div className="flex gap-2">
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
        </div>
      ) : (
        <div className="coplio-card text-center py-12">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-coplio-text">
            {!selectedId ? 'Sélectionnez une copropriété' : 'Aucun exercice trouvé'}
          </p>
        </div>
      )}
    </div>
  )
}
