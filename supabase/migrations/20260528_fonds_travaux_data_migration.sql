-- ════════════════════════════════════════════════════════════════════
-- MIGRATION DONNÉES — Fonds de travaux → ventilation par lot (ALUR art. 14-2)
-- À appliquer APRÈS le Sprint 4 (20260527_compliance_sprint4.sql)
--
-- ⚠️  VÉRIFICATION REQUISE AVANT EXÉCUTION :
--   1. Faites un snapshot Supabase (Dashboard → Settings → Backups) avant.
--   2. Décommentez et exécutez le SELECT de prévisualisation (étape 0) d'abord.
--   3. Ce script ne doit être appliqué QUE si des fonds_travaux
--      avec lot_id IS NULL existent (cabinets créés avant Sprint 4).
--   4. Pour les nouvelles installations (base vide), ce script est no-op
--      (les ON CONFLICT DO NOTHING et WHERE protègent tout).
-- ════════════════════════════════════════════════════════════════════
-- SCRIPT DE MIGRATION DES DONNÉES — Fonds de travaux → ventilation par lot
-- À appliquer APRÈS le Sprint 4 (04_sprint4_fonds_travaux_alur.sql)
--
-- Contexte :
--   Avant Sprint 4, les fonds de travaux étaient gérés au niveau
--   de la copropriété (copropriete_id, annee) sans lot_id.
--   ALUR art. 14-2 exige une comptabilité par lot.
--
-- Ce script :
--   1. Pour chaque fonds_travaux sans lot_id, il crée autant de lignes
--      qu'il y a de lots dans la copropriété.
--   2. Le solde est réparti proportionnellement aux tantièmes de chaque lot.
--   3. Les anciennes lignes (lot_id NULL) sont conservées en archive
--      (elles ne seront plus utilisées dans les nouvelles vues).
--
-- ⚠️  VÉRIFIEZ LES DONNÉES AVANT D'EXÉCUTER ce script.
--     Faites un backup (ou un snapshot Supabase) avant.
--     Exécutez d'abord le SELECT de prévisualisation (étape 0).
-- ════════════════════════════════════════════════════════════════════

-- ─── ÉTAPE 0 : Prévisualisation (SELECT uniquement, sans modification) ────────
-- Exécutez cette partie en premier pour vérifier ce qui sera créé.

/*
SELECT
  ft.id                AS fonds_travaux_source_id,
  ft.copropriete_id,
  ft.annee,
  ft.solde_actuel      AS solde_total,
  l.id                 AS lot_id,
  l.numero             AS lot_numero,
  l.tantiemes,
  c.tantiemes_totaux_calcule,
  ROUND(
    (ft.solde_actuel * l.tantiemes::numeric / NULLIF(c.tantiemes_totaux_calcule, 0)),
    2
  )                    AS solde_prorata_lot
FROM fonds_travaux ft
JOIN (
  -- Calcul des tantièmes totaux réels par copropriété
  SELECT copropriete_id, SUM(tantiemes) AS tantiemes_totaux_calcule
  FROM lots
  GROUP BY copropriete_id
) c ON c.copropriete_id = ft.copropriete_id
JOIN lots l ON l.copropriete_id = ft.copropriete_id
WHERE ft.lot_id IS NULL
  AND ft.solde_actuel > 0
ORDER BY ft.copropriete_id, ft.annee, l.numero;
*/

-- ─── ÉTAPE 1 : Créer les lignes par lot ───────────────────────────────────────
-- Pour chaque fonds_travaux copropriete-level, insérer une ligne par lot
-- avec le solde au prorata des tantièmes.

