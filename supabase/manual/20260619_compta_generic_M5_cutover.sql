-- ════════════════════════════════════════════════════════════════════
-- ⛔⛔⛔  M5 / CUTOVER — IRRÉVERSIBLE — NE PAS APPLIER AUTOMATIQUEMENT  ⛔⛔⛔
--
-- Ce fichier est volontairement HORS de supabase/migrations/ pour ne pas
-- être joué par `supabase db push`. Il bascule définitivement la
-- comptabilité sur `entite_comptable_id` et SUPPRIME `copropriete_id`.
--
-- PRÉ-REQUIS AVANT EXÉCUTION :
--   1. M1→M4 appliquées et stables en prod depuis plusieurs jours.
--   2. TOUT le code applicatif lit/écrit `entite_comptable_id` et
--      `tiers_type/tiers_id` (plus aucune référence à copropriete_id ni
--      coproprietaire_id dans le contexte compta).
--   3. SNAPSHOT / backup complet de la base pris à l'instant T.
--
-- Exécution manuelle :  psql "$DATABASE_URL" -f supabase/manual/...M5_cutover.sql
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── 0. Garde-fou : refuser si des entités manquent ─────────────────
DO $$
DECLARE t TEXT; n INTEGER;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'journaux','ecritures_comptables','exercices',
    'factures','comptes_bancaires','releves_bancaires'
  ] LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE entite_comptable_id IS NULL', t) INTO n;
    IF n > 0 THEN
      RAISE EXCEPTION 'Cutover refusé : % ligne(s) sans entite_comptable_id dans %.', n, t;
    END IF;
  END LOOP;
END $$;


-- ─── 1. Recréer les vues sur entite_comptable_id ────────────────────
CREATE OR REPLACE VIEW v_grand_livre AS
SELECT
  le.id AS ligne_id, le.ecriture_id,
  e.entite_comptable_id,
  e.date_ecriture, e.numero_piece,
  e.libelle AS libelle_ecriture, le.libelle AS libelle_ligne,
  j.code AS journal_code, j.libelle AS journal_libelle,
  cc.numero AS compte_numero, cc.libelle AS compte_libelle, cc.classe,
  le.debit, le.credit, le.debit - le.credit AS mouvement_net,
  le.lettrage, e.statut, e.exercice_id, ex.annee AS exercice_annee
FROM lignes_ecriture le
JOIN ecritures_comptables e ON e.id = le.ecriture_id
JOIN journaux j             ON j.id = e.journal_id
JOIN comptes_comptables cc  ON cc.id = le.compte_id
LEFT JOIN exercices ex      ON ex.id = e.exercice_id
WHERE e.statut IN ('valide', 'cloture')
ORDER BY cc.numero, e.date_ecriture, le.ordre;

CREATE OR REPLACE VIEW v_balance_comptes AS
SELECT
  e.entite_comptable_id,
  e.exercice_id, ex.annee AS exercice_annee,
  cc.id AS compte_id, cc.numero AS compte_numero, cc.libelle AS compte_libelle,
  cc.classe, cc.sens_normal,
  COALESCE(SUM(le.debit),0) AS total_debit,
  COALESCE(SUM(le.credit),0) AS total_credit,
  COALESCE(SUM(le.debit),0) - COALESCE(SUM(le.credit),0) AS solde_debiteur,
  COALESCE(SUM(le.credit),0) - COALESCE(SUM(le.debit),0) AS solde_crediteur
FROM lignes_ecriture le
JOIN ecritures_comptables e ON e.id = le.ecriture_id
JOIN comptes_comptables cc  ON cc.id = le.compte_id
LEFT JOIN exercices ex      ON ex.id = e.exercice_id
WHERE e.statut IN ('valide', 'cloture')
GROUP BY e.entite_comptable_id, e.exercice_id, ex.annee,
         cc.id, cc.numero, cc.libelle, cc.classe, cc.sens_normal;

CREATE OR REPLACE VIEW v_rapprochement AS
SELECT
  lr.id, lr.releve_id, lr.date_operation, lr.date_valeur,
  lr.libelle, lr.reference, lr.montant, lr.statut_lettrage,
  lr.ecriture_id, lr.ordre,
  ec.date_ecriture, ec.libelle AS libelle_ecriture, ec.statut AS statut_ecriture,
  j.code AS journal_code,
  rb.compte_bancaire_id, rb.date_debut, rb.date_fin,
  rb.entite_comptable_id
FROM lignes_releve lr
JOIN releves_bancaires rb ON rb.id = lr.releve_id
LEFT JOIN ecritures_comptables ec ON ec.id = lr.ecriture_id
LEFT JOIN journaux j ON j.id = ec.journal_id;


-- ─── 2. Réécrire les RLS via entite_comptable → cabinet ─────────────
-- Parents
DROP POLICY IF EXISTS "journaux_cabinet" ON journaux;
CREATE POLICY "journaux_cabinet" ON journaux FOR ALL USING (
  entite_comptable_id IN (SELECT id FROM entites_comptables WHERE cabinet_id = get_user_cabinet_id()));

DROP POLICY IF EXISTS "ecritures_cabinet" ON ecritures_comptables;
CREATE POLICY "ecritures_cabinet" ON ecritures_comptables FOR ALL USING (
  entite_comptable_id IN (SELECT id FROM entites_comptables WHERE cabinet_id = get_user_cabinet_id()));

