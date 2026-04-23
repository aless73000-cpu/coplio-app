import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Wrench, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Sinistre } from '@/types'
import { SINISTRE_STATUS_LABELS } from '@/types'

const STEP_ORDER: Sinistre['status'][] = [
  'signale',
  'assurance_declaree',
  'expertise',
  'travaux',
  'cloture',
]

export default async function MesTravaux() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('lot_id')
    .eq('id', user.id)
    .single()

  // Sinistres qui concernent le lot de l'utilisateur
  const { data: sinistres } = await supabase
    .from('sinistres')
    .select('*, copropriete:coproprietes(nom)')
    .contains('lots_concernes', [profile?.lot_id ?? ''])
    .order('created_at', { ascending: false })

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="bg-coplio-green px-6 pt-12 pb-6 text-white">
        <p className="text-white/70 text-sm mb-1">Travaux & Sinistres</p>
        <h1 className="text-2xl font-bold">Mes travaux</h1>
        <p className="text-white/70 text-sm mt-1">
          {sinistres?.filter((s) => s.status !== 'cloture').length ?? 0} dossier(s) en cours
        </p>
      </div>

      <div className="px-4 mt-6 space-y-4">
        {(!sinistres || sinistres.length === 0) ? (
          <div className="bg-white rounded-2xl border border-border p-8 text-center">
            <div className="w-14 h-14 bg-coplio-green-light rounded-full flex items-center justify-center mx-auto mb-3">
              <Wrench className="w-7 h-7 text-coplio-green" />
            </div>
            <p className="font-medium text-coplio-text">Aucun travaux en cours</p>
            <p className="text-sm text-muted-foreground mt-1">
              Vous n&apos;avez pas de sinistre ou travaux vous concernant.
            </p>
          </div>
        ) : (
          sinistres.map((sinistre: Sinistre & { copropriete?: { nom: string } }) => (
            <TravauxCard key={sinistre.id} sinistre={sinistre} />
          ))
        )}
      </div>
    </div>
  )
}

function TravauxCard({ sinistre }: {
  sinistre: Sinistre & { copropriete?: { nom: string } }
}) {
  const stepIndex = STEP_ORDER.indexOf(sinistre.status as Sinistre['status'])
  const progress = Math.round(((stepIndex + 1) / STEP_ORDER.length) * 100)
  const isClosed = sinistre.status === 'cloture'

  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <h3 className="font-semibold text-coplio-text">{sinistre.titre}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {sinistre.reference} · {sinistre.copropriete?.nom}
          </p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${
          isClosed ? 'badge-a-jour' :
          sinistre.status === 'urgence' ? 'badge-urgent' :
          'badge-attention'
        }`}>
          {SINISTRE_STATUS_LABELS[sinistre.status as Sinistre['status']]}
        </span>
      </div>

      {/* Barre de progression */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Avancement</span>
          <span className={isClosed ? 'text-coplio-green font-medium' : ''}>{progress}%</span>
        </div>
        <div className="h-2 bg-coplio-bg rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isClosed ? 'bg-coplio-green' : 'bg-coplio-green-medium'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Étapes visuelles */}
      <div className="flex items-center justify-between">
        {STEP_ORDER.map((step, i) => {
          const done = STEP_ORDER.indexOf(sinistre.status as Sinistre['status']) >= i
          return (
            <div key={step} className="flex flex-col items-center gap-1 flex-1">
              {i < STEP_ORDER.length - 1 && (
                <div className="relative flex items-center w-full">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center z-10 flex-shrink-0 ${
                    done ? 'bg-coplio-green border-coplio-green' : 'bg-white border-border'
                  }`}>
                    {done && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <div className={`h-0.5 flex-1 ${done && STEP_ORDER.indexOf(sinistre.status as Sinistre['status']) > i ? 'bg-coplio-green' : 'bg-border'}`} />
                </div>
              )}
              {i === STEP_ORDER.length - 1 && (
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  done ? 'bg-coplio-green border-coplio-green' : 'bg-white border-border'
                }`}>
                  {done && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
              )}
              <span className="text-[8px] text-muted-foreground text-center leading-tight max-w-[40px]">
                {SINISTRE_STATUS_LABELS[step].split(' ')[0]}
              </span>
            </div>
          )
        })}
      </div>

      {/* Infos dates */}
      {sinistre.date_sinistre && (
        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Sinistre déclaré le {formatDate(sinistre.date_sinistre)}
            {sinistre.date_cloture && ` · Clôturé le ${formatDate(sinistre.date_cloture)}`}
          </p>
        </div>
      )}
    </div>
  )
}
