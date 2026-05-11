import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, FileSpreadsheet, Wand2, Pencil } from 'lucide-react'
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
          <p className="text-muted-foreground text-sm">{copropriete.nom} · {lots?.length ?? 0} lot{(lots?.length ?? 0) > 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/coproprietes/${params.id}/lots/generer`}
            className="flex items-center gap-2 bg-coplio-blue-bg text-coplio-blue border border-coplio-blue/20 text-sm font-medium px-3 py-2 rounded-lg hover:bg-coplio-blue/10 transition-colors"
          >
            <Wand2 className="w-4 h-4" />
            Génération auto
          </Link>
          <Link
            href={`/coproprietes/${params.id}/lots/import`}
            className="flex items-center gap-2 bg-coplio-bg text-coplio-text border border-border text-sm font-medium px-3 py-2 rounded-lg hover:bg-border transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Import Excel
          </Link>
          <Link href={`/coproprietes/${params.id}/lots/new`} className="flex items-center gap-2 bg-coplio-green text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-coplio-green/90 transition-colors">
            <Plus className="w-4 h-4" />
            Ajouter
          </Link>
        </div>
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
                <th className="py-2"></th>
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
                  <td className="py-3 text-right">
                    <Link
                      href={`/lots/${lot.id}/edit`}
                      className="p-1.5 rounded-md hover:bg-border text-muted-foreground hover:text-coplio-text transition-colors inline-flex"
                      title="Modifier"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-14">
            <div className="w-14 h-14 bg-coplio-green-light rounded-full flex items-center justify-center mx-auto mb-3">
              <FileSpreadsheet className="w-7 h-7 text-coplio-green" />
            </div>
            <p className="font-semibold text-coplio-text mb-1">Aucun lot enregistré</p>
            <p className="text-sm text-muted-foreground mb-5">Créez vos lots manuellement, par génération automatique ou via import Excel.</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link
                href={`/coproprietes/${params.id}/lots/generer`}
                className="flex items-center gap-2 bg-coplio-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-coplio-green/90 transition-colors"
              >
                <Wand2 className="w-4 h-4" />
                Génération automatique
              </Link>
              <Link
                href={`/coproprietes/${params.id}/lots/import`}
                className="flex items-center gap-2 bg-coplio-bg text-coplio-text border border-border text-sm font-medium px-4 py-2 rounded-lg hover:bg-border transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Import Excel
              </Link>
              <Link
                href={`/coproprietes/${params.id}/lots/new`}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-coplio-text transition-colors px-4 py-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter manuellement
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
