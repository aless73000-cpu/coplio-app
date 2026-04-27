import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Home, User } from 'lucide-react'
import { formatEuro, formatDate } from '@/lib/utils'
import { LOT_TYPE_LABELS } from '@/types'

export default async function LotPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: lot } = await supabase
    .from('lots')
    .select('*, copropriete:coproprietes(id, nom, adresse)')
    .eq('id', params.id)
    .single()

  if (!lot) notFound()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/coproprietes/${lot.copropriete?.id}`} className="text-muted-foreground hover:text-coplio-text transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Lot {lot.numero}</h1>
          <p className="text-muted-foreground text-sm">
            <Link href={`/coproprietes/${lot.copropriete?.id}`} className="hover:text-coplio-green">
              {lot.copropriete?.nom}
            </Link>
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="coplio-card">
          <h2 className="font-semibold text-coplio-text mb-4">Informations</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {[
              { label: 'Type', value: LOT_TYPE_LABELS[lot.type as keyof typeof LOT_TYPE_LABELS] ?? lot.type },
              { label: 'Étage', value: lot.etage ?? '—' },
              { label: 'Surface', value: lot.surface ? `${lot.surface} m²` : '—' },
              { label: 'Tantièmes', value: lot.tantiemes?.toString() ?? '—' },
              { label: 'Solde compte', value: formatEuro(lot.solde_compte ?? 0) },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-muted-foreground text-xs mb-0.5">{label}</dt>
                <dd className="font-medium text-coplio-text">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="coplio-card">
          <h2 className="font-semibold text-coplio-text mb-4">Copropriétaires</h2>
          <p className="text-sm text-muted-foreground text-center py-4">Aucun copropriétaire assigné</p>
        </div>
      </div>
    </div>
  )
}
