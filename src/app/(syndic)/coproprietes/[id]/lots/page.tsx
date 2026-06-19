import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, FileSpreadsheet, Wand2 } from 'lucide-react'
import { LotsTableClient } from '@/components/syndic/LotsTableClient'


export const metadata = { title: 'Lots' }

export default async function LotsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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
          <Link href={`/coproprietes/${params.id}/lots/new`} className="flex items-center gap-2 bg-[#374151] text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-[#374151]/90 transition-colors">
            <Plus className="w-4 h-4" />
            Ajouter
          </Link>
        </div>
      </div>

      {lots && lots.length > 0 ? (
        <LotsTableClient lots={lots} />
      ) : (
        <div className="coplio-card">
          <div className="text-center py-14">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileSpreadsheet className="w-7 h-7 text-[#374151]" />
            </div>
            <p className="font-semibold text-coplio-text mb-1">Aucun lot enregistré</p>
            <p className="text-sm text-muted-foreground mb-5">Créez vos lots manuellement, par génération automatique ou via import Excel.</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link
                href={`/coproprietes/${params.id}/lots/generer`}
                className="flex items-center gap-2 bg-[#374151] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#374151]/90 transition-colors"
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
        </div>
      )}
    </div>
  )
}
