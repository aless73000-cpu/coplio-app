-- ════════════════════════════════════════════════════════════════════
-- MIGRATION : Comptabilité générique — M3 / Tiers polymorphe
-- Remplace le tiers figé (coproprietaire_id) des lignes d'écriture par un
-- couple générique (tiers_type, tiers_id) capable de référencer :
--   copropriétaire | locataire | propriétaire (bailleur) | fournisseur
-- Les cibles vivant dans des tables différentes (coproprietaires, profiles,
-- fournisseurs), pas de FK rigide : intégrité applicative.
--
-- ⚠️ ADDITIF & RÉVERSIBLE : `coproprietaire_id` et `lot_id` sont CONSERVÉS
--    (lot_id reste un axe analytique). Le drop éventuel a lieu en M5.
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE lignes_ecriture
  ADD COLUMN IF NOT EXISTS tiers_type TEXT
    CHECK (tiers_type IN ('coproprietaire', 'locataire', 'proprietaire', 'fournisseur')),
  ADD COLUMN IF NOT EXISTS tiers_id   UUID;


-- ─── Backfill : les tiers existants sont tous des copropriétaires ────
UPDATE lignes_ecriture
SET tiers_type = 'coproprietaire',
    tiers_id   = coproprietaire_id
WHERE coproprietaire_id IS NOT NULL
  AND tiers_id IS NULL;


CREATE INDEX IF NOT EXISTS idx_lignes_ecriture_tiers
  ON lignes_ecriture (tiers_type, tiers_id)
  WHERE tiers_id IS NOT NULL;


-- ─── Contrôle d'invariance ───────────────────────────────────────────
DO $$
DECLARE n INTEGER;
BEGIN
  SELECT COUNT(*) INTO n
  FROM lignes_ecriture
  WHERE coproprietaire_id IS NOT NULL AND tiers_id IS DISTINCT FROM coproprietaire_id;

  IF n > 0 THEN
    RAISE EXCEPTION 'M3 backfill tiers incohérent : % ligne(s).', n;
  END IF;
END $$;

COMMENT ON COLUMN lignes_ecriture.tiers_type IS
  'Type de tiers polymorphe : coproprietaire | locataire | proprietaire | fournisseur.';
