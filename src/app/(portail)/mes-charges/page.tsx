import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckCircle2, AlertTriangle, TrendingUp, Clock, CreditCard, Building2 } from 'lucide-react'
import { formatEuro, formatDate } from '@/lib/utils'
import type { AppelCharges } from '@/types'
import { DownloadChargesPDF } from '@/components/portail/DownloadChargesPDF'
import { CopyButton } from '@/components/portail/CopyButton'

export default async function MesChargesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portail')

  const { data: profile } = await supabase
    .from('profiles')
    .select('lot_id, prenom, nom, lot:lots(numero, etage, copropriete:coproprietes(id, nom, iban, banque))')
    .eq('id', user.id)
    .single()

  if (!profile?.lot_id) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-coplio-text mb-6">Mes charges</h1>
        <div className="coplio-card text-center py-12">
          <AlertTriangle className="w-10 h-10 text-coplio-amber mx-auto mb-3" />
          <p className="font-semibold text-coplio-text">Aucun lot associé</p>
          <p className="text-sm text-muted-foreground mt-1">Contactez votre syndic pour accéder à vos informations.</p>
        </div>
      </div>
    )
  }

  const { data: appels } = await supabase
    .from('appels_charges')
    .select('*')
    .eq('lot_id', profile.lot_id)
    .order('date_echeance', { ascending: false })
    .limit(50)

  const lot = profile.lot as unknown as { numero: string; etage?: string; copropriete: { id: string; nom: string; iban?: string; banque?: string } } | null

  const total_du = (appels ?? []).reduce(
    (s: number, a) => (!a.paye ? s + (a.montant - (a.montant_paye ?? 0)) : s), 0
  )
  const total_annuel = (appels ?? [])
    .filter((a) => new Date(a.date_appel).getFullYear() === new Date().getFullYear())
    .reduce((s: number, a) => s + a.montant, 0)
  const enRetard = (appels ?? []).filter(
    (a) => !a.paye && new Date(a.date_echeance) < new Date()
  )
  const pays = (appels ?? []).filter((a) => a.paye)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Mes charges</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {lot?.copropriete?.nom} · Lot {lot?.numero}
            {lot?.etage && ` · ${lot.etage}`}
          </p>
        </div>
        <DownloadChargesPDF
          charges={(appels ?? []).map((a) => ({
            libelle: a.libelle,
            date_appel: a.date_appel,
            date_echeance: a.date_echeance,
            montant: a.montant,
            montant_paye: a.montant_paye ?? 0,
            paye: a.paye ?? false,
          }))}
          lotNumero={lot?.numero ?? ''}
          coproprieteNom={lot?.copropriete?.nom ?? ''}
          prenom={profile?.prenom ?? ''}
          nom={profile?.nom ?? ''}
        />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`coplio-card ${total_du > 0 ? 'border-coplio-red/30 bg-coplio-red-bg' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Solde dû</p>
            {total_du > 0
              ? <AlertTriangle className="w-4 h-4 text-coplio-red" />
              : <CheckCircle2 className="w-4 h-4 text-coplio-green" />
            }
          </div>
          <p className={`text-2xl font-bold ${total_du > 0 ? 'text-coplio-red' : 'text-coplio-green'}`}>
            {formatEuro(total_du)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{total_du > 0 ? 'À régler' : 'Vous êtes à jour'}</p>
        </div>

        <div className="coplio-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Charges {new Date().getFullYear()}</p>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold text-coplio-text">{formatEuro(total_annuel)}</p>
          <p className="text-xs text-muted-foreground mt-1">Total annuel</p>
        </div>

        <div className="coplio-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">En retard</p>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className={`text-2xl font-bold ${enRetard.length > 0 ? 'text-coplio-red' : 'text-coplio-green'}`}>
            {enRetard.length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {enRetard.length > 0 ? `appel${enRetard.length > 1 ? 's' : ''} impayé${enRetard.length > 1 ? 's' : ''}` : 'Aucun retard'}
          </p>
        </div>

        <div className="coplio-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Réglés</p>
            <CheckCircle2 className="w-4 h-4 text-coplio-green" />
          </div>
          <p className="text-2xl font-bold text-coplio-text">{pays.length}</p>
          <p className="text-xs text-muted-foreground mt-1">appels payés</p>
        </div>
      </div>

      {/* Comment payer */}
      {total_du > 0 && (
        <div className="coplio-card border-coplio-green/30 bg-coplio-green-light/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-coplio-green rounded-xl flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-coplio-text">Comment régler mes charges ?</h2>
              <p className="text-xs text-muted-foreground">Effectuez un virement bancaire aux coordonnées ci-dessous</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bénéficiaire</p>
              </div>
              <p className="font-semibold text-coplio-text">{lot?.copropriete?.nom ?? 'Syndicat de copropriété'}</p>
              <p className="text-xs text-muted-foreground mt-1">Syndicat des copropriétaires</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Coordonnées bancaires</p>
              </div>
              {lot?.copropriete?.iban ? (
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">IBAN</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono font-semibold text-coplio-text flex-1 min-w-0 truncate">{lot.copropriete.iban}</p>
                      <CopyButton text={lot.copropriete.iban} />
                    </div>
                  </div>
                  {lot.copropriete.banque && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Banque</p>
                      <p className="text-sm font-medium text-coplio-text">{lot.copropriete.banque}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Contactez votre syndic pour obtenir les coordonnées bancaires.</p>
              )}
            </div>
          </div>
          <div className="mt-3 px-4 py-3 bg-white rounded-xl border border-border">
            <p className="text-xs text-muted-foreground">
              <strong className="text-coplio-text">Référence à indiquer :</strong>{' '}
              <span className="font-mono">LOT-{lot?.numero ?? '?'} · {profile?.prenom} {profile?.nom}</span>
            </p>
          </div>
        </div>
      )}

      {/* Table des appels */}
      <div className="coplio-card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-coplio-text">Historique des appels de charges</h2>
        </div>
        {!appels || appels.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Aucun appel de charges</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-coplio-bg">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-6 py-3">Libellé</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">Date d'appel</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">Échéance</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">Montant</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide px-6 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {appels.map((appel) => {
                const isLate = !appel.paye && new Date(appel.date_echeance) < new Date()
                const restant = appel.montant - (appel.montant_paye ?? 0)
                return (
                  <tr key={appel.id} className="hover:bg-coplio-bg/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-coplio-text">{appel.libelle}</p>
                      {!appel.paye && (appel.montant_paye ?? 0) > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatEuro(appel.montant_paye ?? 0)} réglé · reste {formatEuro(restant)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{formatDate(appel.date_appel)}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{formatDate(appel.date_echeance)}</td>
                    <td className="px-4 py-4 text-right text-sm font-semibold text-coplio-text">{formatEuro(appel.montant)}</td>
                    <td className="px-6 py-4 text-right">
                      {appel.paye ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-coplio-green bg-coplio-green-light px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Payé
                        </span>
                      ) : isLate ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-coplio-red bg-coplio-red-bg px-2.5 py-1 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> En retard
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-coplio-amber bg-coplio-amber-bg px-2.5 py-1 rounded-full">
                          <Clock className="w-3 h-3" /> En attente
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
