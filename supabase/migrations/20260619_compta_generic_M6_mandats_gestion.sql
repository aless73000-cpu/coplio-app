-- ════════════════════════════════════════════════════════════════════
-- MIGRATION : Comptabilité générique — M6 / Mandats de gestion (gérance)
-- Crée le porteur métier de la gérance locative. Chaque mandat possède une
-- entité comptable `type_entite='mandat_gestion'` (créée automatiquement),
-- branchée sur le MÊME moteur d'écritures que le syndic.
--
-- ⚠️ ADDITIF & SÛR : nouvelle table isolée, ne touche à rien d'existant.
--    Indépendant de M5 (ne référence pas copropriete_id).
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mandats_gestion (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id              UUID        NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  entite_comptable_id     UUID        REFERENCES entites_comptables(id) ON DELETE SET NULL,

  -- Parties au mandat
  proprietaire_profile_id UUID        REFERENCES profiles(id) ON DELETE SET NULL,  -- bailleur
  lot_id                  UUID        REFERENCES lots(id) ON DELETE SET NULL,       -- bien géré

  reference               TEXT,
  date_debut              DATE        NOT NULL DEFAULT current_date,
  date_fin                DATE,

  -- Conditions financières
  taux_honoraires         NUMERIC(5,2)  NOT NULL DEFAULT 0,   -- % des loyers encaissés
  loyer_mensuel           NUMERIC(12,2),
  charges_mensuelles      NUMERIC(12,2),
  depot_garantie          NUMERIC(12,2),

  statut                  TEXT        NOT NULL DEFAULT 'actif'
    CHECK (statut IN ('actif', 'suspendu', 'resilie')),

  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE mandats_gestion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mandats_gestion_cabinet" ON mandats_gestion
  FOR ALL USING (cabinet_id = get_user_cabinet_id());

CREATE INDEX IF NOT EXISTS idx_mandats_gestion_cabinet  ON mandats_gestion (cabinet_id);
CREATE INDEX IF NOT EXISTS idx_mandats_gestion_lot      ON mandats_gestion (lot_id);
CREATE INDEX IF NOT EXISTS idx_mandats_gestion_entite   ON mandats_gestion (entite_comptable_id);

CREATE TRIGGER trigger_updated_at_mandats_gestion
  BEFORE UPDATE ON mandats_gestion
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ─── Création automatique de l'entité comptable du mandat ───────────
CREATE OR REPLACE FUNCTION create_entite_for_mandat()
RETURNS TRIGGER AS $$
DECLARE v_eid UUID;
BEGIN
  IF NEW.entite_comptable_id IS NULL THEN
    INSERT INTO entites_comptables (cabinet_id, type_entite, libelle)
    VALUES (
      NEW.cabinet_id,
      'mandat_gestion',
      COALESCE(NEW.reference, 'Mandat de gestion ' || left(NEW.id::text, 8))
    )
    RETURNING id INTO v_eid;
    NEW.entite_comptable_id := v_eid;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mandat_entite
  BEFORE INSERT ON mandats_gestion
  FOR EACH ROW EXECUTE FUNCTION create_entite_for_mandat();

COMMENT ON TABLE mandats_gestion IS
  'Mandat de gestion locative — porteur métier de la gérance, adossé à une entité comptable.';
