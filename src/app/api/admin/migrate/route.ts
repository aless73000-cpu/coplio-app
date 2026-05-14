// ═══════════════════════════════════════════════════════════════
// COPLIO — Route d'application des migrations SQL
//
// Protégée par CRON_SECRET.
// À appeler UNE SEULE FOIS depuis l'interface admin (Paramètres).
// Utilise le DATABASE_URL (connection string Supabase).
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// Liste des migrations à appliquer dans l'ordre
const MIGRATIONS = [
  {
    id: 'coproprietaire_notes',
    description: 'Ajout colonne notes_internes sur coproprietaires',
    sql: `ALTER TABLE coproprietaires ADD COLUMN IF NOT EXISTS notes_internes TEXT;`,
  },
]

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'development') return true
    return false
  }
  return authHeader === `Bearer ${secret}`
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    return NextResponse.json({
      error: 'DATABASE_URL manquant',
      instructions: [
        '1. Va sur https://supabase.com/dashboard/project/_/settings/database',
        '2. Copie la "Connection string" (mode Transaction ou Session)',
        '3. Ajoute DATABASE_URL dans tes variables Vercel',
        '4. Redéploie puis rappelle cette route',
      ],
    }, { status: 503 })
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pool } = require('pg')
  const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })

  const results: { id: string; status: 'ok' | 'error'; message: string }[] = []

  for (const migration of MIGRATIONS) {
    try {
      await pool.query(migration.sql)
      results.push({ id: migration.id, status: 'ok', message: migration.description })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      results.push({ id: migration.id, status: 'error', message: msg })
    }
  }

  await pool.end()

  const hasError = results.some((r) => r.status === 'error')
  return NextResponse.json({ success: !hasError, results }, { status: hasError ? 207 : 200 })
}

// GET pour vérifier l'état (sans token — info publique minimale)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const hasDb = !!process.env.DATABASE_URL

  return NextResponse.json({
    ready: hasDb,
    migrations: MIGRATIONS.map((m) => ({ id: m.id, description: m.description })),
    instructions: hasDb ? null : 'DATABASE_URL manquant — voir /api/admin/migrate (POST) pour les instructions',
  })
}
