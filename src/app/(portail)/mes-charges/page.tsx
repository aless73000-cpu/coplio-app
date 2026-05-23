import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckCircle2, AlertTriangle, Clock, CreditCard, Building2, ArrowRight } from 'lucide-react'
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
      <div className="max-w-3xl mx-auto py-4">
        <h1 className="text-2xl font-bold text-coplio-text mb-6">Mes charges</h1>
        <div className="bg-white rounded-2xl border border-border p-10 text-center shadow-sm">
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
    .limit(60)

  const lot = profile.lot as { numero: string; etage?: string; copropriete: { id: string; nom: string; iban?: string; banque?: string } } | null

  const appelsList = appels ?? []
  const total_du = appelsList.reduce(
    (s: number, a) => (!a.paye ? s + (a.montant - (a.montant_paye ?? 0)) : s), 0
  )
  const hasOverdue = appelsList.some((a) => !a.paye && new Date(a.date_echeance) < new Date())
  const prochainAppel = appelsList.filter((a) => !a.paye).sort(
    (a, b) => new Date(a.date_echeance).getTime() - new Date(b.date_echeance).getTime()
  )[0]

  // Group by year
  const byYear = appelsList.reduce<Record<number, typeof appelsList>>((acc, a) => {
    const year = new Date(a.date_echeance).getFullYear()
    if (!acc[year]) acc[year] = []
    acc[year].push(a)
    return acc
  }, {})
  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a)

  const currentYear = new Date().getFullYear()

  return (
    <div className="max-w-3xl mx-auto space-y-5 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Mes charges</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {lot?.copropriete?.nom} · Lot {lot?.numero}
            {lot?.etage && ` · ${lot.etage}`}
          </p>
        </div>
        <DownloadChargesPDF
          charges={appelsList.map((a) => ({
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

      {/* State banner */}
      {total_du > 0 ? (
        <div className={`rounded-2xl border p-5 ${hasOverdue ? 'bg-coplio-red-bg border-coplio-red/20' : 'bg-coplio-amber-bg border-coplio-amber/20'}`}>
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${hasOverdue ? 'text-coplio-red' : 'text-coplio-amber'}`} />
            <div>
              <p className={`font-semibold ${hasOverdue ? 'text-coplio-red' : 'text-coplio-amber'}`}>
                {hasOverdue ? 'Paiement en retard' : 'Paiement en attente'}
              </p>
              <p className={`text-sm mt-0.5 ${hasOverdue ? 'text-coplio-red/70' : 'text-coplio-amber/70'}`}>
                {formatEuro(total_du)} à régler
                {prochainAppel && ` · ${hasOverdue ? 'Échéance dépassée le' : 'Avant le'} ${formatDate(prochainAppel.date_echeance)}`}
              </p>
            </div>
          </div>

          {/* Payment instructions */}
          <div className="bg-white rounded-xl border border-border p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Comment payer ?</p>
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Bénéficiaire</p>
                <p className="text-sm font-semibold text-coplio-text">{lot?.copropriete?.nom ?? 'Syndicat des copropriétaires'}</p>
              </div>
            </div>
            {lot?.copropriete?.iban ? (
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">IBAN</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm font-mono font-semibold text-coplio-text truncate">{lot.copropriete.iban}</p>
                    <CopyButton text={lot.copropriete.iban} />
                  </div>
                </div>
              </div>
            ) : null}
            {lot?.copropriete?.banque && (
              <div className="flex items-center gap-3">
                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Banque</p>
                  <p className="text-sm font-medium text-coplio-text">{lot.copropriete.banque}</p>
                </div>
              </div>
            )}
            <div className="bg-coplio-bg rounded-lg px-3 py-2 mt-1">
              <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                <span>
                  <span className="font-semibold text-coplio-text">Référence : </span>
                  <span className="font-mono">LOT-{lot?.numero ?? '?'} · {profile?.prenom} {profile?.nom}</span>
                </span>
                <CopyButton text={`LOT-${lot?.numero ?? '?'} · ${profile?.prenom} ${profile?.nom}`} />
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-coplio-green-light border border-coplio-green/20 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-coplio-green rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-coplio-green text-lg">Votre compte est à jour</p>
            <p className="text-sm text-coplio-green/70 mt-0.5">Aucun paiement en attente · Continuez comme ça !</p>
          </div>
        </div>
      )}

      {/* Historique */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-coplio-text">Historique des appels</h2>
          <span className="text-xs text-muted-foreground">{appelsList.length} appel{appelsList.length > 1 ? 's' : ''}</span>
        </div>

        {appelsList.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">Aucun appel de charges</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {years.map((year) => (
              <div key={year}>
                {/* Year header */}
                <div className="px-5 py-2.5 bg-coplio-bg flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${year === currentYear ? 'bg-coplio-green' : 'bg-gray-300'}`} />
                  <span className={`text-xs font-semibold uppercase tracking-wide ${year === currentYear ? 'text-coplio-green' : 'text-muted-foreground'}`}>
                    {year}
                  </span>
                </div>
                {/* Appels for this year */}
                {byYear[year].map((appel) => {
                  const isLate = !appel.paye && new Date(appel.date_echeance) < new Date()
                  const restant = appel.montant - (appel.montant_paye ?? 0)
                  return (
                    <div key={appel.id} className="flex items-center gap-4 px-5 py-4 hover:bg-coplio-bg/50 transition-colors">
                      {/* Status dot */}
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        appel.paye ? 'bg-coplio-green' :
                        isLate ? 'bg-coplio-red' : 'bg-coplio-amber'
                      }`} />
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-coplio-text">{appel.libelle}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Envoyé le {formatDate(appel.date_appel)} · Échéance {formatDate(appel.date_echeance)}
                        </p>
                        {!appel.paye && (appel.montant_paye ?? 0) > 0 && (
                          <p className="text-xs text-coplio-amber mt-0.5">
                            {formatEuro(appel.montant_paye ?? 0)} réglé · Reste {formatEuro(restant)}
                          </p>
                        )}
                      </div>
                      {/* Amount + badge */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-coplio-text">{formatEuro(appel.montant)}</p>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 ${
                          appel.paye
                            ? 'bg-coplio-green-light text-coplio-green'
                            : isLate
                              ? 'bg-coplio-red-bg text-coplio-red'
                              : 'bg-coplio-amber-bg text-coplio-amber'
                        }`}>
                          {appel.paye
                            ? <><CheckCircle2 className="w-2.5 h-2.5" /> Payé</>
                            : isLate
                              ? <><AlertTriangle className="w-2.5 h-2.5" /> En retard</>
                              : <><Clock className="w-2.5 h-2.5" /> En attente</>
                          }
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
