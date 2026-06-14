import { NextResponse } from 'next/server'
import { captureException } from '@/lib/monitoring'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export type CabinetUser = {
  /** Client Supabase lié à la session (RLS active). */
  supabase: SupabaseClient<Database>
  /** `profiles.id` de l'utilisateur authentifié. */
  userId: string
  /** `profiles.cabinet_id` — tenant de l'utilisateur. */
  cabinetId: string
}

/**
 * Résout en une seule étape l'utilisateur authentifié **et** son cabinet (tenant).
 *
 * Remplace le boilerplate dupliqué dans la plupart des routes API :
 * `auth.getUser()` + `select('cabinet_id').eq('id', user.id)`.
 *
 * @returns `{ supabase, userId, cabinetId }` si OK, sinon une `NextResponse`
 *   (401 si non authentifié, 400 si l'utilisateur n'est rattaché à aucun cabinet).
 *
 * Usage :
 * ```ts
 * const auth = await requireCabinetUser()
 * if (auth instanceof NextResponse) return auth
 * const { supabase, userId, cabinetId } = auth
 * ```
 */
export async function requireCabinetUser(): Promise<CabinetUser | NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()

  if (!profile?.cabinet_id) {
    return NextResponse.json({ error: 'Cabinet non trouvé' }, { status: 400 })
  }

  return { supabase, userId: user.id, cabinetId: profile.cabinet_id }
}

/**
 * Wraps an API handler with a global try/catch so any unhandled error
 * returns a clean 500 JSON instead of crashing the edge function.
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args)
    } catch (err) {
      captureException(err)
      return NextResponse.json(
        { error: 'Erreur serveur inattendue' },
        { status: 500 }
      )
    }
  }
}
