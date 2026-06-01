import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { EcritureForm } from '../_components/EcritureForm'


export const metadata = { title: 'Nouvelle écriture' }

export default async function NouvelleEcriturePage(
  props: {
    searchParams: Promise<{ copropriete?: string; journal?: string }>
  }
) {
  const searchParams = await props.searchParams;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const selectedId = searchParams.copropriete ?? null

  if (!selectedId) redirect('/comptabilite/ecritures')

  // Journaux de la copropriété
  const { data: journaux } = await supabase
    .from('journaux')
    .select('id, code, libelle, type_journal')
    .eq('copropriete_id', selectedId)
    .eq('actif', true)
    .order('code')

  // Exercices ouverts
  const { data: exercices } = await supabase
    .from('exercices')
    .select('id, annee')
    .eq('copropriete_id', selectedId)
    .neq('statut', 'cloture')
    .order('annee', { ascending: false })

  // Comptes saisissables (type=detail) — plan standard + cabinet
  const { data: comptes } = await supabase
    .from('comptes_comptables')
    .select('id, numero, libelle')
    .eq('type_compte', 'detail')
    .or(`cabinet_id.is.null,copropriete_id.eq.${selectedId}`)
    .order('numero')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/comptabilite/ecritures?copropriete=${selectedId}`}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-coplio-text">Nouvelle écriture</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Saisie en partie double</p>
        </div>
      </div>

      {!journaux || journaux.length === 0 ? (
        <div className="coplio-card text-center py-12 space-y-3">
          <p className="font-semibold text-coplio-text">Aucun journal configuré</p>
          <p className="text-sm text-muted-foreground">
            Créez d&apos;abord au moins un journal (Achats, Banque, OD…) pour cette copropriété.
          </p>
          <Link
            href={`/comptabilite/journaux?copropriete=${selectedId}`}
            className="inline-flex items-center gap-2 bg-[#374151] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#374151]/90 transition-colors"
          >
            Créer un journal
          </Link>
        </div>
      ) : (
        <EcritureForm
          coproprieteId={selectedId}
          journaux={journaux}
          exercices={exercices ?? []}
          comptes={comptes ?? []}
          defaultJournalId={searchParams.journal}
        />
      )}
    </div>
  )
}