DROP POLICY IF EXISTS "exercices_cabinet" ON exercices;
CREATE POLICY "exercices_cabinet" ON exercices FOR ALL USING (
  entite_comptable_id IN (SELECT id FROM entites_comptables WHERE cabinet_id = get_user_cabinet_id()));

DROP POLICY IF EXISTS "factures_cabinet" ON factures;
CREATE POLICY "factures_cabinet" ON factures FOR ALL USING (
  entite_comptable_id IN (SELECT id FROM entites_comptables WHERE cabinet_id = get_user_cabinet_id()));

DROP POLICY IF EXISTS "comptes_bancaires_cabinet" ON comptes_bancaires;
CREATE POLICY "comptes_bancaires_cabinet" ON comptes_bancaires FOR ALL USING (
  entite_comptable_id IN (SELECT id FROM entites_comptables WHERE cabinet_id = get_user_cabinet_id()));

DROP POLICY IF EXISTS "releves_bancaires_cabinet" ON releves_bancaires;
CREATE POLICY "releves_bancaires_cabinet" ON releves_bancaires FOR ALL USING (
  entite_comptable_id IN (SELECT id FROM entites_comptables WHERE cabinet_id = get_user_cabinet_id()));

-- Enfants (via le parent)
DROP POLICY IF EXISTS "lignes_ecriture_cabinet" ON lignes_ecriture;
CREATE POLICY "lignes_ecriture_cabinet" ON lignes_ecriture FOR ALL USING (
  ecriture_id IN (
    SELECT e.id FROM ecritures_comptables e
    JOIN entites_comptables ent ON ent.id = e.entite_comptable_id
    WHERE ent.cabinet_id = get_user_cabinet_id()));

DROP POLICY IF EXISTS "lignes_facture_cabinet" ON lignes_facture;
CREATE POLICY "lignes_facture_cabinet" ON lignes_facture FOR ALL USING (
  facture_id IN (
    SELECT f.id FROM factures f
    JOIN entites_comptables ent ON ent.id = f.entite_comptable_id
    WHERE ent.cabinet_id = get_user_cabinet_id()));

DROP POLICY IF EXISTS "paiements_facture_cabinet" ON paiements_facture;
CREATE POLICY "paiements_facture_cabinet" ON paiements_facture FOR ALL USING (
  facture_id IN (
    SELECT f.id FROM factures f
    JOIN entites_comptables ent ON ent.id = f.entite_comptable_id
    WHERE ent.cabinet_id = get_user_cabinet_id()));

DROP POLICY IF EXISTS "lignes_releve_cabinet" ON lignes_releve;
CREATE POLICY "lignes_releve_cabinet" ON lignes_releve FOR ALL USING (
  releve_id IN (
    SELECT r.id FROM releves_bancaires r
    JOIN entites_comptables ent ON ent.id = r.entite_comptable_id
    WHERE ent.cabinet_id = get_user_cabinet_id()));


-- ─── 3. Contraintes : NOT NULL + unicité sur la nouvelle clé ────────
ALTER TABLE journaux            ALTER COLUMN entite_comptable_id SET NOT NULL;
ALTER TABLE ecritures_comptables ALTER COLUMN entite_comptable_id SET NOT NULL;
ALTER TABLE exercices           ALTER COLUMN entite_comptable_id SET NOT NULL;
ALTER TABLE factures            ALTER COLUMN entite_comptable_id SET NOT NULL;
ALTER TABLE comptes_bancaires   ALTER COLUMN entite_comptable_id SET NOT NULL;
ALTER TABLE releves_bancaires   ALTER COLUMN entite_comptable_id SET NOT NULL;

ALTER TABLE journaux  DROP CONSTRAINT IF EXISTS journaux_copropriete_id_code_key;
ALTER TABLE journaux  ADD  CONSTRAINT journaux_entite_code_key UNIQUE (entite_comptable_id, code);
ALTER TABLE exercices DROP CONSTRAINT IF EXISTS exercices_copropriete_id_annee_key;
ALTER TABLE exercices ADD  CONSTRAINT exercices_entite_annee_key UNIQUE (entite_comptable_id, annee);


-- ─── 4. Suppression de l'ancrage copro (IRRÉVERSIBLE) ───────────────
ALTER TABLE journaux            DROP COLUMN copropriete_id;
ALTER TABLE ecritures_comptables DROP COLUMN copropriete_id;
ALTER TABLE exercices           DROP COLUMN copropriete_id;
ALTER TABLE factures            DROP COLUMN copropriete_id;
ALTER TABLE comptes_bancaires   DROP COLUMN copropriete_id;
ALTER TABLE releves_bancaires   DROP COLUMN copropriete_id;

-- Tiers figé remplacé par tiers_type/tiers_id (lot_id conservé = axe analytique)
ALTER TABLE lignes_ecriture     DROP COLUMN coproprietaire_id;

COMMIT;

-- ════════════════════════════════════════════════════════════════════
-- Rollback : IMPOSSIBLE après COMMIT (colonnes droppées).
--            → restaurer le snapshot pris en pré-requis n°3.
-- ════════════════════════════════════════════════════════════════════
