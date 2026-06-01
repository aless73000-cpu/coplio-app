import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { FactureForm } from '../_components/FactureForm'


export const metadata = { title: 'Nouvelle facture' }

export default async function NouvelleFacturePage(
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

  const selectedId = searchParams.copropriete ?? null

  // Fournisseurs du cabinet
  const { data: fournisseurs } = await supabase
    .from('fournisseurs')
    .select('id, nom, compte_comptable')
    .eq('cabinet_id', profile.cabinet_id)
    .eq('actif', true)
    .order('nom')

  // Exercice en cours
  const { data: exercices } = selectedId
    ? await supabase
        .from('exercices')
        .select('id, annee, statut')
        .eq('copropriete_id', selectedId)
        .neq('statut', 'cloture')
        .order('annee', { ascending: false })
    : { data: null }

  // Comptes de charges (classe 6)
  const { data: comptesCharges } = await supabase
    .from('comptes_comptables')
    .select('id, numero, libelle')
    .is('cabinet_id', null)
    .eq('type_compte', 'detail')
    .gte('numero', '6')
    .lt('numero', '7')
    .order('numero')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/comptabilite/factures${selectedId ? `?copropriete=${selectedId}` : ''}`}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-coplio-text">Nouvelle facture</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Saisie d&apos;un document fournisseur
          </p>
        </div>
      </div>

      {!selectedId ? (
        <div className="coplio-card text-center py-12">
          <p className="text-muted-foreground">
            Accédez à cette page depuis la liste des factures d&apos;une copropriété.
          </p>
        </div>
      ) : (
        <FactureForm
          coproprieteId={selectedId}
          fournisseurs={fournisseurs ?? []}
          exercices={exercices ?? []}
          comptesCharges={comptesCharges ?? []}
        />
      )}
    </div>
  )
}
