import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, BookOpen, Search } from 'lucide-react'


export const metadata = { title: 'Plan comptable' }

const CLASSE_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Classe 1 — Capitaux',          color: 'bg-purple-50 text-purple-700 border-purple-100' },
  4: { label: 'Classe 4 — Comptes de tiers',  color: 'bg-blue-50 text-blue-700 border-blue-100' },
  5: { label: 'Classe 5 — Comptes financiers', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  6: { label: 'Classe 6 — Charges',           color: 'bg-red-50 text-red-700 border-red-100' },
  7: { label: 'Classe 7 — Produits',          color: 'bg-amber-50 text-amber-700 border-amber-100' },
}

export default async function PlanComptablePage({
  searchParams,
}: {
  searchParams: { copropriete?: string; classe?: string; q?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Charger le plan comptable standard (cabinet_id IS NULL)
  let query = supabase
    .from('comptes_comptables')
    .select('*')
    .is('cabinet_id', null)
    .order('numero')

  if (searchParams.classe) {
    query = query.eq('classe', parseInt(searchParams.classe))
  }
  if (searchParams.q) {
    query = query.or(`numero.ilike.%${searchParams.q}%,libelle.ilike.%${searchParams.q}%`)
  }

  const { data: comptes } = await query

  // Grouper par classe
  const parClasse = (comptes ?? []).reduce((acc, c) => {
    const cl = c.classe ?? 0
    if (!acc[cl]) acc[cl] = []
    acc[cl].push(c)
    return acc
  }, {} as Record<number, typeof comptes>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/comptabilite${searchParams.copropriete ? `?copropriete=${searchParams.copropriete}` : ''}`}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-coplio-text">Plan comptable</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Arrêté du 14 mars 2005 — Syndicats de copropriétaires
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap items-center">
        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <form method="get">
            {searchParams.copropriete && <input type="hidden" name="copropriete" value={searchParams.copropriete} />}
            {searchParams.classe && <input type="hidden" name="classe" value={searchParams.classe} />}
            <input
              name="q"
              defaultValue={searchParams.q}
              placeholder="Rechercher un compte..."
              className="pl-8 pr-3 py-1.5 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20 w-52"
            />
          </form>
        </div>

        {/* Filtre par classe */}
        <div className="flex gap-1.5 flex-wrap">
          <Link
            href={`/comptabilite/plan-comptable${searchParams.copropriete ? `?copropriete=${searchParams.copropriete}` : ''}${searchParams.q ? `${searchParams.copropriete ? '&' : '?'}q=${searchParams.q}` : ''}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              !searchParams.classe
                ? 'bg-[#374151] text-white border-[#374151]'
                : 'bg-white text-coplio-text border-border hover:border-[#374151]/30'
            }`}
          >
            Toutes les classes
          </Link>
          {[1, 4, 5, 6, 7].map((cl) => (
            <Link
              key={cl}
              href={`/comptabilite/plan-comptable?classe=${cl}${searchParams.copropriete ? `&copropriete=${searchParams.copropriete}` : ''}${searchParams.q ? `&q=${searchParams.q}` : ''}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                searchParams.classe === String(cl)
                  ? 'bg-[#374151] text-white border-[#374151]'
                  : 'bg-white text-coplio-text border-border hover:border-[#374151]/30'
              }`}
            >
              Classe {cl}
            </Link>
          ))}
        </div>
      </div>

      {/* Comptes par classe */}
      {Object.keys(parClasse).length === 0 ? (
        <div className="coplio-card text-center py-12">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-coplio-text">Aucun compte trouvé</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(parClasse)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([classe, comptes]) => {
              const classeInfo = CLASSE_LABELS[parseInt(classe)]
              return (
                <div key={classe} className="coplio-card overflow-hidden p-0">
                  {/* En-tête classe */}
                  <div className={`px-5 py-3 border-b border-border flex items-center gap-2`}>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${classeInfo?.color ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {classeInfo?.label ?? `Classe ${classe}`}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {comptes?.length} compte{(comptes?.length ?? 0) > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Table */}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-slate-50/50">
                        <th className="text-left py-2 px-5 text-xs text-muted-foreground font-medium w-28">N° compte</th>
                        <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Libellé</th>
                        <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium hidden md:table-cell w-24">Type</th>
                        <th className="text-left py-2 px-5 text-xs text-muted-foreground font-medium hidden md:table-cell w-20">Sens</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(comptes ?? []).map((compte) => (
                        <tr
                          key={compte.id}
                          className={`border-b border-border last:border-0 transition-colors ${
                            compte.type_compte === 'titre'
                              ? 'bg-slate-50/30'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-2.5 px-5">
                            <span className={`font-mono text-sm ${
                              compte.type_compte === 'titre'
                                ? 'font-bold text-coplio-text'
                                : 'text-[#374151]'
                            }`}>
                              {compte.numero}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={
                              compte.type_compte === 'titre'
                                ? 'font-semibold text-coplio-text text-sm'
                                : 'text-coplio-text text-sm'
                            }>
                              {compte.type_compte === 'titre' && (
                                <span className="mr-1 text-muted-foreground">▸</span>
                              )}
                              {compte.libelle}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 hidden md:table-cell">
                            {compte.type_compte === 'detail' ? (
                              <span className="text-xs text-[#374151] bg-slate-100 px-2 py-0.5 rounded-full">
                                Saisissable
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Titre</span>
                            )}
                          </td>
                          <td className="py-2.5 px-5 hidden md:table-cell">
                            <span className={`text-xs font-medium ${
                              compte.sens_normal === 'debit'
                                ? 'text-red-600'
                                : 'text-emerald-600'
                            }`}>
                              {compte.sens_normal === 'debit' ? 'Débit' : 'Crédit'}
                            </span>
                          </td>
                        </tr>
                      ))}
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
