import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Scale } from 'lucide-react'
import { formatEuro } from '@/lib/utils'
import { ExportBalanceButton } from '@/app/(syndic)/comptabilite/export/_components/ExportBalanceButton'

const CLASSE_LABELS: Record<number, string> = {
  1: 'Capitaux',
  4: 'Tiers',
  5: 'Financiers',
  6: 'Charges',
  7: 'Produits',
}

export default async function BalancePage({
  searchParams,
}: {
  searchParams: { copropriete?: string; exercice?: string }
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

  // Exercices disponibles
  const { data: exercices } = selectedId
    ? await supabase
        .from('exercices')
        .select('id, annee, statut')
        .eq('copropriete_id', selectedId)
        .order('annee', { ascending: false })
    : { data: null }

  const selectedExercice = searchParams.exercice ?? exercices?.[0]?.id ?? null

  // Balance
  const { data: balance } = selectedExercice
    ? await supabase
        .from('v_balance_comptes')
        .select('*')
        .eq('copropriete_id', selectedId!)
        .eq('exercice_id', selectedExercice)
        .order('compte_numero')
    : { data: null }

  // Grouper par classe
  const parClasse = (balance ?? []).reduce((acc, row) => {
    const cl = row.classe ?? 0
    if (!acc[cl]) acc[cl] = []
    acc[cl].push(row)
    return acc
  }, {} as Record<number, typeof balance>)

  // Totaux généraux
  const totalDebit  = (balance ?? []).reduce((s, r) => s + (r.total_debit ?? 0), 0)
  const totalCredit = (balance ?? []).reduce((s, r) => s + (r.total_credit ?? 0), 0)
  const equilibre   = Math.abs(totalDebit - totalCredit) < 0.02

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
            <h1 className="text-xl md:text-2xl font-bold text-coplio-text">Balance des comptes</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Soldes débit / crédit par compte
            </p>
          </div>
        </div>
        {balance && balance.length > 0 && selectedExercice && (
          <ExportBalanceButton
            coproprieteId={selectedId!}
            exerciceId={selectedExercice}
            annee={exercices?.find(e => e.id === selectedExercice)?.annee ?? 0}
            copropNom=""
          />
        )}
      </div>

      {/* Sélecteurs */}
      <div className="flex gap-3 flex-wrap">
        {coprops && coprops.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {coprops.map((c) => (
              <Link
                key={c.id}
                href={`/comptabilite/balance?copropriete=${c.id}`}
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

        {exercices && exercices.length > 0 && (
          <div className="flex gap-2">
            {exercices.map((ex) => (
              <Link
                key={ex.id}
                href={`/comptabilite/balance?${selectedId ? `copropriete=${selectedId}&` : ''}exercice=${ex.id}`}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  selectedExercice === ex.id
                    ? 'bg-[#374151] text-white border-[#374151]'
                    : 'bg-white text-coplio-text border-border hover:border-[#374151]/30'
                }`}
              >
                {ex.annee}
                {ex.statut === 'cloture' && (
                  <span className="ml-1.5 text-xs opacity-60">clôturé</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {!selectedId || !selectedExercice ? (
        <div className="coplio-card text-center py-12">
          <Scale className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-coplio-text">
            {!selectedId ? 'Sélectionnez une copropriété' : 'Aucun exercice trouvé'}
          </p>
          {!selectedId ? null : (
            <p className="text-sm text-muted-foreground mt-1">
              Créez un exercice dans la section Comptabilité pour commencer.
            </p>
          )}
        </div>
      ) : !balance || balance.length === 0 ? (
        <div className="coplio-card text-center py-12">
          <Scale className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-coplio-text">Aucune écriture validée</p>
          <p className="text-sm text-muted-foreground mt-1">
            Saisissez et validez des écritures pour voir la balance.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Indicateur d'équilibre */}
          <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
            equilibre
              ? 'bg-emerald-50 border-emerald-100'
              : 'bg-red-50 border-red-100'
          }`}>
            <div className={`w-2 h-2 rounded-full ${equilibre ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <p className={`text-sm font-medium ${equilibre ? 'text-emerald-800' : 'text-red-800'}`}>
              {equilibre
                ? 'Balance équilibrée — débit = crédit'
                : `Balance déséquilibrée — écart de ${formatEuro(Math.abs(totalDebit - totalCredit))}`
              }
            </p>
            <div className="ml-auto flex gap-6 text-sm">
              <span className="text-muted-foreground">
                Débit : <span className="font-semibold text-coplio-text">{formatEuro(totalDebit)}</span>
              </span>
              <span className="text-muted-foreground">
                Crédit : <span className="font-semibold text-coplio-text">{formatEuro(totalCredit)}</span>
              </span>
            </div>
          </div>

          {/* Tables par classe */}
          {Object.entries(parClasse)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([classe, rows]) => {
              const classeTotal = {
                debit:  (rows ?? []).reduce((s, r) => s + (r.total_debit ?? 0), 0),
                credit: (rows ?? []).reduce((s, r) => s + (r.total_credit ?? 0), 0),
              }
              return (
                <div key={classe} className="coplio-card overflow-hidden p-0">
                  <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                    <span className="text-sm font-semibold text-coplio-text">
                      Classe {classe} — {CLASSE_LABELS[parseInt(classe)] ?? ''}
                    </span>
                    <div className="flex gap-6 text-xs text-muted-foreground">
                      <span>Débit : <span className="font-medium text-coplio-text">{formatEuro(classeTotal.debit)}</span></span>
                      <span>Crédit : <span className="font-medium text-coplio-text">{formatEuro(classeTotal.credit)}</span></span>
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-slate-50/40">
                        <th className="text-left py-2 px-5 text-xs text-muted-foreground font-medium w-28">Compte</th>
                        <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Libellé</th>
                        <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Débit</th>
                        <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Crédit</th>
                        <th className="text-right py-2 px-5 text-xs text-muted-foreground font-medium">Solde</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(rows ?? []).map((row) => {
                        const solde = (row.total_debit ?? 0) - (row.total_credit ?? 0)
                        return (
                          <tr key={row.compte_id} className="border-b border-border last:border-0 hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-5 font-mono text-sm text-[#374151]">
                              {row.compte_numero}
                            </td>
                            <td className="py-2.5 px-3 text-coplio-text">{row.compte_libelle}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-sm text-coplio-text">
                              {(row.total_debit ?? 0) > 0 ? formatEuro(row.total_debit ?? 0) : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-sm text-coplio-text">
                              {(row.total_credit ?? 0) > 0 ? formatEuro(row.total_credit ?? 0) : '—'}
                            </td>
                            <td className={`py-2.5 px-5 text-right font-mono text-sm font-semibold ${
                              solde > 0 ? 'text-red-600' : solde < 0 ? 'text-emerald-600' : 'text-muted-foreground'
                            }`}>
                              {solde !== 0 ? formatEuro(Math.abs(solde)) : '—'}
                              {solde !== 0 && (
                                <span className="ml-1 text-xs font-normal opacity-60">
                                  {solde > 0 ? 'D' : 'C'}
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
