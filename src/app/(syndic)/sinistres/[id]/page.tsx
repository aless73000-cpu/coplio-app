import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Clock, CheckCircle2, Wrench, FileText, Shield, XCircle } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'
import { SINISTRE_STATUS_LABELS } from '@/types'
import { SinistreAssuranceForm } from '@/components/syndic/SinistreAssuranceForm'


export const metadata = { title: 'Détail sinistre | Coplio' }

const STATUS_STEPS = [
  { key: 'signale', label: 'Signalé', icon: AlertTriangle },
  { key: 'assurance_declaree', label: 'Assurance déclarée', icon: Shield },
  { key: 'urgence', label: 'Urgence', icon: Clock },
  { key: 'expertise', label: 'Expertise', icon: FileText },
  { key: 'travaux', label: 'Travaux', icon: Wrench },
  { key: 'cloture', label: 'Clôturé', icon: CheckCircle2 },
]

export default async function SinistrePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()
  if (!profile?.cabinet_id) redirect('/onboarding')

  const { data: sinistre } = await supabase
    .from('sinistres')
    .select('*, copropriete:coproprietes(id, nom, adresse), declarant:profiles(prenom, nom)')
    .eq('id', params.id)
    .eq('cabinet_id', profile.cabinet_id)
    .single()

  if (!sinistre) notFound()

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === sinistre.status)

  const statusColors: Record<string, string> = {
    signale: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    assurance_declaree: 'bg-blue-50 text-blue-700 border-blue-200',
    urgence: 'bg-red-50 text-red-700 border-red-200',
    expertise: 'bg-orange-50 text-orange-700 border-orange-200',
    travaux: 'bg-purple-50 text-purple-700 border-purple-200',
    cloture: 'bg-green-50 text-green-700 border-green-200',
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/sinistres" className="text-muted-foreground hover:text-coplio-text transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-coplio-text">{sinistre.titre}</h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColors[sinistre.status ?? ''] ?? ''}`}>
              {SINISTRE_STATUS_LABELS[sinistre.status as keyof typeof SINISTRE_STATUS_LABELS] ?? sinistre.status}
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            {sinistre.reference} · {sinistre.copropriete?.nom}
          </p>
        </div>
      </div>

      {/* Progression */}
      <div className="coplio-card mb-6">
        <h2 className="font-semibold text-coplio-text mb-4">Progression</h2>
        <div className="flex items-center gap-0">
          {STATUS_STEPS.map((step, i) => {
            const isDone = i < currentStepIndex
            const isCurrent = i === currentStepIndex
            const Icon = step.icon
            return (
              <div key={step.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isDone ? 'bg-[#374151] border-[#374151] text-white' :
                    isCurrent ? 'bg-white border-[#374151] text-[#374151]' :
                    'bg-white border-border text-muted-foreground'
                  }`}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-xs mt-1 text-center leading-tight max-w-[60px] ${
                    isCurrent ? 'text-[#374151] font-medium' : isDone ? 'text-coplio-text' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mb-4 mx-1 ${i < currentStepIndex ? 'bg-[#374151]' : 'bg-border'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {sinistre.description && (
            <div className="coplio-card">
              <h2 className="font-semibold text-coplio-text mb-3">Description</h2>
              <p className="text-sm text-coplio-text leading-relaxed whitespace-pre-wrap">{sinistre.description}</p>
            </div>
          )}

          {/* Suivi assurance */}
          <SinistreAssuranceForm
            sinistreId={sinistre.id}
            compagnie_assurance={sinistre.compagnie_assurance}
            numero_declaration_assurance={sinistre.numero_declaration_assurance}
            montant_sinistre={(sinistre as Record<string, unknown>).montant_sinistre as number | undefined}
            montant_indemnise={(sinistre as Record<string, unknown>).montant_indemnise as number | undefined}
          />

          {/* Changer le statut */}
          <div className="coplio-card">
            <h2 className="font-semibold text-coplio-text mb-3">Mettre à jour le statut</h2>
            <div className="flex flex-wrap gap-2">
              {STATUS_STEPS.filter(s => s.key !== sinistre.status).map(step => (
                <form key={step.key} action={`/api/sinistres/${sinistre.id}/status`} method="POST">
                  <input type="hidden" name="status" value={step.key} />
                  <button type="submit" className="text-xs px-3 py-1.5 border border-border rounded-lg hover:border-[#374151] hover:text-[#374151] transition-colors">
                    → {step.label}
                  </button>
                </form>
              ))}
            </div>
          </div>
        </div>

        {/* Infos latérales */}
        <div className="space-y-4">
          <div className="coplio-card">
            <h3 className="font-semibold text-coplio-text mb-3">Informations</h3>
            <dl className="space-y-2.5 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs">Copropriété</dt>
                <dd className="font-medium text-coplio-text mt-0.5">
                  <Link href={`/coproprietes/${sinistre.copropriete?.id}`} className="text-[#374151] hover:underline">
                    {sinistre.copropriete?.nom}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Date de déclaration</dt>
                <dd className="font-medium text-coplio-text mt-0.5">{formatDate(sinistre.created_at ?? '')}</dd>
              </div>
              {sinistre.declarant && (
                <div>
                  <dt className="text-muted-foreground text-xs">Déclaré par</dt>
                  <dd className="font-medium text-coplio-text mt-0.5">
                    {sinistre.declarant.prenom} {sinistre.declarant.nom}
                  </dd>
                </div>
              )}
              {sinistre.compagnie_assurance && (
                <div>
                  <dt className="text-muted-foreground text-xs">Assureur</dt>
                  <dd className="font-medium text-coplio-text mt-0.5">{sinistre.compagnie_assurance}</dd>
                </div>
              )}
              {sinistre.numero_declaration_assurance && (
                <div>
                  <dt className="text-muted-foreground text-xs">N° déclaration assurance</dt>
                  <dd className="font-medium text-coplio-text mt-0.5">{sinistre.numero_declaration_assurance}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
