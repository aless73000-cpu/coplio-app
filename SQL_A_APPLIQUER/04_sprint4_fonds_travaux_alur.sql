-- ════════════════════════════════════════════════════════════════════
-- MIGRATION : Conformité législative — Sprint 4 / Fonds de travaux ALUR
-- Loi ALUR 2014, art. 14-2 (fonds de travaux par lot, non remboursable)
--
-- Changements :
--   1. fonds_travaux   : ajout lot_id (ventilation par lot ALUR)
--   2. Contrainte UNIQUE : (lot_id, annee) au lieu de (copropriete_id, annee)
--   3. Type de mouvement : ajout 'transfert_mutation'
--   4. Vue v_fonds_travaux_par_lot : suivi par lot avec propriétaire actif
--
-- IMPORTANT — Migration des données existantes :
--   Les enregistrements existants (copropriete_id, annee) sans lot_id
--   sont conservés en l'état (lot_id NULL).
--   La distribution par lot est faite MANUELLEMENT selon les tantièmes
--   (script de migration des données dans le dossier SQL_A_APPLIQUER).
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. Ajouter lot_id sur fonds_travaux ─────────────────────────
ALTER TABLE fonds_travaux
  ADD COLUMN IF NOT EXISTS lot_id UUID REFERENCES lots(id) ON DELETE CASCADE;

-- ─── 2. Contrainte UNIQUE par lot ────────────────────────────────
-- On crée une contrainte UNIQUE partielle sur (lot_id, annee)
-- pour les nouveaux enregistrements avec lot_id renseigné.
-- Les anciens enregistrements (lot_id IS NULL) conservent leur contrainte.

CREATE UNIQUE INDEX IF NOT EXISTS fonds_travaux_lot_annee_uniq
  ON fonds_travaux (lot_id, annee)
  WHERE lot_id IS NOT NULL;

-- Index pour les queries par lot
CREATE INDEX IF NOT EXISTS idx_fonds_travaux_lot_id
  ON fonds_travaux (lot_id)
  WHERE lot_id IS NOT NULL;

-- ─── 3. Ajouter 'transfert_mutation' au CHECK du type de mouvement ─
-- Le trigger de cession crée un mouvement de traçabilité lors d'une vente.
-- Note : modifier le CHECK constraint nécessite de recréer la contrainte.

ALTER TABLE fonds_travaux_mouvements
  DROP CONSTRAINT IF EXISTS fonds_travaux_mouvements_type_mouvement_check;

ALTER TABLE fonds_travaux_mouvements
  ADD CONSTRAINT fonds_travaux_mouvements_type_mouvement_check
    CHECK (type_mouvement IN ('cotisation', 'retrait', 'interet', 'transfert_mutation', 'autre'));

-- ─── 4. Colonne transfert lors d'une mutation ─────────────────────
-- Permet de tracer explicitement le transfert fonds de travaux vendeur → acheteur
ALTER TABLE fonds_travaux
  ADD COLUMN IF NOT EXISTS vendeur_historique JSONB DEFAULT '[]';
  -- Tableau des anciens propriétaires avec leurs périodes de cotisation
  -- [{ "coproprietaire_id": "...", "date_debut": "...", "date_fin": "..." }]

-- ─── 5. VUE v_fonds_travaux_par_lot ──────────────────────────────
-- Affiche les fonds de travaux par lot avec le propriétaire actuel
-- et le solde total accumulé

CREATE OR REPLACE VIEW v_fonds_travaux_par_lot AS
SELECT
  ft.id,
  ft.lot_id,
  ft.copropriete_id,
  ft.annee,
  ft.cotisation_annuelle,
  ft.solde_actuel,
  ft.objectif_5ans,
  ft.compte_bancaire,
  -- Propriétaire actuel du lot (via v_lots_actifs)
  vla.coproprietaire_id,
  cr.prenom           AS coproprietaire_prenom,
  cr.nom              AS coproprietaire_nom,
  -- Informations lot
  l.numero            AS lot_numero,
  l.type              AS lot_type,
  l.tantiemes,
  ft.created_at,
  ft.updated_at
FROM fonds_travaux ft
LEFT JOIN lots l                  ON l.id = ft.lot_id
LEFT JOIN v_lots_actifs vla       ON vla.lot_id = ft.lot_id
LEFT JOIN coproprietaires cr      ON cr.id = vla.coproprietaire_id;

COMMENT ON VIEW v_fonds_travaux_par_lot IS
  'Fonds de travaux par lot (ALUR art. 14-2) avec propriétaire actuel. '
  'Les lots sans lot_id correspondent aux anciens enregistrements '
  'copropriete-level (à migrer).';

-- ─── 6. RLS mise à jour fonds_travaux ────────────────────────────
-- Mise à jour de la policy existante pour inclure l'accès par lot
DROP POLICY IF EXISTS "fonds_travaux_cabinet" ON fonds_travaux;

CREATE POLICY "fonds_travaux_cabinet" ON fonds_travaux
  FOR ALL USING (
    -- Accès via copropriete (gestionnaire syndic)
    copropriete_id IN (
      SELECT c.id FROM coproprietes c
      WHERE c.cabinet_id = get_user_cabinet_id()
    )
    OR
    -- Accès via lot_id (copropriétaire de son lot)
    lot_id IN (
      SELECT cl.lot_id FROM coproprietaire_lots cl
      JOIN profiles p ON p.lot_id = cl.lot_id
      WHERE p.id = auth.uid()
        AND cl.date_fin IS NULL
    )
  );
