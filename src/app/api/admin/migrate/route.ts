/**
 * POST /api/admin/migrate
 *
 * Exécute les migrations SQL en attente via la Supabase Management API.
 * Accessible uniquement aux emails admin (ADMIN_EMAILS) via session auth.
 *
 * Env vars requises :
 *   SUPABASE_MANAGEMENT_PAT  — Personal Access Token Supabase (sbp_...)
 *   NEXT_PUBLIC_SUPABASE_URL — pour extraire le project ref
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())

// Extrait le project ref depuis l'URL Supabase (https://<ref>.supabase.co)
function getProjectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const match = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)
  return match?.[1] ?? ''
}

async function runSql(projectRef: string, pat: string, sql: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pat}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    },
  )
  if (res.ok) return { ok: true }
  const body = await res.json().catch(() => ({}))
  return { ok: false, error: body?.message ?? `HTTP ${res.status}` }
}

export async function POST() {
  // Auth : session utilisateur + vérification email admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const pat = process.env.SUPABASE_MANAGEMENT_PAT ?? ''
  const projectRef = getProjectRef()

  if (!pat) {
    return NextResponse.json(
      { error: 'SUPABASE_MANAGEMENT_PAT manquant dans les variables d\'environnement Vercel.' },
      { status: 503 },
    )
  }
  if (!projectRef) {
    return NextResponse.json(
      { error: 'Impossible d\'extraire le project ref depuis NEXT_PUBLIC_SUPABASE_URL.' },
      { status: 503 },
    )
  }

  // Créer la table de suivi si elle n'existe pas
  await runSql(projectRef, pat, `
    CREATE TABLE IF NOT EXISTS _coplio_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT now()
    );
  `)

  // Récupérer les migrations déjà appliquées
  const appliedRes = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${pat}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'SELECT id FROM _coplio_migrations ORDER BY id' }),
    },
  )
  const appliedData = await appliedRes.json().catch(() => ({ rows: [] }))
  const appliedIds = new Set<string>((appliedData?.rows ?? []).map((r: { id: string }) => r.id))

  // Lire les fichiers de migration depuis le filesystem
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
  let files: string[] = []
  try {
    files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort()
  } catch {
    return NextResponse.json({ error: 'Dossier supabase/migrations introuvable.' }, { status: 500 })
  }

  const results: { id: string; status: 'ok' | 'skip' | 'error'; message: string }[] = []

  for (const file of files) {
    const id = file.replace('.sql', '')

    if (appliedIds.has(id)) {
      results.push({ id, status: 'skip', message: `${file} — déjà appliqué` })
      continue
    }

    const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
    const result = await runSql(projectRef, pat, sqlContent)

    if (result.ok) {
      // Marquer comme appliqué (id échappé)
      const safeId = id.replace(/'/g, "''")
      await runSql(projectRef, pat, `INSERT INTO _coplio_migrations (id) VALUES ('${safeId}') ON CONFLICT DO NOTHING;`)
      results.push({ id, status: 'ok', message: `${file} — ✓ appliqué` })
    } else {
      results.push({ id, status: 'error', message: `${file} — ✗ ${result.error}` })
    }
  }

  const hasError = results.some(r => r.status === 'error')
  return NextResponse.json({ success: !hasError, results })
}
