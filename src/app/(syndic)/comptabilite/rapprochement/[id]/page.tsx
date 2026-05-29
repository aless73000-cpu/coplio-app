import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { formatDate, formatEuro } from '@/lib/utils'
import { RapprochementTable } from '../_components/RapprochementTable'


export const metadata = { title: 'Rapprochement bancaire' }

export default async function ReleveDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { copropriete?: string }
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

  const { data: releve } = await supabase
    .from('releves_bancaires')
    .select('*, compte:comptes_bancaires(libelle, banque, iban)')
    .eq('id', params.id)
    .single()

  if (!releve) notFound()

  // Vérifier que la copropriété du relevé appartient à ce cabinet
  const { data: coproprieteCheck } = await supabase
    .from('coproprietes')
    .select('id')
    .eq('id', releve.copropriete_id)
    .eq('cabinet_id', profile.cabinet_id)
    .single()
  if (!coproprieteCheck) notFound()

  const selectedId = searchParams.copropriete ?? releve.copropriete_id

  // Lignes du relevé
  const { data: lignes } = await supabase
    .from('lignes_releve')
    .select('*')
    .eq('releve_id', releve.id)
    .order('date_operation', { ascending: true })
    .order('ordre', { ascending: true })

  // Écritures non lettrées (pour le lettrage)
  const { data: ecrituresDisponibles } = await supabase
    .from('ecritures_comptables')
    .select('id, date_ecriture, libelle, statut, journal:journaux(code)')
    .eq('copropriete_id', selectedId)
    .eq('statut', 'valide')
    .gte('date_ecriture', releve.date_debut)
    .lte('date_ecriture', releve.date_fin)
    .order('date_ecriture')

  const nbNonLettrees = (lignes ?? []).filter(l => l.statut_lettrage === 'non_lettre').length
  const nbLettrees    = (lignes ?? []).filter(l => l.statut_lettrage === 'lettre').length
  const totalLignes   = (lignes ?? []).length

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const compte = releve.compte as any

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/comptabilite/rapprochement?copropriete=${selectedId}`}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-coplio-text">
              Relevé {formatDate(releve.date_debut)} → {formatDate(releve.date_fin)}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {compte?.libelle ?? '—'}{compte?.banque ? ` · ${compte.banque}` : ''}
            </p>
          </div>
        </div>

        {/* Indicateur progression */}
        {totalLignes > 0 && (
          <div className="flex items-center gap-3 text-sm flex-shrink-0">
            <div className="text-right">
              <p className="font-semibold text-coplio-text">{nbLettrees}/{totalLignes}</p>
              <p className="text-xs text-muted-foreground">lettrées</p>
            </div>
            <div className="w-24 h-2 bg-slate-100 rounded-full">
              <div
                className="h-2 bg-emerald-500 rounded-full transition-all"
                style={{ width: totalLignes > 0 ? `${(nbLettrees / totalLignes) * 100}%` : '0%' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Récap soldes */}
      <div className="grid grid-cols-3 gap-3">
        <div className="coplio-card text-center">
          <p className="text-xs text-muted-foreground mb-1">Solde début</p>
          <p className="font-semibold text-coplio-text">{formatEuro(releve.solde_debut ?? 0)}</p>
        </div>
        <div className="coplio-card text-center">
          <p className="text-xs text-muted-foreground mb-1">Mouvements</p>
          <p className="font-semibold text-coplio-text">
            {formatEuro((lignes ?? []).reduce((s, l) => s + (l.montant ?? 0), 0))}
          </p>
        </div>
        <div className="coplio-card text-center">
          <p className="text-xs text-muted-foreground mb-1">Solde fin</p>
          <p className="font-semibold text-coplio-text">{formatEuro(releve.solde_fin ?? 0)}</p>
        </div>
      </div>

      {/* Table de rapprochement */}
      <RapprochementTable
        releveId={releve.id}
        coproprieteId={selectedId}
        lignes={lignes ?? []}
        ecrituresDisponibles={// eslint-disable-next-line @typescript-eslint/no-explicit-any
          (ecrituresDisponibles as any[]) ?? []}
      />
    </div>
  )
}
