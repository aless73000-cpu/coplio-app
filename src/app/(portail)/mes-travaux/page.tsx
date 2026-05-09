import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Wrench, CheckCircle2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Sinistre } from '@/types'
import { SINISTRE_STATUS_LABELS } from '@/types'

const STEP_ORDER: Sinistre['status'][] = [
  'signale', 'assurance_declaree', 'expertise', 'travaux', 'cloture',
]

export default async function MesTravaux() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portail')

  const { data: profile } = await supabase
    .from('profiles').select('lot_id').eq('id', user.id).single()

  const { data: sinistres } = await supabase
    .from('sinistres')
    .select('*, copropriete:coproprietes(nom)')
    .contains('lots_concernes', [profile?.lot_id ?? ''])
    .order('created_at', { ascending: false })

  const enCours = (sinistres ?? []).filter((s) => s.status !== 'cloture')
  const clotures = (sinistres ?? []).filter((s) => s.status === 'cloture')

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-coplio-text">Travaux & sinistres</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {enCours.length} dossier{enCours.length > 1 ? 's' : ''} en cours
          {clotures.length > 0 && ` · ${clotures.length} clôturé${clotures.length > 1 ? 's' : ''}`}
        </p>
      </div>

      {(!sinistres || sinistres.length === 0) ? (
        <div className="coplio-card text-center py-16">
          <div className="w-14 h-14 bg-coplio-green-light rounded-full flex items-center justify-center mx-auto mb-3">
            <Wrench className="w-7 h-7 text-coplio-green" />
          </div>
          <p className="font-medium text-coplio-text">Aucun travaux en cours</p>
          <p className="text-sm text-muted-foreground mt-1">Vous n&apos;avez pas de sinistre vous concernant.</p>
        </div>
      ) : (
        <>
          {enCours.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {enCours.map((sinistre: Sinistre & { copropriete?: { nom: string } }) => (
                <TravauxCard key={sinistre.id} sinistre={sinistre} />
              ))}
            </div>
          )}

          {clotures.length > 0 && (
            <div>
              <h2 className="font-semibold text-muted-foreground text-sm uppercase tracking-wide mb-3">Dossiers clôturés</h2>
              <div className="grid grid-cols-2 gap-4">
                {clotures.map((sinistre: Sinistre & { copropriete?: { nom: string } }) => (
                  <TravauxCard key={sinistre.id} sinistre={sinistre} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function TravauxCard({ sinistre }: { sinistre: Sinistre & { copropriete?: { nom: string } } }) {
  const stepIndex = STEP_ORDER.indexOf(sinistre.status as Sinistre['status'])
  const progress = Math.round(((stepIndex + 1) / STEP_ORDER.length) * 100)
  const isClosed = sinistre.status === 'cloture'

  return (
    <div className="coplio-card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0 pr-3">
          <h3 className="font-semibold text-coplio-text">{sinistre.titre}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {sinistre.reference} · {sinistre.copropriete?.nom}
          </p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
          isClosed ? 'bg-coplio-green-light text-coplio-green' :
          sinistre.status === 'urgence' ? 'bg-coplio-red-bg text-coplio-red' :
          'bg-coplio-amber-bg text-coplio-amber'
        }`}>
          {SINISTRE_STATUS_LABELS[sinistre.status as Sinistre['status']]}
        </span>
      </div>

      {/* Progression */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Avancement</span>
          <span className={isClosed ? 'text-coplio-green font-medium' : ''}>{progress}%</span>
        </div>
        <div className="h-2 bg-coplio-bg rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${isClosed ? 'bg-coplio-green' : 'bg-coplio-green-medium'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Étapes */}
      <div className="flex items-start gap-1">
        {STEP_ORDER.map((step, i) => {
          const done = stepIndex >= i
          const isCurrent = stepIndex === i
          return (
            <div key={step} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="relative w-full flex items-center">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center z-10 flex-shrink-0 mx-auto ${
                  done ? 'bg-coplio-green border-coplio-green' :
                  isCurrent ? 'border-coplio-green bg-white' :
                  'bg-white border-border'
                }`}>
                  {done && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                {i < STEP_ORDER.length - 1 && (
                  <div className={`absolute left-1/2 w-full h-0.5 top-2.5 ${
                    done && stepIndex > i ? 'bg-coplio-green' : 'bg-border'
                  }`} />
                )}
              </div>
              <span className="text-[9px] text-muted-foreground text-center leading-tight">
                {SINISTRE_STATUS_LABELS[step].split(' ')[0]}
              </span>
            </div>
          )
        })}
      </div>

      {sinistre.date_sinistre && (
        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Déclaré le {formatDate(sinistre.date_sinistre)}
            {sinistre.date_cloture && ` · Clôturé le ${formatDate(sinistre.date_cloture)}`}
          </p>
        </div>
      )}
    </div>
  )
}
