-- ════════════════════════════════════════════════════════════════════
-- MIGRATION : Comptabilité générique — M1 / Entité comptable
-- Introduit `entites_comptables` : le « porteur » d'un jeu de livres.
-- Une copropriété (syndic) OU un mandat de gestion (gérance) en possède une.
--
-- ⚠️ ADDITIF & RÉVERSIBLE : aucune colonne existante n'est modifiée ni lue.
--    Rien dans le code applicatif ne dépend encore de cette table.
--    Rollback = DROP des objets créés ici.
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. TABLE entites_comptables ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS entites_comptables (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id   UUID        NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  type_entite  TEXT        NOT NULL
    CHECK (type_entite IN ('copropriete', 'mandat_gestion')),
  libelle      TEXT        NOT NULL,
  actif        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE entites_comptables ENABLE ROW LEVEL SECURITY;

-- RLS dès la création : isolation par cabinet (sinon fuite inter-cabinets).
CREATE POLICY "entites_comptables_cabinet" ON entites_comptables
  FOR ALL USING (cabinet_id = get_user_cabinet_id());

CREATE INDEX IF NOT EXISTS idx_entites_comptables_cabinet
  ON entites_comptables (cabinet_id);
CREATE INDEX IF NOT EXISTS idx_entites_comptables_type
  ON entites_comptables (type_entite);


-- ─── 2. Lien copropriété → son entité comptable ──────────────────────
ALTER TABLE coproprietes
  ADD COLUMN IF NOT EXISTS entite_comptable_id UUID
    REFERENCES entites_comptables(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_coproprietes_entite_comptable
  ON coproprietes (entite_comptable_id)
  WHERE entite_comptable_id IS NOT NULL;


-- ─── 3. Backfill : 1 entité comptable par copropriété existante ──────
-- Boucle déterministe (N copros = petit volume), idempotente.
DO $$
DECLARE
  r      RECORD;
  v_eid  UUID;
BEGIN
  FOR r IN
    SELECT id, cabinet_id, nom
    FROM coproprietes
    WHERE entite_comptable_id IS NULL
  LOOP
    INSERT INTO entites_comptables (cabinet_id, type_entite, libelle)
    VALUES (r.cabinet_id, 'copropriete', r.nom)
    RETURNING id INTO v_eid;

    UPDATE coproprietes SET entite_comptable_id = v_eid WHERE id = r.id;
  END LOOP;
END $$;


-- ─── 4. Contrôle d'invariance ────────────────────────────────────────
-- Échoue la migration si une copro n'a pas reçu son entité.
DO $$
DECLARE v_orphelines INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_orphelines
  FROM coproprietes WHERE entite_comptable_id IS NULL;

  IF v_orphelines > 0 THEN
    RAISE EXCEPTION
      'M1 backfill incomplet : % copropriété(s) sans entité comptable.', v_orphelines;
  END IF;
END $$;

COMMENT ON TABLE entites_comptables IS
  'Porteur générique d''un jeu de livres comptables (copropriété ou mandat de gestion).';
