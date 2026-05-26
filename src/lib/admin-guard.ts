/**
 * Protection des routes d'administration.
 *
 * Double vérification :
 * 1. Session Supabase valide avec email dans ADMIN_EMAILS
 * 2. Header `x-admin-secret` correspondant à ADMIN_SECRET (si défini en prod)
 *
 * En production, ADMIN_SECRET est requis — un compte admin compromis
 * ne suffit pas sans ce secret.
 */
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { rateLimit, getIP, rateLimitResponse } from '@/lib/rate-limit'
import type { NextRequest } from 'next/server'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

/**
 * Vérifie qu'une requête provient d'un admin authentifié.
 *
 * @returns L'objet `user` Supabase si autorisé, sinon une `NextResponse` d'erreur.
 *
 * Usage :
 * ```ts
 * const result = await requireAdmin(request)
 * if (result instanceof NextResponse) return result
 * // result est l'utilisateur admin
 * ```
 */
export async function requireAdmin(
  request: Request | NextRequest
): Promise<{ id: string; email?: string } | NextResponse> {
  // 1. Rate limiting : 30 requêtes / minute par IP sur les routes admin
  const ip = getIP(request as NextRequest)
  const limit = await rateLimit(`admin:${ip}`, { max: 30, windowMs: 60_000 })
  if (!limit.success) return rateLimitResponse(limit.resetAt)

  // 2. Session Supabase
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  // 3. Secret admin (requis en production si ADMIN_SECRET est défini)
  const adminSecret = process.env.ADMIN_SECRET
  if (adminSecret && process.env.NODE_ENV === 'production') {
    const provided = (request as NextRequest).headers?.get('x-admin-secret')
    if (provided !== adminSecret) {
      return NextResponse.json({ error: 'Token admin invalide' }, { status: 403 })
    }
  }

  return user as { id: string; email?: string }
}
