import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, CheckCircle2, Lock, AlertCircle } from 'lucide-react'
import { formatDate, formatEuro } from '@/lib/utils'
import { EcritureActions } from '../_components/EcritureActions'

const STATUT_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  brouillon: { label: 'Brouillon', color: 'bg-amber-50 text-amber-700 border-amber-100',  icon: AlertCircle },
  valide:    { label: 'Validée',   color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
  cloture:   { label: 'Clôturée', color: 'bg-slate-100 text-slate-500 border-border',    icon: Lock },
}

export default async function EcritureDetailPage({
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

  const { data: ecriture } = await supabase
    .from('ecritures_comptables')
    .select('*, journal:journaux(code, libelle)')
    .eq('id', params.id)
    .single()

  if (!ecriture) notFound()

  // Vérifier que la copropriété de l'écriture appartient à ce cabinet
  const { data: coproprieteCheck } = await supabase
    .from('coproprietes')
    .select('id')
    .eq('id', ecriture.copropriete_id)
    .eq('cabinet_id', profile.cabinet_id)
    .single()
  if (!coproprieteCheck) notFound()

  const selectedId = searchParams.copropriete ?? ecriture.copropriete_id

  // Lignes avec compte
  const { data: lignes } = await supabase
    .from('lignes_ecriture')
    .select('*, compte:comptes_comptables(numero, libelle)')
    .eq('ecriture_id', ecriture.id)
    .order('ordre')

  const totalDebit  = (lignes ?? []).reduce((s, l) => s + (l.debit  ?? 0), 0)
  const totalCredit = (lignes ?? []).reduce((s, l) => s + (l.credit ?? 0), 0)
  const equilibre   = Math.abs(totalDebit - totalCredit) < 0.01

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const statutInfo = STATUT_CONFIG[ecriture.statut] ?? STATUT_CONFIG['brouillon']
  const StatutIcon = statutInfo.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/comptabilite/ecritures?copropriete=${selectedId}`}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-coplio-text">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(ecriture.journal as any)?.code ?? '—'}
                {ecriture.numero_piece && (
                  <span className="font-mono text-lg ml-1.5 text-muted-foreground">#{ecriture.numero_piece}</span>
                )}
              </h1>
              <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${statutInfo.color}`}>
                <StatutIcon className="w-3 h-3" />
                {statutInfo.label}
              </span>
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">{ecriture.libelle}</p>
          </div>
        </div>
        {ecriture.statut === 'brouillon' && (
          <EcritureActions
            ecritureId={ecriture.id}
            coproprieteId={selectedId}
            equilibre={equilibre}
          />
        )}
      </div>

      {/* Infos */}
      <div className="coplio-card grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Date</p>
          <p className="font-medium text-coplio-text text-sm mt-0.5">{formatDate(ecriture.date_ecriture)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Journal</p>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <p className="font-medium text-coplio-text text-sm mt-0.5">{(ecriture.journal as any)?.libelle ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">N° pièce</p>
          <p className="font-mono text-coplio-text text-sm mt-0.5">{ecriture.numero_piece ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Référence</p>
          <p className="text-coplio-text text-sm mt-0.5">{ecriture.reference ?? '—'}</p>
        </div>
      </div>

      {/* Indicateur équilibre */}
      {!equilibre && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            Écriture non équilibrée — écart de {formatEuro(Math.abs(totalDebit - totalCredit))}
          </p>
        </div>
      )}

      {/* Table des lignes */}
      <div className="coplio-card overflow-hidden p-0">
        <div className="px-5 py-3 border-b border-border">
          <p className="text-sm font-semibold text-coplio-text">Lignes comptables</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-slate-50/40">
              <th className="text-left py-2 px-5 text-xs text-muted-foreground font-medium w-8">#</th>
              <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Compte</th>
              <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium hidden md:table-cell">Libellé</th>
              <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Débit</th>
              <th className="text-right py-2 px-5 text-xs text-muted-foreground font-medium">Crédit</th>
            </tr>
          </thead>
          <tbody>
            {// eslint-disable-next-line @typescript-eslint/no-explicit-any
            (lignes as any[] ?? []).map((l, i) => (
              <tr key={l.id} className="border-b border-border last:border-0">
                <td className="py-3 px-5 text-xs text-muted-foreground">{i + 1}</td>
                <td className="py-3 px-3">
                  <p className="font-mono text-sm text-[#374151]">{l.compte?.numero ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">{l.compte?.libelle ?? ''}</p>
                </td>
                <td className="py-3 px-3 text-muted-foreground text-sm hidden md:table-cell">
                  {l.libelle ?? '—'}
                </td>
                <td className="py-3 px-3 text-right font-mono">
                  {(l.debit ?? 0) > 0
                    ? <span className="font-semibold text-red-600">{formatEuro(l.debit)}</span>
                    : <span className="text-muted-foreground">—</span>
                  }
                </td>
                <td className="py-3 px-5 text-right font-mono">
                  {(l.credit ?? 0) > 0
                    ? <span className="font-semibold text-emerald-600">{formatEuro(l.credit)}</span>
                    : <span className="text-muted-foreground">—</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className={`border-t-2 ${equilibre ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/20'}`}>
              <td colSpan={3} className="py-3 px-5 text-sm font-semibold text-coplio-text">Total</td>
              <td className="py-3 px-3 text-right font-mono font-bold text-red-600">{formatEuro(totalDebit)}</td>
              <td className="py-3 px-5 text-right font-mono font-bold text-emerald-600">{formatEuro(totalCredit)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
