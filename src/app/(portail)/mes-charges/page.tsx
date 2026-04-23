import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreditCard, CheckCircle2, Clock, AlertTriangle, TrendingUp } from 'lucide-react'
import { formatEuro, formatDate } from '@/lib/utils'
import type { AppelCharges } from '@/types'

export default async function MesChargesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, lot:lots(*, copropriete:coproprietes(nom, adresse))')
    .eq('id', user.id)
    .single()

  if (!profile?.lot_id) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-coplio-amber-bg rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-coplio-amber" />
        </div>
        <h2 className="font-semibold text-coplio-text mb-2">Aucun lot associé</h2>
        <p className="text-sm text-muted-foreground">
          Contactez votre syndic pour accéder à vos informations.
        </p>
      </div>
    )
  }

  const { data: appels } = await supabase
    .from('appels_charges')
    .select('*')
    .eq('lot_id', profile.lot_id)
    .order('date_echeance', { ascending: false })
    .limit(20)

  const total_du = (appels ?? []).reduce(
    (s: number, a: AppelCharges) => (!a.paye ? s + (a.montant - a.montant_paye) : s),
    0
  )

  const total_annuel = (appels ?? [])
    .filter((a: AppelCharges) => {
      const year = new Date(a.date_appel).getFullYear()
      return year === new Date().getFullYear()
    })
    .reduce((s: number, a: AppelCharges) => s + a.montant, 0)

  const enRetard = (appels ?? []).filter(
    (a: AppelCharges) => !a.paye && new Date(a.date_echeance) < new Date()
  )

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="bg-coplio-green px-6 pt-12 pb-8 text-white">
        <p className="text-white/70 text-sm mb-1">Mes charges</p>
        <h1 className="text-2xl font-bold mb-1">
          {(profile.lot as { copropriete?: { nom: string } })?.copropriete?.nom ?? 'Mon logement'}
        </h1>
        <p className="text-white/70 text-sm">
          Lot {(profile.lot as { numero?: string })?.numero}
          {(profile.lot as { etage?: string })?.etage && ` · ${(profile.lot as { etage?: string }).etage}`}
        </p>
      </div>

      {/* Solde */}
      <div className="px-4 -mt-6">
        <div className="bg-white rounded-2xl shadow-sm border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Solde à régler</p>
              <p className={`text-3xl font-bold mt-1 ${total_du > 0 ? 'text-coplio-red' : 'text-coplio-green'}`}>
                {formatEuro(total_du)}
              </p>
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              total_du > 0 ? 'bg-coplio-red-bg' : 'bg-coplio-green-light'
            }`}>
              {total_du > 0
                ? <AlertTriangle className="w-7 h-7 text-coplio-red" />
                : <CheckCircle2 className="w-7 h-7 text-coplio-green" />
              }
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground">Charges {new Date().getFullYear()}</p>
              <p className="font-bold text-coplio-text mt-0.5">{formatEuro(total_annuel)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Appels en retard</p>
              <p className={`font-bold mt-0.5 ${enRetard.length > 0 ? 'text-coplio-red' : 'text-coplio-green'}`}>
                {enRetard.length > 0 ? `${enRetard.length} impayé${enRetard.length > 1 ? 's' : ''}` : 'À jour'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des appels */}
      <div className="px-4 mt-6">
        <h2 className="font-semibold text-coplio-text mb-3">Historique des appels</h2>

        {(!appels || appels.length === 0) ? (
          <div className="text-center py-8">
            <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Aucun appel de charges</p>
          </div>
        ) : (
          <div className="space-y-2">
            {appels.map((appel: AppelCharges) => (
              <AppelCard key={appel.id} appel={appel} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AppelCard({ appel }: { appel: AppelCharges }) {
  const isLate = !appel.paye && new Date(appel.date_echeance) < new Date()
  const restant = appel.montant - appel.montant_paye

  return (
    <div className={`bg-white rounded-xl border p-4 ${
      appel.paye ? 'border-border' : isLate ? 'border-coplio-red/30' : 'border-coplio-amber/30'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-3">
          <p className="font-medium text-sm text-coplio-text">{appel.libelle}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Échéance : {formatDate(appel.date_echeance)}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-sm text-coplio-text">{formatEuro(appel.montant)}</p>
          {appel.paye ? (
            <span className="text-xs text-coplio-green flex items-center gap-1 justify-end mt-1">
              <CheckCircle2 className="w-3 h-3" /> Payé
            </span>
          ) : (
            <span className={`text-xs font-medium mt-1 block ${isLate ? 'text-coplio-red' : 'text-coplio-amber'}`}>
              Reste : {formatEuro(restant)}
            </span>
          )}
        </div>
      </div>

      {/* Barre de paiement partiel */}
      {!appel.paye && appel.montant_paye > 0 && (
        <div className="mt-3">
          <div className="h-1.5 bg-coplio-bg rounded-full overflow-hidden">
            <div
              className="h-full bg-coplio-green-medium rounded-full"
              style={{ width: `${(appel.montant_paye / appel.montant) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatEuro(appel.montant_paye)} réglé sur {formatEuro(appel.montant)}
          </p>
        </div>
      )}
    </div>
  )
}
