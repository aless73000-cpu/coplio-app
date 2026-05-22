// ═══════════════════════════════════════════════════════════════
// COPLIO — Route d'application des migrations SQL
//
// Protégée par CRON_SECRET.
// À appeler UNE SEULE FOIS depuis l'interface admin (Paramètres).
// Utilise le DATABASE_URL (connection string Supabase).
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withErrorHandler } from '@/lib/api-handler'

export const runtime = 'nodejs'

// Liste des migrations à appliquer dans l'ordre
// Toutes idempotentes (IF NOT EXISTS / IF EXISTS)
const MIGRATIONS = [
  {
    id: 'prestataires',
    description: 'Table prestataires (annuaire cabinet)',
    sql: `
      CREATE TABLE IF NOT EXISTS prestataires (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
        nom VARCHAR(255) NOT NULL,
        metier VARCHAR(100),
        telephone VARCHAR(30),
        email VARCHAR(255),
        adresse TEXT,
        siret VARCHAR(20),
        note INTEGER CHECK (note BETWEEN 1 AND 5),
        commentaire TEXT,
        actif BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_prestataires_cabinet ON prestataires(cabinet_id);
      ALTER TABLE prestataires ENABLE ROW LEVEL SECURITY;
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'prestataires' AND policyname = 'Cabinet members can manage prestataires'
        ) THEN
          CREATE POLICY "Cabinet members can manage prestataires"
            ON prestataires FOR ALL
            USING (cabinet_id IN (SELECT cabinet_id FROM profiles WHERE id = auth.uid()));
        END IF;
      END $$;
      -- Ajouter les colonnes manquantes si table créée avec l'ancien schéma
      ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS metier VARCHAR(100);
      ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS note INTEGER CHECK (note BETWEEN 1 AND 5);
      ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS commentaire TEXT;
      ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS actif BOOLEAN DEFAULT TRUE;
      ALTER TABLE prestataires ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `,
  },
  {
    id: 'carnet_entretien',
    description: 'Table carnet_entretien (interventions par copropriété)',
    sql: `
      CREATE TABLE IF NOT EXISTS carnet_entretien (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        copropriete_id UUID NOT NULL REFERENCES coproprietes(id) ON DELETE CASCADE,
        cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
        prestataire_id UUID REFERENCES prestataires(id) ON DELETE SET NULL,
        titre VARCHAR(255) NOT NULL,
        description TEXT,
        categorie VARCHAR(50) DEFAULT 'entretien' CHECK (
          categorie IN ('entretien','reparation','controle','renovation','urgence','autre')
        ),
        statut VARCHAR(30) DEFAULT 'planifie' CHECK (
          statut IN ('planifie','en_cours','realise','annule')
        ),
        date_intervention DATE,
        date_realisation DATE,
        cout_prevu NUMERIC(12,2),
        cout_reel NUMERIC(12,2),
        document_url TEXT,
        periodicite VARCHAR(30) CHECK (
          periodicite IN ('unique','mensuel','trimestriel','semestriel','annuel','pluriannuel')
        ),
        prochaine_echeance DATE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_carnet_copropriete ON carnet_entretien(copropriete_id);
      CREATE INDEX IF NOT EXISTS idx_carnet_cabinet ON carnet_entretien(cabinet_id);
      ALTER TABLE carnet_entretien ENABLE ROW LEVEL SECURITY;
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'carnet_entretien' AND policyname = 'Cabinet members can manage carnet'
        ) THEN
          CREATE POLICY "Cabinet members can manage carnet"
            ON carnet_entretien FOR ALL
            USING (cabinet_id IN (SELECT cabinet_id FROM profiles WHERE id = auth.uid()));
        END IF;
      END $$;
    `,
  },
  {
    id: 'coproprietaire_notes',
    description: 'Colonne notes_internes sur coproprietaires',
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

export const POST = withErrorHandler(async (request: Request) => {
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
})

// GET pour vérifier l'état (sans token — info publique minimale)
export const GET = withErrorHandler(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const hasDb = !!process.env.DATABASE_URL

  return NextResponse.json({
    ready: hasDb,
    migrations: MIGRATIONS.map((m) => ({ id: m.id, description: m.description })),
    instructions: hasDb ? null : 'DATABASE_URL manquant — voir /api/admin/migrate (POST) pour les instructions',
  })
})
