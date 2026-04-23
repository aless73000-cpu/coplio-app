import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { formatEuro } from '@/lib/utils'
import { LOT_TYPE_LABELS } from '@/types'
import type { Lot } from '@/types'

export default async function LotsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: copropriete }, { data: lots }] = await Promise.all([
    supabase.from('coproprietes').select('id, nom').eq('id', params.id).single(),
    supabase.from('lots').select('*').eq('copropriete_id', params.id).order('numero'),
  ])

  if (!copropriete) notFound()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/coproprietes/${params.id}`} className="text-muted-foreground hover:text-coplio-text">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-coplio-text">Lots</h1>
          <p className="text-muted-foreground text-sm">{copropriete.nom}</p>
        </div>
        <Link href={`/coproprietes/${params.id}/lots/new`} className="flex items-center gap-2 bg-coplio-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-coplio-green/90 transition-colors">
          <Plus className="w-4 h-4" />
          Ajouter un lot
        </Link>
      </div>

      <div className="coplio-card overflow-x-auto">
        {lots && lots.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground font-medium text-xs">Numéro</th>
                <th className="text-left py-2 text-muted-foreground font-medium text-xs">Type</th>
                <th className="text-left py-2 text-muted-foreground font-medium text-xs">Étage</th>
                <th className="text-right py-2 text-muted-foreground font-medium text-xs">Surface</th>
                <th className="text-right py-2 text-muted-foreground font-medium text-xs">Tantièmes</th>
                <th className="text-right py-2 text-muted-foreground font-medium text-xs">Solde</th>
              </tr>
            </thead>
            <tbody>
              {lots.map((lot: Lot) => (
                <tr key={lot.id} className="border-b border-border hover:bg-coplio-bg transition-colors">
                  <td className="py-3">
                    <Link href={`/lots/${lot.id}`} className="font-medium text-coplio-green hover:underline">
                      Lot {lot.numero}
                    </Link>
                  </td>
                  <td className="py-3 text-muted-foreground capitalize">
                    {LOT_TYPE_LABELS[lot.type as keyof typeof LOT_TYPE_LABELS] ?? lot.type}
                  </td>
                  <td className="py-3 text-muted-foreground">{lot.etage ?? '—'}</td>
                  <td className="py-3 text-right text-muted-foreground">{lot.surface ? `${lot.surface} m²` : '—'}</td>
                  <td className="py-3 text-right">{lot.tantiemes}</td>
                  <td className={`py-3 text-right font-medium ${(lot.solde_compte ?? 0) < 0 ? 'text-red-500' : 'text-coplio-text'}`}>
                    {formatEuro(lot.solde_compte ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Aucun lot enregistré</p>
            <Link href={`/coproprietes/${params.id}/lots/new`} className="inline-flex items-center gap-2 bg-coplio-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-coplio-green/90 transition-colors">
              <Plus className="w-4 h-4" />
              Ajouter un lot
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
