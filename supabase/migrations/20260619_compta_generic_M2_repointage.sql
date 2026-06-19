-- ════════════════════════════════════════════════════════════════════
-- MIGRATION : Comptabilité générique — M2 / Repointage des 6 tables
-- Ajoute `entite_comptable_id` (nullable) à côté de `copropriete_id` sur
-- toutes les tables comptables ancrées, puis backfille depuis la copro.
--
-- ⚠️ ADDITIF & RÉVERSIBLE : `copropriete_id` est CONSERVÉ. Le code
--    existant continue de tourner. La bascule du code se fait ensuite,
--    table par table. Le passage NOT NULL / drop a lieu en M5 (cutover).
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. Ajout des colonnes (nullable) ────────────────────────────────
ALTER TABLE journaux
  ADD COLUMN IF NOT EXISTS entite_comptable_id UUID REFERENCES entites_comptables(id) ON DELETE CASCADE;
ALTER TABLE ecritures_comptables
  ADD COLUMN IF NOT EXISTS entite_comptable_id UUID REFERENCES entites_comptables(id) ON DELETE CASCADE;
ALTER TABLE exercices
  ADD COLUMN IF NOT EXISTS entite_comptable_id UUID REFERENCES entites_comptables(id) ON DELETE CASCADE;
ALTER TABLE factures
  ADD COLUMN IF NOT EXISTS entite_comptable_id UUID REFERENCES entites_comptables(id) ON DELETE CASCADE;
ALTER TABLE comptes_bancaires
  ADD COLUMN IF NOT EXISTS entite_comptable_id UUID REFERENCES entites_comptables(id) ON DELETE CASCADE;
ALTER TABLE releves_bancaires
  ADD COLUMN IF NOT EXISTS entite_comptable_id UUID REFERENCES entites_comptables(id) ON DELETE CASCADE;


-- ─── 2. Backfill depuis copropriete_id → coproprietes.entite_comptable_id
UPDATE journaux t            SET entite_comptable_id = c.entite_comptable_id
  FROM coproprietes c WHERE c.id = t.copropriete_id AND t.entite_comptable_id IS NULL;
UPDATE ecritures_comptables t SET entite_comptable_id = c.entite_comptable_id
  FROM coproprietes c WHERE c.id = t.copropriete_id AND t.entite_comptable_id IS NULL;
UPDATE exercices t           SET entite_comptable_id = c.entite_comptable_id
  FROM coproprietes c WHERE c.id = t.copropriete_id AND t.entite_comptable_id IS NULL;
UPDATE factures t            SET entite_comptable_id = c.entite_comptable_id
  FROM coproprietes c WHERE c.id = t.copropriete_id AND t.entite_comptable_id IS NULL;
UPDATE comptes_bancaires t   SET entite_comptable_id = c.entite_comptable_id
  FROM coproprietes c WHERE c.id = t.copropriete_id AND t.entite_comptable_id IS NULL;
UPDATE releves_bancaires t   SET entite_comptable_id = c.entite_comptable_id
  FROM coproprietes c WHERE c.id = t.copropriete_id AND t.entite_comptable_id IS NULL;


-- ─── 3. Index miroirs ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_journaux_entite            ON journaux (entite_comptable_id);
CREATE INDEX IF NOT EXISTS idx_ecritures_entite           ON ecritures_comptables (entite_comptable_id, date_ecriture DESC);
CREATE INDEX IF NOT EXISTS idx_exercices_entite           ON exercices (entite_comptable_id, annee);
CREATE INDEX IF NOT EXISTS idx_factures_entite            ON factures (entite_comptable_id);
CREATE INDEX IF NOT EXISTS idx_comptes_bancaires_entite   ON comptes_bancaires (entite_comptable_id);
CREATE INDEX IF NOT EXISTS idx_releves_bancaires_entite   ON releves_bancaires (entite_comptable_id);


-- ─── 4. Contrôle d'invariance ────────────────────────────────────────
-- Toute ligne avec copropriete_id renseigné doit avoir reçu une entité.
DO $$
DECLARE
  t  TEXT;
  n  INTEGER;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'journaux','ecritures_comptables','exercices',
    'factures','comptes_bancaires','releves_bancaires'
  ] LOOP
    EXECUTE format(
      'SELECT COUNT(*) FROM %I WHERE copropriete_id IS NOT NULL AND entite_comptable_id IS NULL', t
    ) INTO n;
    IF n > 0 THEN
      RAISE EXCEPTION 'M2 backfill incomplet sur % : % ligne(s) sans entite_comptable_id.', t, n;
    END IF;
  END LOOP;
END $$;
