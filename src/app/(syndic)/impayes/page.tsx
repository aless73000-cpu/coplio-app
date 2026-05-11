import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreditCard } from 'lucide-react'
import { formatEuro, getOverdueDays } from '@/lib/utils'
import { ImpayesTable } from '@/components/syndic/ImpayesTable'
import type { AppelCharges, Lot, Copropriete } from '@/types'

type AppelWithDetails = AppelCharges & {
  lot?: Lot & { numero: string }
  copropriete?: Copropriete
}

export default async function ImpayésPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()

  const { data: coproprietes } = await supabase
    .from('coproprietes')
    .select('id')
    .eq('cabinet_id', profile?.cabinet_id ?? '')

  const coproprieteIds = (coproprietes ?? []).map((c) => c.id)

  const { data: impayes } = await supabase
    .from('appels_charges')
    .select(`
      *,
      copropriete:coproprietes(id, nom),
      lot:lots(id, numero, etage)
    `)
    .in('copropriete_id', coproprieteIds.length > 0 ? coproprieteIds : ['none'])
    .eq('paye', false)
    .lt('date_echeance', new Date().toISOString())
    .order('date_echeance', { ascending: true })

  const total = (impayes ?? []).reduce(
    (s: number, a: AppelWithDetails) => s + (a.montant - a.montant_paye),
    0
  )

  const categories = {
    recent: (impayes ?? []).filter((a: AppelWithDetails) => getOverdueDays(a.date_echeance) < 30),
    moyen: (impayes ?? []).filter((a: AppelWithDetails) => {
      const d = getOverdueDays(a.date_echeance)
      return d >= 30 && d < 90
    }),
    ancien: (impayes ?? []).filter((a: AppelWithDetails) => getOverdueDays(a.date_echeance) >= 90),
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Impayés & Relances</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {impayes?.length ?? 0} dossier{(impayes?.length ?? 0) > 1 ? 's' : ''} impayé{(impayes?.length ?? 0) > 1 ? 's' : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-coplio-red">{formatEuro(total)}</p>
          <p className="text-xs text-muted-foreground">Total à recouvrer</p>
        </div>
      </div>

      {/* Résumé par catégorie */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: '< 30 jours',
            count: categories.recent.length,
            montant: categories.recent.reduce((s: number, a: AppelWithDetails) => s + (a.montant - a.montant_paye), 0),
            color: 'amber',
          },
          {
            label: '30 – 90 jours',
            count: categories.moyen.length,
            montant: categories.moyen.reduce((s: number, a: AppelWithDetails) => s + (a.montant - a.montant_paye), 0),
            color: 'amber',
          },
          {
            label: '> 90 jours',
            count: categories.ancien.length,
            montant: categories.ancien.reduce((s: number, a: AppelWithDetails) => s + (a.montant - a.montant_paye), 0),
            color: 'red',
          },
        ].map(({ label, count, montant, color }) => (
          <div key={label} className={`coplio-card border-l-4 ${color === 'red' ? 'border-l-coplio-red' : 'border-l-coplio-amber'}`}>
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className={`text-xl font-bold mt-1 ${color === 'red' ? 'text-coplio-red' : 'text-coplio-amber'}`}>
              {count}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{formatEuro(montant)}</p>
          </div>
        ))}
      </div>

      {/* Tableau des impayés */}
      {(!impayes || impayes.length === 0) ? (
        <div className="coplio-card text-center py-12">
          <div className="w-14 h-14 bg-coplio-green-light rounded-full flex items-center justify-center mx-auto mb-3">
            <CreditCard className="w-7 h-7 text-coplio-green" />
          </div>
          <p className="font-medium text-coplio-text">Aucun impayé</p>
          <p className="text-sm text-muted-foreground mt-1">Tous les appels de charges sont à jour.</p>
        </div>
      ) : (
        <ImpayesTable impayes={impayes as AppelWithDetails[]} />
      )}
    </div>
  )
}
