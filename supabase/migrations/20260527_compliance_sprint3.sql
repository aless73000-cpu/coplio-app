-- ════════════════════════════════════════════════════════════════════
-- MIGRATION : Conformité législative — Sprint 3 / Régularisation charges
-- Loi du 10 juillet 1965, art. 14-1 (régularisation annuelle)
-- Décret du 17 mars 1967, art. 10 (clés de répartition)
--
-- Changements :
--   1. Table exercices     — clôture d'exercice comptable
--   2. Table regularisations — résultats de régularisation par lot
--   3. Vue v_regularisations_soldes — pour le tableau de bord financier
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. TABLE exercices ───────────────────────────────────────────
-- Un exercice = une année comptable pour une copropriété.
-- La clôture déclenche le calcul des régularisations.

CREATE TABLE IF NOT EXISTS exercices (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  copropriete_id  UUID        NOT NULL REFERENCES coproprietes(id) ON DELETE CASCADE,
  annee           INTEGER     NOT NULL,
  date_debut      DATE        NOT NULL DEFAULT date_trunc('year', current_date)::date,
  date_fin        DATE        NOT NULL DEFAULT (date_trunc('year', current_date) + interval '364 days')::date,
  statut          TEXT        NOT NULL DEFAULT 'en_cours'
                              CHECK (statut IN ('en_cours', 'cloture')),
  date_cloture    DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (copropriete_id, annee),
  -- Contrainte : date_cloture n'a de sens que si statut = 'cloture'
  CHECK (statut = 'cloture' OR date_cloture IS NULL)
);

-- RLS
ALTER TABLE exercices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exercices_cabinet" ON exercices
  FOR ALL USING (
    copropriete_id IN (
      SELECT c.id FROM coproprietes c
      WHERE c.cabinet_id = get_user_cabinet_id()
    )
  );

-- Index
CREATE INDEX IF NOT EXISTS idx_exercices_copropriete_annee
  ON exercices (copropriete_id, annee);

-- ─── 2. TABLE regularisations ─────────────────────────────────────
-- Résultat de la régularisation annuelle par lot.
-- Calculé par l'API /exercices/[id]/cloture via le ChargesRégularisationEngine.
--
-- solde > 0 : trop-perçu (à rembourser au copropriétaire)
-- solde < 0 : complément dû par le copropriétaire

CREATE TABLE IF NOT EXISTS regularisations (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exercice_id           UUID        NOT NULL REFERENCES exercices(id) ON DELETE CASCADE,
  lot_id                UUID        NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  coproprietaire_id     UUID        REFERENCES coproprietaires(id) ON DELETE SET NULL,

  -- Montants
  montant_provisionnel  NUMERIC(12,2) NOT NULL DEFAULT 0,
    -- Ce qui a été appelé en provisions sur l'exercice
  montant_reel          NUMERIC(12,2) NOT NULL DEFAULT 0,
    -- Quote-part réelle des charges (après ventilation par clé)
  solde                 NUMERIC(12,2) GENERATED ALWAYS AS
                          (montant_provisionnel - montant_reel) STORED,

  -- Prorata (si mutation en cours d'exercice)
  prorata_jours         INTEGER,
  prorata_fraction      NUMERIC(6,4),

  -- Détail par poste de charge (JSON)
  detail_par_cle        JSONB DEFAULT '[]',

  -- Workflow
  statut                TEXT NOT NULL DEFAULT 'calcule'
                        CHECK (statut IN ('calcule', 'notifie', 'regle')),
  notifie_at            TIMESTAMPTZ,
  regle_at              TIMESTAMPTZ,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (exercice_id, lot_id)
);

-- RLS
ALTER TABLE regularisations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "regularisations_cabinet" ON regularisations
  FOR ALL USING (
    exercice_id IN (
      SELECT e.id FROM exercices e
      JOIN coproprietes c ON c.id = e.copropriete_id
      WHERE c.cabinet_id = get_user_cabinet_id()
    )
  );

CREATE POLICY "regularisations_coproprietaire" ON regularisations
  FOR SELECT USING (
    lot_id IN (
      SELECT cl.lot_id FROM coproprietaire_lots cl
      JOIN profiles p ON p.lot_id = cl.lot_id
      WHERE p.id = auth.uid()
        AND cl.date_fin IS NULL
    )
  );

-- Trigger updated_at
CREATE TRIGGER trigger_updated_at_regularisations
  BEFORE UPDATE ON regularisations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index
CREATE INDEX IF NOT EXISTS idx_regularisations_exercice
  ON regularisations (exercice_id);

CREATE INDEX IF NOT EXISTS idx_regularisations_lot
  ON regularisations (lot_id);

CREATE INDEX IF NOT EXISTS idx_regularisations_statut
  ON regularisations (statut)
  WHERE statut != 'regle';

-- ─── 3. VUE v_regularisations_soldes ─────────────────────────────
-- Tableau de bord : soldes de régularisation par lot et exercice

CREATE OR REPLACE VIEW v_regularisations_soldes AS
SELECT
  r.id,
  r.exercice_id,
  e.annee,
  e.copropriete_id,
  c.nom             AS copropriete_nom,
  r.lot_id,
  l.numero          AS lot_numero,
  r.coproprietaire_id,
  cr.prenom         AS coproprietaire_prenom,
  cr.nom            AS coproprietaire_nom,
  r.montant_provisionnel,
  r.montant_reel,
  r.solde,
  r.prorata_fraction,
  r.statut,
  -- Interprétation du solde
  CASE
    WHEN r.solde > 0  THEN 'trop_percu'   -- à rembourser
    WHEN r.solde < 0  THEN 'complement'   -- à réclamer
    ELSE              'equilibre'
  END AS type_solde
FROM regularisations r
JOIN exercices e         ON e.id = r.exercice_id
JOIN coproprietes c      ON c.id = e.copropriete_id
JOIN lots l              ON l.id = r.lot_id
LEFT JOIN coproprietaires cr ON cr.id = r.coproprietaire_id;

COMMENT ON VIEW v_regularisations_soldes IS
  'Soldes de régularisation par lot avec interprétation '
  '(trop_percu / complement / equilibre). '
  'Source pour les notifications aux copropriétaires.';
