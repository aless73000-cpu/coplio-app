-- ════════════════════════════════════════════════════════════════════
-- MIGRATION : Conformité législative — Sprint 2 / Moteur de vote AG
-- Loi du 10 juillet 1965 — Art. 24, 25, 25-1, 26
--
-- Changements :
--   1. ag_resolutions : colonne vote_raison pour l'explication du résultat
--   2. ag_resolutions : colonne passerelle_25_1 flag
--   3. assemblees_generales : tantiemes_presents NOT NULL avec default 0 (déjà présent)
--   4. Contrainte : adoptee ne peut être calculé que si l'AG est terminée
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. Colonnes supplémentaires sur ag_resolutions ───────────────
-- Pour stocker le résultat détaillé du MajorityEngine

ALTER TABLE ag_resolutions
  ADD COLUMN IF NOT EXISTS vote_raison TEXT,
    -- Explication textuelle du résultat (ex: "Art. 25 non adopté — passerelle 25-1 déclenchée")

  ADD COLUMN IF NOT EXISTS passerelle_25_1 BOOLEAN DEFAULT FALSE;
    -- TRUE si la résolution doit être resoumise en Art. 24 (Art. 25-1)

-- ─── 2. S'assurer que tantiemes_presents est initialisé ───────────
-- Évite les calculs sur NULL
UPDATE assemblees_generales SET tantiemes_presents = 0
  WHERE tantiemes_presents IS NULL;

ALTER TABLE assemblees_generales
  ALTER COLUMN tantiemes_presents SET DEFAULT 0;

-- ─── 3. Index pour les queries du moteur de majorité ──────────────
CREATE INDEX IF NOT EXISTS idx_ag_resolutions_ag_id
  ON ag_resolutions (ag_id);

CREATE INDEX IF NOT EXISTS idx_ag_resolutions_adoptee
  ON ag_resolutions (ag_id, adoptee)
  WHERE adoptee IS NOT NULL;

-- ─── 4. Vue résumé des résultats d'AG ─────────────────────────────
-- Utile pour le tableau de bord et les exports PV
CREATE OR REPLACE VIEW v_resultats_ag AS
SELECT
  r.id                AS resolution_id,
  r.ag_id,
  r.ordre,
  r.titre,
  r.type_vote,
  r.voix_pour,
  r.voix_contre,
  r.voix_abstention,
  r.tantiemes_pour,
  r.tantiemes_contre,
  r.adoptee,
  r.passerelle_25_1,
  r.vote_raison,
  ag.tantiemes_presents,
  ag.date_ag,
  ag.status         AS ag_status,
  c.id              AS copropriete_id,
  c.nom             AS copropriete_nom,
  c.tantiemes_totaux
FROM ag_resolutions r
JOIN assemblees_generales ag ON ag.id = r.ag_id
JOIN coproprietes c           ON c.id = ag.copropriete_id;

COMMENT ON VIEW v_resultats_ag IS
  'Vue consolidée des résultats de vote par résolution, '
  'incluant les données nécessaires à la vérification légale (Art. 24/25/26).';
