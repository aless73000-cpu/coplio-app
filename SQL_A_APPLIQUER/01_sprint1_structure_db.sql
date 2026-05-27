-- ════════════════════════════════════════════════════════════════════
-- MIGRATION : Conformité législative — Sprint 1 / Structures DB
-- Loi du 10 juillet 1965 · Décret du 17 mars 1967 · Loi ALUR 2014
--
-- Changements :
--   1. coproprietaire_lots  — suivi historique des mutations de lots
--   2. ag_votes             — correction contrainte UNIQUE (Art. 22)
--   3. budget_lignes        — colonne cle_repartition (Décret 1967 art. 10)
--   4. pouvoirs             — nouvelle table mandats AG (Art. 22 al. 2)
--   5. v_lots_actifs        — vue des lots en détention active
-- ════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────
-- 1. MUTATIONS TEMPORELLES — coproprietaire_lots
--
-- Loi 1965 art. 14-3 : le syndic doit pouvoir reconstituer
-- qui possédait quoi à une date passée (charges, régularisation,
-- documents de synthèse envoyés lors de la vente).
--
-- Modèle : la PK (coproprietaire_id, lot_id) est conservée.
-- Une mutation crée une NOUVELLE ligne (ancien titulaire avec
-- date_fin + motif_fin, nouveau titulaire avec date_acquisition).
-- La détention active = WHERE date_fin IS NULL.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE coproprietaire_lots
  ADD COLUMN IF NOT EXISTS date_fin    DATE,
  ADD COLUMN IF NOT EXISTS motif_fin   TEXT
    CHECK (motif_fin IN ('vente', 'succession', 'donation', 'saisie', 'autre')),
  ADD COLUMN IF NOT EXISTS notes       TEXT;

-- Contrainte : date_fin doit être postérieure à date_acquisition
ALTER TABLE coproprietaire_lots
  DROP CONSTRAINT IF EXISTS ck_mutation_dates;
ALTER TABLE coproprietaire_lots
  ADD CONSTRAINT ck_mutation_dates
    CHECK (date_fin IS NULL OR date_acquisition IS NULL OR date_fin >= date_acquisition);

-- motif_fin ne peut être renseigné que si date_fin est aussi renseigné
ALTER TABLE coproprietaire_lots
  DROP CONSTRAINT IF EXISTS ck_motif_requires_date_fin;
ALTER TABLE coproprietaire_lots
  ADD CONSTRAINT ck_motif_requires_date_fin
    CHECK (motif_fin IS NULL OR date_fin IS NOT NULL);

-- Index pour les requêtes de prorata (Sprint 3)
CREATE INDEX IF NOT EXISTS idx_cl_date_fin
  ON coproprietaire_lots (date_fin)
  WHERE date_fin IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cl_lot_active
  ON coproprietaire_lots (lot_id)
  WHERE date_fin IS NULL;

CREATE INDEX IF NOT EXISTS idx_cl_copro_active
  ON coproprietaire_lots (coproprietaire_id)
  WHERE date_fin IS NULL;


-- ─────────────────────────────────────────────────────────────────
-- 2. AG_VOTES — Correction de la contrainte UNIQUE
--
-- Art. 22 Loi 1965 : « Chaque copropriétaire dispose d'autant de
-- voix que de tantièmes. » Un copropriétaire = UN SEUL vote par
-- résolution, quelle que soit son nombre de lots.
--
-- AVANT : UNIQUE(resolution_id, lot_id)
--   → un multi-lots pouvait voter N fois (N = nombre de lots)
-- APRÈS  : UNIQUE(resolution_id, coproprietaire_id)
--   → une voix par copropriétaire, tantiemes = somme de ses lots
--
-- lot_id est conservé (nullable) pour traçabilité/audit uniquement.
-- ─────────────────────────────────────────────────────────────────

-- Supprimer l'ancienne contrainte erronée
ALTER TABLE ag_votes
  DROP CONSTRAINT IF EXISTS "ag_votes_resolution_id_lot_id_key";

-- lot_id n'est plus la dimension déterminante du vote — nullable
ALTER TABLE ag_votes
  ALTER COLUMN lot_id DROP NOT NULL;

-- Nouvelle contrainte conforme Art. 22
ALTER TABLE ag_votes
  ADD CONSTRAINT ag_votes_resolution_coproprietaire_uniq
    UNIQUE (resolution_id, coproprietaire_id);

-- Index d'appui pour le moteur de majorité (Sprint 2)
CREATE INDEX IF NOT EXISTS idx_ag_votes_resolution
  ON ag_votes (resolution_id);

CREATE INDEX IF NOT EXISTS idx_ag_votes_coproprietaire
  ON ag_votes (coproprietaire_id);

