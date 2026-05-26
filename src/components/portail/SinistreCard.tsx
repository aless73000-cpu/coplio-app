import { CheckCircle2, Shield } from 'lucide-react'
import type { Sinistre, SinistreStatus } from '@/types'
import { SINISTRE_STATUS_LABELS } from '@/types'
import { formatDate, formatEuro } from '@/lib/utils'

export const SINISTRE_STEP_ORDER: SinistreStatus[] = [
  'signale', 'assurance_declaree', 'expertise', 'travaux', 'cloture',
]

export function SinistreCard({
  sinistre,
  photos = [],
}: {
  sinistre: Sinistre & { copropriete?: { nom: string } | null }
  photos?: string[]
}) {
  const stepIndex = SINISTRE_STEP_ORDER.indexOf((sinistre.status ?? 'signale') as SinistreStatus)
  const progress = Math.round(((stepIndex + 1) / SINISTRE_STEP_ORDER.length) * 100)
  const isClosed = sinistre.status === 'cloture'
  const isUrgent = sinistre.status === 'urgence'
  const hasAssurance = sinistre.compagnie_assurance || sinistre.numero_declaration_assurance

  return (
    <div className={`coplio-card ${isUrgent ? 'border-coplio-red/30' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0 pr-3">
          <h3 className="font-semibold text-coplio-text leading-snug">{sinistre.titre}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {sinistre.reference}
            {sinistre.copropriete?.nom && ` · ${sinistre.copropriete.nom}`}
          </p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
          isClosed ? 'bg-slate-100 text-[#374151]' :
          isUrgent ? 'bg-coplio-red-bg text-coplio-red' :
          'bg-coplio-amber-bg text-coplio-amber'
        }`}>
          {SINISTRE_STATUS_LABELS[(sinistre.status ?? 'signale') as SinistreStatus]}
        </span>
      </div>

      {/* Progression */}
      {!isClosed && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Avancement</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-coplio-bg rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isUrgent ? 'bg-coplio-red' : 'bg-slate-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Étapes */}
      <div className="flex items-start gap-1 mb-3">
        {SINISTRE_STEP_ORDER.map((step, i) => {
          const done = stepIndex >= i
          return (
            <div key={step} className="flex-1 flex flex-col items-center gap-1">
              <div className="relative w-full flex items-center">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center z-10 mx-auto flex-shrink-0 ${
                  done
                    ? isUrgent ? 'bg-coplio-red border-coplio-red' : 'bg-[#374151] border-[#374151]'
                    : 'bg-white border-border'
                }`}>
                  {done && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                </div>
                {i < SINISTRE_STEP_ORDER.length - 1 && (
                  <div className={`absolute left-1/2 w-full h-0.5 top-2 ${
                    done && stepIndex > i ? (isUrgent ? 'bg-coplio-red/50' : 'bg-[#374151]/50') : 'bg-border'
                  }`} />
                )}
              </div>
              <span className="text-[9px] text-muted-foreground text-center leading-tight">
                {SINISTRE_STATUS_LABELS[step as SinistreStatus].split(' ')[0]}
              </span>
            </div>
          )
        })}
      </div>

      {/* Assurance */}
      {hasAssurance && (
        <div className="pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs font-semibold text-coplio-text">Assurance</span>
          </div>
          <div className="space-y-0.5">
            {sinistre.compagnie_assurance && (
              <p className="text-xs text-muted-foreground">
                Compagnie : <span className="text-coplio-text font-medium">{sinistre.compagnie_assurance}</span>
              </p>
            )}
            {sinistre.numero_declaration_assurance && (
              <p className="text-xs text-muted-foreground">
                N° : <span className="text-coplio-text font-medium">{sinistre.numero_declaration_assurance}</span>
              </p>
            )}
            {(sinistre.montant_indemnisation ?? 0) > 0 && (
              <p className="text-xs text-[#374151] font-semibold">
                Indemnisation : {formatEuro(sinistre.montant_indemnisation!)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Photos */}
      {photos.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {photos.length} photo{photos.length > 1 ? 's' : ''} jointe{photos.length > 1 ? 's' : ''}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {photos.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Photo ${i + 1}`}
                  className="w-16 h-16 object-cover rounded-xl border border-border hover:opacity-80 transition-opacity"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      <div className={`${hasAssurance || photos.length > 0 ? 'mt-2' : 'mt-3 pt-3 border-t border-border'}`}>
        <p className="text-xs text-muted-foreground">
          Déclaré le {sinistre.date_sinistre ? formatDate(sinistre.date_sinistre) : '—'}
          {isClosed && sinistre.date_cloture && ` · Clôturé le ${formatDate(sinistre.date_cloture)}`}
        </p>
      </div>
    </div>
  )
}
