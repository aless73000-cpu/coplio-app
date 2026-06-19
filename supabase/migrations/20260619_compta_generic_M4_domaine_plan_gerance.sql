-- ════════════════════════════════════════════════════════════════════
-- MIGRATION : Comptabilité générique — M4 / Domaine + plan gérance
-- Ajoute une dimension `domaine` (syndic | gerance | commun) au plan
-- comptable, reclasse les comptes partagés, et seed un référentiel gérance.
--
-- ⚠️ NB MÉTIER : la gérance locative ne relève PAS de l'arrêté du
--    14 mars 2005 (réservé aux syndicats de copropriétaires) mais du Plan
--    Comptable Général. Le référentiel ci-dessous est INDICATIF et doit
--    être validé par un expert-comptable avant exploitation.
--
-- ⚠️ ADDITIF & RÉVERSIBLE : n'altère aucune donnée comptable existante.
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. Colonne domaine ──────────────────────────────────────────────
ALTER TABLE comptes_comptables
  ADD COLUMN IF NOT EXISTS domaine TEXT NOT NULL DEFAULT 'syndic'
    CHECK (domaine IN ('syndic', 'gerance', 'commun'));


-- ─── 2. Reclasser les comptes communs aux deux métiers ──────────────
-- Banques, fournisseurs, TVA, services bancaires : partagés syndic/gérance.
UPDATE comptes_comptables
SET domaine = 'commun'
WHERE cabinet_id IS NULL
  AND numero IN (
    '40','401','401000','408','409',
    '445','4452','4456','4457',
    '51','512','512100','512200','514','530',
    '627'
  );


-- ─── 3. Unicité incluant le domaine ──────────────────────────────────
-- Permet à un n° de compte d'exister dans deux référentiels distincts.
ALTER TABLE comptes_comptables
  DROP CONSTRAINT IF EXISTS comptes_comptables_cabinet_id_copropriete_id_numero_key;
ALTER TABLE comptes_comptables
  ADD CONSTRAINT comptes_comptables_unique
    UNIQUE (cabinet_id, copropriete_id, domaine, numero);


-- ─── 4. Seed plan comptable gérance (référentiel indicatif) ─────────
-- Idempotent : ne s'insère que si le référentiel gérance standard est absent.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM comptes_comptables
    WHERE domaine = 'gerance' AND cabinet_id IS NULL
  ) THEN
    INSERT INTO comptes_comptables (cabinet_id, copropriete_id, numero, libelle, classe, type_compte, sens_normal, domaine) VALUES
    -- ── Classe 1 — Dépôts reçus ──────────────────────────────────────
    (NULL, NULL, '165',     'Dépôts et cautionnements reçus',          1, 'detail', 'credit', 'gerance'),
    -- ── Classe 4 — Tiers ─────────────────────────────────────────────
    (NULL, NULL, '411',     'Locataires',                              4, 'titre',  'debit',  'gerance'),
    (NULL, NULL, '4110',    'Locataires — loyers et charges',          4, 'detail', 'debit',  'gerance'),
    (NULL, NULL, '4118',    'Locataires douteux ou litigieux',         4, 'detail', 'debit',  'gerance'),
    (NULL, NULL, '467',     'Propriétaires (mandants)',                4, 'titre',  'credit', 'gerance'),
    (NULL, NULL, '4670',    'Propriétaires — sommes à reverser',       4, 'detail', 'credit', 'gerance'),
    (NULL, NULL, '4671',    'Propriétaires — avances sur travaux',     4, 'detail', 'credit', 'gerance'),
    -- ── Classe 6 — Charges (refacturées / récupérables) ──────────────
    (NULL, NULL, '614',     'Charges locatives récupérables',          6, 'detail', 'debit',  'gerance'),
    (NULL, NULL, '6063',    'Fournitures d''entretien (bien géré)',    6, 'detail', 'debit',  'gerance'),
    -- ── Classe 7 — Produits ──────────────────────────────────────────
    (NULL, NULL, '7083',    'Honoraires de gestion locative',          7, 'detail', 'credit', 'gerance'),
    (NULL, NULL, '7084',    'Honoraires de mise en location',          7, 'detail', 'credit', 'gerance'),
    (NULL, NULL, '752',     'Revenus des immeubles (loyers)',          7, 'detail', 'credit', 'gerance'),
    (NULL, NULL, '758',     'Produits divers de gestion',              7, 'detail', 'credit', 'gerance');
  END IF;
END $$;

COMMENT ON COLUMN comptes_comptables.domaine IS
  'Référentiel du compte : syndic (arrêté 2005) | gerance (PCG) | commun.';
