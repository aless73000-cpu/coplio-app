import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Download, FileText, Shield, AlertCircle } from 'lucide-react'
import { ExportFecButton } from './_components/ExportFecButton'
import { ExportBalanceButton } from './_components/ExportBalanceButton'
import { ExportReleveButton } from './_components/ExportReleveButton'


export const metadata = { title: 'Export comptable' }

export default async function ExportPage(
  props: {
    searchParams: Promise<{ copropriete?: string }>
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

  const { data: exercices } = selectedId
    ? await supabase
        .from('exercices')
        .select('id, annee, statut')
        .eq('copropriete_id', selectedId)
        .order('annee', { ascending: false })
    : { data: null }

  const copropNom = (coprops ?? []).find(c => c.id === selectedId)?.nom ?? ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/comptabilite${selectedId ? `?copropriete=${selectedId}` : ''}`}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-coplio-text">Export comptable</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            FEC, balance, annexes AG
          </p>
        </div>
      </div>

      {/* Sélecteur copropriété */}
      {coprops && coprops.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {coprops.map((c) => (
            <Link
              key={c.id}
              href={`/comptabilite/export?copropriete=${c.id}`}
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

      {!selectedId ? (
        <div className="coplio-card text-center py-12">
          <Download className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-coplio-text">Sélectionnez une copropriété</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* FEC */}
          <div className="coplio-card">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-coplio-text">Fichier des Écritures Comptables (FEC)</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Format normalisé DGFiP — CGI art. 47 A. Requis lors d&apos;un contrôle fiscal.
                    </p>
                  </div>
                </div>

                {exercices && exercices.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Choisir un exercice :</p>
                    <div className="flex flex-wrap gap-2">
                      {exercices.map(ex => (
                        <ExportFecButton
                          key={ex.id}
                          coproprieteId={selectedId}
                          exerciceId={ex.id}
                          annee={ex.annee}
                          copropNom={copropNom}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="w-4 h-4" />
                    Aucun exercice disponible pour cette copropriété.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Balance */}
          <div className="coplio-card">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-coplio-text">Balance des comptes (CSV)</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Export de la balance débit/crédit par compte, par exercice.
                </p>
                {exercices && exercices.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Choisir un exercice :</p>
                    <div className="flex flex-wrap gap-2">
                      {exercices.map(ex => (
                        <ExportBalanceButton
                          key={ex.id}
                          coproprieteId={selectedId}
                          exerciceId={ex.id}
                          annee={ex.annee}
                          copropNom={copropNom}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="w-4 h-4" />
                    Aucun exercice disponible.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Relevé annuel de charges */}
          <div className="coplio-card">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-coplio-text">Relevé annuel de charges (CSV)</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Synthèse des appels de charges par lot — à remettre aux copropriétaires en annexe AG.
                </p>
                {exercices && exercices.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Choisir un exercice :</p>
                    <div className="flex flex-wrap gap-2">
                      {exercices.map(ex => (
                        <ExportReleveButton
                          key={ex.id}
                          coproprieteId={selectedId!}
                          exerciceId={ex.id}
                          annee={ex.annee}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="w-4 h-4" />
                    Aucun exercice disponible.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Note légale */}
          <div className="flex items-start gap-3 bg-slate-50 border border-border rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Le FEC doit être conservé pendant au moins 6 ans (LPF art. L. 102 B).
              Il est produit au format texte délimité par des barres verticales (|) conformément
              à l&apos;arrêté du 29 juillet 2013.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
