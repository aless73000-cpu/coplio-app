'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowRight, Zap } from 'lucide-react'

interface Props {
  current: number
  max: number
  plan: string
  resource: 'lots' | 'gestionnaires'
  className?: string
}

const RESOURCE_LABELS: Record<string, string> = {
  lots: 'lots',
  gestionnaires: 'gestionnaires',
}

const NEXT_PLAN: Record<string, { name: string; href: string }> = {
  trial:   { name: 'Starter', href: '/facturation?upgrade=starter' },
  starter: { name: 'Pro',     href: '/facturation?upgrade=pro' },
  pro:     { name: 'Expert',  href: '/facturation?upgrade=expert' },
  expert:  { name: 'Expert',  href: '/facturation' },
}

export function QuotaExceededBanner({ current, max, plan, resource, className = '' }: Props) {
  const label = RESOURCE_LABELS[resource] ?? resource
  const next = NEXT_PLAN[plan] ?? NEXT_PLAN.starter

  return (
    <div className={`flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl ${className}`}>
      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900">
          Limite de {label} atteinte ({current}/{max})
        </p>
        <p className="text-xs text-amber-700 mt-0.5">
          Votre plan <span className="font-medium capitalize">{plan}</span> permet {max} {label} maximum.
          Passez au plan <span className="font-medium">{next.name}</span> pour continuer.
        </p>
      </div>
      <Link
        href={next.href}
        className="flex items-center gap-1.5 bg-amber-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors flex-shrink-0 whitespace-nowrap"
      >
        <Zap className="w-3 h-3" />
        Upgrader
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  )
}

/** Hook pour afficher le banner si la réponse API retourne QUOTA_EXCEEDED */
export function useQuotaError(error: string | null): {
  isQuotaError: boolean
  quotaData: { current: number; max: number; plan: string; resource: string } | null
} {
  if (!error || error !== 'QUOTA_EXCEEDED') {
    return { isQuotaError: false, quotaData: null }
  }
  return { isQuotaError: true, quotaData: null }
}
