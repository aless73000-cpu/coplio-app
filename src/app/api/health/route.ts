import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/health
 * Point de vérification de santé pour les services de monitoring (UptimeRobot, BetterStack, etc.)
 * - Retourne 200 si tout est OK
 * - Retourne 503 si la DB est inaccessible
 * Pas d'auth requise.
 */
export const runtime = 'nodejs'
// Ne pas mettre en cache ce endpoint
export const dynamic = 'force-dynamic'

export async function GET() {
  const started = Date.now()

  try {
    const supabase = createAdminClient()
    // Requête légère pour vérifier la connectivité DB
    const { error } = await supabase.from('cabinets').select('id').limit(1).maybeSingle()

    if (error) {
      return NextResponse.json(
        {
          status: 'degraded',
          db: 'error',
          message: error.message,
          latency_ms: Date.now() - started,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        status: 'ok',
        db: 'ok',
        latency_ms: Date.now() - started,
        timestamp: new Date().toISOString(),
        version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    )
  } catch (err) {
    return NextResponse.json(
      {
        status: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
        latency_ms: Date.now() - started,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