-- ── Mise à jour RLS ag_votes ──────────────────────────────────────
-- La policy "votes_insert_own" de schema.sql vérifiait
-- p.lot_id = ag_votes.lot_id — cassé depuis que lot_id est nullable.
-- Remplacement par une vérification via coproprietaire_id.

DROP POLICY IF EXISTS "votes_insert_own"  ON ag_votes;
DROP POLICY IF EXISTS "votes_select_cabinet" ON ag_votes;
DROP POLICY IF EXISTS "ag_votes_write"    ON ag_votes;

-- Politique unifiée (lecture + écriture)
CREATE POLICY "ag_votes_all" ON ag_votes
  FOR ALL USING (
    -- Gestionnaire syndic : accès via cabinet
    EXISTS (
      SELECT 1
      FROM ag_resolutions r
      JOIN assemblees_generales ag ON ag.id = r.ag_id
      JOIN coproprietes c          ON c.id  = ag.copropriete_id
      WHERE r.id = ag_votes.resolution_id
        AND c.cabinet_id = get_user_cabinet_id()
    )
    OR
    -- Copropriétaire : son coproprietaire_id correspond à son profil
    EXISTS (
      SELECT 1
      FROM coproprietaires cr
      JOIN coproprietaire_lots cl ON cl.coproprietaire_id = cr.id
      JOIN profiles p             ON p.lot_id = cl.lot_id
      WHERE cr.id  = ag_votes.coproprietaire_id
        AND p.id   = auth.uid()
        AND p.role = 'owner_resident'
        AND cl.date_fin IS NULL  -- détention active uniquement
    )
  );


-- ─────────────────────────────────────────────────────────────────
-- 3. CLE DE REPARTITION — budget_lignes
--
-- Décret du 17 mars 1967, art. 10 : chaque charge doit être
-- répartie selon la clé définie dans le règlement de copropriété.
-- Sans ce champ il est impossible de ventiler légalement les
-- charges par lot en fin d'exercice (Sprint 3).
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE budget_lignes
  ADD COLUMN IF NOT EXISTS cle_repartition TEXT
    NOT NULL DEFAULT 'tantiemes_generaux'
    CHECK (cle_repartition IN (
      'tantiemes_generaux',   -- charges communes générales (Art. 10 al. 1)
      'tantiemes_speciaux',   -- charges communes spéciales (Art. 10 al. 2)
      'tantièmes_ascenseur',  -- ex: parties communes ascenseur
      'tantièmes_parkings',   -- lots de type parking uniquement
      'tantièmes_caves',      -- lots de type cave uniquement
      'charges_eau',          -- répartition au compteur ou tantièmes eau
      'charges_chauffage',    -- chauffage collectif
      'autre_cle'             -- clé personnalisée (préciser dans commentaire)
    ));

-- Index pour les requêtes de calcul de répartition (Sprint 3)
CREATE INDEX IF NOT EXISTS idx_budget_lignes_cle
  ON budget_lignes (budget_id, cle_repartition);


-- ─────────────────────────────────────────────────────────────────
-- 4. TABLE POUVOIRS (mandats AG)
--
-- Art. 22 al. 2 Loi 1965 : « Tout copropriétaire peut déléguer
-- son droit de vote à un mandataire. Ce mandataire ne peut
-- détenir plus de 3 mandats. »
-- Exception : les 3 mandats peuvent être dépassés si les
-- tantièmes cumulés des mandants ne dépassent pas 10% des
-- tantièmes totaux de la copropriété.
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pouvoirs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Références
  ag_id           UUID        NOT NULL REFERENCES assemblees_generales(id) ON DELETE CASCADE,
  mandant_id      UUID        NOT NULL REFERENCES coproprietaires(id)      ON DELETE CASCADE,
  mandataire_id   UUID        NOT NULL REFERENCES coproprietaires(id)      ON DELETE CASCADE,

  -- Pièce justificative
  date_signature  DATE,
  document_id     UUID        REFERENCES documents(id) ON DELETE SET NULL,
  notes           TEXT,

  -- Audit
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by      UUID        REFERENCES profiles(id) ON DELETE SET NULL,

  -- Contraintes métier
  UNIQUE  (ag_id, mandant_id),            -- un mandant = un seul mandat par AG
  CHECK   (mandant_id != mandataire_id)   -- interdit de se mandater soi-même
);

-- Index pour la vérification rapide du plafond
CREATE INDEX IF NOT EXISTS idx_pouvoirs_ag_mandataire
  ON pouvoirs (ag_id, mandataire_id);

CREATE INDEX IF NOT EXISTS idx_pouvoirs_ag_mandant
  ON pouvoirs (ag_id, mandant_id);

-- RLS
ALTER TABLE pouvoirs ENABLE ROW LEVEL SECURITY;