INSERT INTO fonds_travaux (
  copropriete_id,
  lot_id,
  annee,
  cotisation_annuelle,
  solde_actuel,
  objectif_5ans,
  compte_bancaire,
  vendeur_historique,
  notes
)
SELECT
  ft.copropriete_id,
  l.id                              AS lot_id,
  ft.annee,
  -- Cotisation annuelle pro-ratisée
  ROUND(
    (COALESCE(ft.cotisation_annuelle, 0) * l.tantiemes::numeric
     / NULLIF(c.tantieimes_totaux, 0)),
    2
  )                                 AS cotisation_annuelle,
  -- Solde actuel pro-ratisé
  ROUND(
    (COALESCE(ft.solde_actuel, 0) * l.tantiemes::numeric
     / NULLIF(c.tantieimes_totaux, 0)),
    2
  )                                 AS solde_actuel,
  -- Objectif 5 ans pro-ratisé
  ROUND(
    (COALESCE(ft.objectif_5ans, 0) * l.tantiemes::numeric
     / NULLIF(c.tantieimes_totaux, 0)),
    2
  )                                 AS objectif_5ans,
  ft.compte_bancaire,
  '[]'::jsonb                       AS vendeur_historique,
  'Migré depuis fonds copropriété — lot_id null (ALUR migration 2026-05-27)'
                                    AS notes
FROM fonds_travaux ft
JOIN (
  SELECT copropriete_id, SUM(tantiemes) AS tantieimes_totaux
  FROM lots
  GROUP BY copropriete_id
) c ON c.copropriete_id = ft.copropriete_id
JOIN lots l ON l.copropriete_id = ft.copropriete_id
WHERE ft.lot_id IS NULL
ON CONFLICT (lot_id, annee) DO NOTHING; -- Ne pas écraser si déjà migré

-- ─── ÉTAPE 2 : Tracer un mouvement de migration pour chaque nouveau fonds ─────
-- Pour l'audit, créer un mouvement 'autre' expliquant l'origine du solde.

INSERT INTO fonds_travaux_mouvements (
  fonds_travaux_id,
  date_mouvement,
  type_mouvement,
  montant,
  libelle
)
SELECT
  new_ft.id,
  CURRENT_DATE,
  'autre',
  new_ft.solde_actuel,
  'Solde initial — migration ALUR art. 14-2 depuis comptabilité copropriété-niveau'
FROM fonds_travaux new_ft
WHERE new_ft.lot_id IS NOT NULL
  AND new_ft.notes LIKE 'Migré depuis fonds copropriété%'
ON CONFLICT DO NOTHING;

-- ─── ÉTAPE 3 : (Optionnel) Archiver les anciennes lignes copropriété-niveau ───
-- Vous pouvez marquer les anciennes lignes (lot_id IS NULL) avec une note
-- pour indiquer qu'elles ont été migrées. NE PAS les supprimer (audit trail).

UPDATE fonds_travaux
SET notes = COALESCE(notes || ' | ', '') || 'ARCHIVÉ — migré par lots (ALUR 2026-05-27)'
WHERE lot_id IS NULL
  AND solde_actuel > 0
  AND notes NOT LIKE '%ARCHIVÉ%';

-- ─── VÉRIFICATION FINALE ──────────────────────────────────────────────────────
-- Après exécution, vérifiez l'équilibre :

/*
-- Solde total avant migration (copropriété-niveau)
SELECT copropriete_id, annee, SUM(solde_actuel) AS solde_ancien
FROM fonds_travaux
WHERE lot_id IS NULL
GROUP BY copropriete_id, annee;

-- Solde total après migration (lot-niveau)
SELECT copropriete_id, annee, SUM(solde_actuel) AS solde_nouveau
FROM fonds_travaux
WHERE lot_id IS NOT NULL
GROUP BY copropriete_id, annee;

-- Écart (doit être 0 ou proche de 0 selon arrondis)
SELECT
  a.copropriete_id, a.annee,
  a.solde_ancien,
  b.solde_nouveau,
  a.solde_ancien - b.solde_nouveau AS ecart
FROM (
  SELECT copropriete_id, annee, SUM(solde_actuel) AS solde_ancien
  FROM fonds_travaux WHERE lot_id IS NULL GROUP BY copropriete_id, annee
) a
JOIN (
  SELECT copropriete_id, annee, SUM(solde_actuel) AS solde_nouveau
  FROM fonds_travaux WHERE lot_id IS NOT NULL GROUP BY copropriete_id, annee
) b ON b.copropriete_id = a.copropriete_id AND b.annee = a.annee;
*/
