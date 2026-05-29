import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Building2, Calendar, Hash, FileText, CreditCard } from 'lucide-react'
import { formatDate, formatEuro } from '@/lib/utils'
import { FactureActions } from '../_components/FactureActions'


export const metadata = { title: 'Facture' }

const STATUT_CONFIG: Record<string, { label: string; color: string }> = {
  recu:          { label: 'Reçue',          color: 'bg-blue-50 text-blue-700 border-blue-100' },
  valide:        { label: 'Validée',        color: 'bg-amber-50 text-amber-700 border-amber-100' },
  comptabilise:  { label: 'Comptabilisée',  color: 'bg-slate-100 text-slate-600 border-border' },
  paye:          { label: 'Payée',          color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  annule:        { label: 'Annulée',        color: 'bg-red-50 text-red-400 border-red-100' },
}

const MODE_PAIEMENT: Record<string, string> = {
  virement: 'Virement bancaire',
  cheque: 'Chèque',
  prelevement: 'Prélèvement',
  especes: 'Espèces',
  autre: 'Autre',
}

export default async function FactureDetailPage({
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

  // Facture
  const { data: facture } = await supabase
    .from('factures')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!facture) notFound()

  // Vérifier que la copropriété de la facture appartient à ce cabinet
  const { data: coproprieteCheck } = await supabase
    .from('coproprietes')
    .select('id')
    .eq('id', facture.copropriete_id)
    .eq('cabinet_id', profile.cabinet_id)
    .single()
  if (!coproprieteCheck) notFound()

  const selectedId = searchParams.copropriete ?? facture.copropriete_id

  // Fournisseur
  const { data: fournisseur } = facture.fournisseur_id
    ? await supabase
        .from('fournisseurs')
        .select('nom, email, telephone, siret, compte_comptable')
        .eq('id', facture.fournisseur_id)
        .single()
    : { data: null }

  // Lignes
  const { data: lignes } = await supabase
    .from('lignes_facture')
    .select('*, compte:comptes_comptables(numero, libelle)')
    .eq('facture_id', facture.id)
    .order('ordre')

  // Paiements
  const { data: paiements } = await supabase
    .from('paiements_facture')
    .select('*')
    .eq('facture_id', facture.id)
    .order('date_paiement', { ascending: false })

  const montantPaye = (paiements ?? []).reduce((s, p) => s + (p.montant ?? 0), 0)
  const soldeRestant = (facture.montant_ttc ?? 0) - montantPaye

  const statut = STATUT_CONFIG[facture.statut] ?? STATUT_CONFIG['recu']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/comptabilite/factures?copropriete=${selectedId}`}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-coplio-text">
                {facture.type_document === 'devis' ? 'Devis' : facture.type_document === 'avoir' ? 'Avoir' : 'Facture'}
                {facture.numero_facture && (
                  <span className="font-mono ml-1.5 text-lg">#{facture.numero_facture}</span>
                )}
              </h1>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statut.color}`}>
                {statut.label}
              </span>
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">{facture.libelle}</p>
          </div>
        </div>

        {/* Actions */}
        <FactureActions
          factureId={facture.id}
          statut={facture.statut}
          coproprieteId={selectedId}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-4">
          {/* Infos facture */}
          <div className="coplio-card">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {fournisseur && (
                <div className="flex gap-3">
                  <Building2 className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Fournisseur</p>
                    <p className="text-sm font-medium text-coplio-text">{fournisseur.nom}</p>
                    {fournisseur.siret && (
                      <p className="text-xs text-muted-foreground font-mono">{fournisseur.siret}</p>
                    )}
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Date facture</p>
                  <p className="text-sm font-medium text-coplio-text">{formatDate(facture.date_document)}</p>
                  {facture.date_echeance && (
                    <p className="text-xs text-muted-foreground">
                      Échéance : {formatDate(facture.date_echeance)}
                    </p>
                  )}
                </div>
              </div>
              {facture.numero_interne && (
                <div className="flex gap-3">
                  <Hash className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Réf. interne</p>
                    <p className="text-sm font-mono text-coplio-text">{facture.numero_interne}</p>
                  </div>
                </div>
              )}
            </div>
            {facture.notes && (
              <div className="mt-4 pt-4 border-t border-border flex gap-3">
                <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{facture.notes}</p>
              </div>
            )}
          </div>

          {/* Lignes */}
          {lignes && lignes.length > 0 && (
            <div className="coplio-card overflow-hidden p-0">
              <div className="px-5 py-3 border-b border-border">
                <p className="text-sm font-semibold text-coplio-text">Détail des prestations</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50/40">
                    <th className="text-left py-2 px-5 text-xs text-muted-foreground font-medium">Description</th>
                    <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Qté</th>
                    <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">P.U. HT</th>
                    <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">TVA</th>
                    <th className="text-right py-2 px-5 text-xs text-muted-foreground font-medium">TTC</th>
                  </tr>
                </thead>
                <tbody>
                  {// eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (lignes as any[]).map((ligne) => (
                    <tr key={ligne.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-5">
                        <p className="text-coplio-text">{ligne.description}</p>
                        {ligne.compte && (
                          <p className="text-xs text-muted-foreground font-mono">
                            {ligne.compte.numero} — {ligne.compte.libelle}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right text-muted-foreground">{ligne.quantite}</td>
                      <td className="py-3 px-3 text-right font-mono">{formatEuro(ligne.prix_unitaire_ht ?? 0)}</td>
                      <td className="py-3 px-3 text-right text-muted-foreground">{ligne.taux_tva ?? 0} %</td>
                      <td className="py-3 px-5 text-right font-mono font-semibold text-coplio-text">
                        {formatEuro(ligne.montant_ttc ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-border">
                    <td colSpan={3} className="py-3 px-5 text-sm font-semibold text-coplio-text">Total</td>
                    <td className="py-3 px-3 text-right text-sm text-muted-foreground">
                      TVA : {formatEuro(facture.montant_tva ?? 0)}
                    </td>
                    <td className="py-3 px-5 text-right font-mono font-bold text-[#374151]">
                      {formatEuro(facture.montant_ttc ?? 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Historique paiements */}
          {paiements && paiements.length > 0 && (
            <div className="coplio-card overflow-hidden p-0">
              <div className="px-5 py-3 border-b border-border">
                <p className="text-sm font-semibold text-coplio-text">Historique des paiements</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50/40">
                    <th className="text-left py-2 px-5 text-xs text-muted-foreground font-medium">Date</th>
                    <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Mode</th>
                    <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Référence</th>
                    <th className="text-right py-2 px-5 text-xs text-muted-foreground font-medium">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {paiements.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="py-2.5 px-5 text-muted-foreground">{formatDate(p.date_paiement)}</td>
                      <td className="py-2.5 px-3">{MODE_PAIEMENT[p.mode_paiement] ?? p.mode_paiement}</td>
                      <td className="py-2.5 px-3 text-muted-foreground font-mono text-xs">{p.reference ?? '—'}</td>
                      <td className="py-2.5 px-5 text-right font-mono font-semibold text-emerald-600">
                        {formatEuro(p.montant)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sidebar récap montants */}
        <div className="space-y-4">
          <div className="coplio-card space-y-3">
            <p className="text-sm font-semibold text-coplio-text">Récapitulatif</p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant HT</span>
                <span className="font-medium text-coplio-text">{formatEuro(facture.montant_ht ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TVA</span>
                <span className="font-medium text-coplio-text">{formatEuro(facture.montant_tva ?? 0)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                <span className="text-coplio-text">Total TTC</span>
                <span className="text-[#374151]">{formatEuro(facture.montant_ttc ?? 0)}</span>
              </div>
            </div>

            {montantPaye > 0 && (
              <>
                <div className="border-t border-border pt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payé</span>
                    <span className="font-medium text-emerald-600">{formatEuro(montantPaye)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className={soldeRestant > 0 ? 'text-red-600' : 'text-emerald-700'}>
                      {soldeRestant > 0 ? 'Reste à payer' : 'Solde'}
                    </span>
                    <span className={soldeRestant > 0 ? 'text-red-600' : 'text-emerald-700'}>
                      {formatEuro(Math.abs(soldeRestant))}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Barre de progression paiement */}
            {facture.montant_ttc > 0 && montantPaye > 0 && (
              <div className="space-y-1">
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (montantPaye / facture.montant_ttc) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  {Math.round((montantPaye / facture.montant_ttc) * 100)} % réglé
                </p>
              </div>
            )}
          </div>

          {/* Infos comptables */}
          {facture.ecriture_id && (
            <div className="coplio-card">
              <p className="text-xs font-medium text-muted-foreground mb-2">Écriture comptable</p>
              <Link
                href={`/comptabilite/ecritures/${facture.ecriture_id}?copropriete=${selectedId}`}
                className="flex items-center gap-2 text-sm text-[#374151] hover:underline font-medium"
              >
                <CreditCard className="w-4 h-4" />
                Voir l&apos;écriture →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