-- Gestionnaire syndic : lecture/écriture sur ses AG
CREATE POLICY "pouvoirs_cabinet" ON pouvoirs
  FOR ALL USING (
    ag_id IN (
      SELECT ag.id
      FROM assemblees_generales ag
      JOIN coproprietes c ON c.id = ag.copropriete_id
      WHERE c.cabinet_id = get_user_cabinet_id()
    )
  );

-- Copropriétaire : peut voir son propre mandat
CREATE POLICY "pouvoirs_mandant_select" ON pouvoirs
  FOR SELECT USING (
    mandant_id IN (
      SELECT cr.id
      FROM coproprietaires cr
      JOIN coproprietaire_lots cl ON cl.coproprietaire_id = cr.id
      JOIN profiles p             ON p.lot_id = cl.lot_id
      WHERE p.id = auth.uid()
        AND cl.date_fin IS NULL
    )
  );

-- ── Trigger : vérification plafond 3 mandats (Art. 22 al. 2) ──────

CREATE OR REPLACE FUNCTION check_pouvoir_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_nb_mandats          INTEGER;
  v_tantiemes_mandants  INTEGER;
  v_tantiemes_totaux    INTEGER;
  v_copropriete_id      UUID;
BEGIN
  -- Récupérer la copropriété concernée
  SELECT ag.copropriete_id INTO v_copropriete_id
  FROM assemblees_generales ag
  WHERE ag.id = NEW.ag_id;

  -- Compter les mandats déjà détenus par ce mandataire pour cette AG
  SELECT COUNT(*) INTO v_nb_mandats
  FROM pouvoirs
  WHERE ag_id = NEW.ag_id
    AND mandataire_id = NEW.mandataire_id;

  -- Si plafond de 3 atteint : vérifier l'exception des 10% de tantièmes
  IF v_nb_mandats >= 3 THEN

    -- Tantièmes cumulés des mandants existants (lots actifs dans cette copropriété)
    SELECT COALESCE(SUM(l.tantiemes), 0) INTO v_tantiemes_mandants
    FROM pouvoirs p
    JOIN coproprietaire_lots cl ON cl.coproprietaire_id = p.mandant_id
    JOIN lots l                 ON l.id = cl.lot_id
    WHERE p.ag_id           = NEW.ag_id
      AND p.mandataire_id   = NEW.mandataire_id
      AND l.copropriete_id  = v_copropriete_id
      AND cl.date_fin       IS NULL;

    -- Ajouter les tantièmes du nouveau mandant
    v_tantiemes_mandants := v_tantiemes_mandants + COALESCE((
      SELECT SUM(l.tantiemes)
      FROM coproprietaire_lots cl
      JOIN lots l ON l.id = cl.lot_id
      WHERE cl.coproprietaire_id = NEW.mandant_id
        AND l.copropriete_id     = v_copropriete_id
        AND cl.date_fin          IS NULL
    ), 0);

    -- Tantièmes totaux de la copropriété
    SELECT c."tantièmes_totaux" INTO v_tantiemes_totaux
    FROM coproprietes c
    WHERE c.id = v_copropriete_id;

    -- Refuser si les tantièmes cumulés des mandants dépassent 10%
    IF v_tantiemes_mandants > (v_tantiemes_totaux * 0.10) THEN
      RAISE EXCEPTION
        'Art. 22 al. 2 non respecté : le mandataire détient déjà % mandats '
        'et les tantièmes cumulés (%) dépassent 10%% des tantièmes totaux (%).',
        v_nb_mandats, v_tantiemes_mandants, v_tantiemes_totaux;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_pouvoir_limit
  BEFORE INSERT ON pouvoirs
  FOR EACH ROW EXECUTE FUNCTION check_pouvoir_limit();


-- ─────────────────────────────────────────────────────────────────
-- 5. VUE v_lots_actifs
--
-- Vue utilitaire : lots en détention active (date_fin IS NULL).
-- Utilisée par le moteur de vote (Sprint 2) pour calculer les
-- tantièmes d'un copropriétaire, et par le moteur de régularisation
-- (Sprint 3) pour le prorata temporis.
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_lots_actifs AS
SELECT
  cl.coproprietaire_id,
  cl.lot_id,
  cl.date_acquisition,
  l.tantiemes,
  l.numero          AS lot_numero,
  l.type            AS lot_type,
  l.copropriete_id,
  l.surface
FROM coproprietaire_lots cl
JOIN lots l ON l.id = cl.lot_id
WHERE cl.date_fin IS NULL;

COMMENT ON VIEW v_lots_actifs IS
  'Lots en détention active (date_fin IS NULL). '
  'Source de vérité pour le calcul des tantièmes et des charges.';


-- ─────────────────────────────────────────────────────────────────
-- FIN MIGRATION
-- ─────────────────────────────────────────────────────────────────
