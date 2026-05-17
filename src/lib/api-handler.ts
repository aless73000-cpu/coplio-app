import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
      console.error('[API Error]', err)
      return NextResponse.json(
        { error: 'Erreur serveur inattendue' },
        { status: 500 }
      )
    }
  }
}

export type CabinetContext = {
  supabase: Awaited<ReturnType<typeof createClient>>
  userId: string
  cabinetId: string
}

/**
 * Resolves the authenticated user and their cabinet_id in a single call.
 * Returns a NextResponse error if unauthenticated or cabinet not found,
 * or a CabinetContext object to use directly in the handler.
 */
export async function requireCabinetUser(): Promise<NextResponse | CabinetContext> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

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
