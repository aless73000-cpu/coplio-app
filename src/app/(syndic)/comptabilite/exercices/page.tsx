import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ExercicesManager } from './_components/ExercicesManager'


export const metadata = { title: 'Exercices comptables' }

export default async function ExercicesPage(
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
        .select('id, annee, date_debut, date_fin, statut, date_cloture')
        .eq('copropriete_id', selectedId)
        .order('annee', { ascending: false })
    : { data: null }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/comptabilite${selectedId ? `?copropriete=${selectedId}` : ''}`}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-coplio-text">Exercices comptables</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Gestion des périodes comptables</p>
        </div>
      </div>

      {coprops && coprops.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {coprops.map((c) => (
            <Link
              key={c.id}
              href={`/comptabilite/exercices?copropriete=${c.id}`}
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
          <p className="font-semibold text-coplio-text">Sélectionnez une copropriété</p>
        </div>
      ) : (
        <ExercicesManager
          coproprieteId={selectedId}
          exercices={exercices ?? []}
        />
      )}
    </div>
  )
}
