import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { PLAN_LIMITS } from '@/lib/stripe'

export type QuotaResource = 'lots' | 'gestionnaires' | 'coproprietes'

export interface QuotaResult {
  allowed: boolean
  current: number
  max: number
  plan: string
  upgradeRequired: boolean
}

/**
 * Vérifie si un cabinet peut créer `adding` ressources supplémentaires.
 * Doit être appelé depuis les routes API avant toute insertion.
 */
export async function checkQuota(
  cabinetId: string,
  resource: QuotaResource,
  adding: number = 1
): Promise<QuotaResult> {
  const admin = createAdminClient()

  const { data: cabinet } = await admin
    .from('cabinets')
    .select('plan, max_lots, max_gestionnaires, subscription_status, trial_ends_at')
    .eq('id', cabinetId)
    .single()

  if (!cabinet) {
    return { allowed: false, current: 0, max: 0, plan: 'unknown', upgradeRequired: true }
  }

  // BIZ-01 : abonnement annulé ou expiré → bloquer immédiatement
  const BLOCKED_STATUSES = ['canceled', 'incomplete_expired']
  if (BLOCKED_STATUSES.includes(cabinet.subscription_status ?? '')) {
    return { allowed: false, current: 0, max: 0, plan: cabinet.plan ?? 'unknown', upgradeRequired: true }
  }

  // Trial expiré → bloquer
  if (cabinet.subscription_status === 'trialing' && cabinet.trial_ends_at) {
    if (new Date(cabinet.trial_ends_at) < new Date()) {
      return { allowed: false, current: 0, max: 0, plan: cabinet.plan ?? 'unknown', upgradeRequired: true }
    }
  }

  const plan = cabinet.plan as keyof typeof PLAN_LIMITS
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.starter

  if (resource === 'lots') {
    const max = cabinet.max_lots ?? limits.max_lots

    // Compte tous les lots de toutes les copropriétés du cabinet
    const { count } = await admin
      .from('lots')
      .select('id', { count: 'exact', head: true })
      .in(
        'copropriete_id',
        (
          await admin
            .from('coproprietes')
            .select('id')
            .eq('cabinet_id', cabinetId)
        ).data?.map((c: { id: string }) => c.id) ?? []
      )

    const current = count ?? 0
    const allowed = current + adding <= max

    return { allowed, current, max, plan: cabinet.plan ?? 'unknown', upgradeRequired: !allowed }
  }

  if (resource === 'gestionnaires') {
    const max = cabinet.max_gestionnaires ?? limits.max_gestionnaires

    const { count } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('cabinet_id', cabinetId)
      .in('role', ['owner', 'manager'])

    const current = count ?? 0
    const allowed = current + adding <= max

    return { allowed, current, max, plan: cabinet.plan ?? 'unknown', upgradeRequired: !allowed }
  }

  if (resource === 'coproprietes') {
    const max = limits.max_coproprietes

    const { count } = await admin
      .from('coproprietes')
      .select('id', { count: 'exact', head: true })
      .eq('cabinet_id', cabinetId)

    const current = count ?? 0
    const allowed = current + adding <= max

    return { allowed, current, max, plan: cabinet.plan ?? 'unknown', upgradeRequired: !allowed }
  }

  return { allowed: true, current: 0, max: 999, plan: cabinet.plan ?? 'unknown', upgradeRequired: false }
}

/** Réponse 403 standard avec détails pour le frontend */
export function quotaExceededResponse(quota: QuotaResult) {
  return NextResponse.json(
    {
      error: 'QUOTA_EXCEEDED',
      current: quota.current,
      max: quota.max,
      plan: quota.plan,
      message: `Limite atteinte (${quota.current}/${quota.max}). Passez à un plan supérieur pour continuer.`,
    },
    { status: 403 }
  )
}
