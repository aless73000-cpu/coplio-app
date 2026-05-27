-- ============================================================
-- Sprint Compta 2 — Factures fournisseurs
-- Devis → Facture → Écriture comptable → Paiement
-- ============================================================

-- ── 1. Table factures ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS factures (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  copropriete_id   UUID        NOT NULL REFERENCES coproprietes(id) ON DELETE CASCADE,
  fournisseur_id   UUID        REFERENCES fournisseurs(id) ON DELETE SET NULL,
  exercice_id      UUID        REFERENCES exercices(id) ON DELETE SET NULL,

  -- Identifiants
  numero_facture   TEXT,                          -- n° facture fournisseur
  numero_interne   TEXT,                          -- référence interne syndic
  type_document    TEXT        NOT NULL DEFAULT 'facture'
                               CHECK (type_document IN ('devis', 'facture', 'avoir')),

  -- Dates
  date_document    DATE        NOT NULL,
  date_echeance    DATE,
  date_reception   DATE,

  -- Montants HT/TVA/TTC
  montant_ht       NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (montant_ht >= 0),
  taux_tva         NUMERIC(5,2)  NOT NULL DEFAULT 0,
  montant_tva      NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (montant_tva >= 0),
  montant_ttc      NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (montant_ttc >= 0),

  -- Lien vers l'écriture comptable générée
  compte_charge_id UUID        REFERENCES comptes_comptables(id) ON DELETE SET NULL,
  ecriture_id      UUID        REFERENCES ecritures_comptables(id) ON DELETE SET NULL,

  -- Statut workflow
  statut           TEXT        NOT NULL DEFAULT 'recu'
                               CHECK (statut IN ('recu', 'valide', 'comptabilise', 'paye', 'annule')),

  -- Métadonnées
  libelle          TEXT        NOT NULL,
  notes            TEXT,
  fichier_url      TEXT,

  created_by       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. Table lignes_facture ────────────────────────────────
CREATE TABLE IF NOT EXISTS lignes_facture (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id       UUID        NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
  description      TEXT        NOT NULL,
  quantite         NUMERIC(10,3) NOT NULL DEFAULT 1,
  prix_unitaire_ht NUMERIC(14,2) NOT NULL DEFAULT 0,
  taux_tva         NUMERIC(5,2)  NOT NULL DEFAULT 0,
  montant_ht       NUMERIC(14,2) NOT NULL DEFAULT 0,
  montant_tva      NUMERIC(14,2) NOT NULL DEFAULT 0,
  montant_ttc      NUMERIC(14,2) NOT NULL DEFAULT 0,
  compte_charge_id UUID        REFERENCES comptes_comptables(id) ON DELETE SET NULL,
  ordre            INTEGER     NOT NULL DEFAULT 0
);

-- ── 3. Table paiements_facture ────────────────────────────
CREATE TABLE IF NOT EXISTS paiements_facture (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id       UUID        NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
  date_paiement    DATE        NOT NULL,
  montant          NUMERIC(14,2) NOT NULL CHECK (montant > 0),
  mode_paiement    TEXT        NOT NULL DEFAULT 'virement'
                               CHECK (mode_paiement IN ('virement', 'cheque', 'prelevement', 'especes', 'autre')),
  reference        TEXT,
  ecriture_id      UUID        REFERENCES ecritures_comptables(id) ON DELETE SET NULL,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 4. RLS ────────────────────────────────────────────────
ALTER TABLE factures            ENABLE ROW LEVEL SECURITY;
ALTER TABLE lignes_facture      ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements_facture   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "factures_cabinet" ON factures
  FOR ALL USING (
    copropriete_id IN (
      SELECT c.id FROM coproprietes c
      JOIN profiles p ON p.cabinet_id = c.cabinet_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "lignes_facture_cabinet" ON lignes_facture
  FOR ALL USING (
    facture_id IN (
      SELECT f.id FROM factures f
      JOIN coproprietes c ON c.id = f.copropriete_id
      JOIN profiles p ON p.cabinet_id = c.cabinet_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "paiements_facture_cabinet" ON paiements_facture
  FOR ALL USING (
    facture_id IN (
      SELECT f.id FROM factures f
      JOIN coproprietes c ON c.id = f.copropriete_id
      JOIN profiles p ON p.cabinet_id = c.cabinet_id
      WHERE p.id = auth.uid()
    )
  );

-- ── 5. Indexes ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_factures_copropriete    ON factures(copropriete_id);
CREATE INDEX IF NOT EXISTS idx_factures_fournisseur    ON factures(fournisseur_id);
CREATE INDEX IF NOT EXISTS idx_factures_exercice        ON factures(exercice_id);
CREATE INDEX IF NOT EXISTS idx_factures_statut          ON factures(statut);
CREATE INDEX IF NOT EXISTS idx_factures_date            ON factures(date_document);
CREATE INDEX IF NOT EXISTS idx_lignes_facture_facture   ON lignes_facture(facture_id);
CREATE INDEX IF NOT EXISTS idx_paiements_facture_fact   ON paiements_facture(facture_id);

-- ── 6. Updated_at trigger ─────────────────────────────────
DROP TRIGGER IF EXISTS trg_factures_updated_at ON factures;
CREATE TRIGGER trg_factures_updated_at
  BEFORE UPDATE ON factures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 7. Vue v_factures_avec_solde ──────────────────────────
CREATE OR REPLACE VIEW v_factures_avec_solde AS
SELECT
  f.*,
  frs.nom                                                     AS fournisseur_nom,
  frs.siret                                                   AS fournisseur_siret,
  frs.mode_paiement                                           AS fournisseur_mode_paiement,
  COALESCE(SUM(p.montant), 0)                                 AS montant_paye,
  f.montant_ttc - COALESCE(SUM(p.montant), 0)                AS solde_restant,
  CASE
    WHEN f.statut = 'annule'                           THEN 'annule'
    WHEN COALESCE(SUM(p.montant), 0) >= f.montant_ttc  THEN 'paye'
    WHEN f.date_echeance IS NOT NULL
     AND f.date_echeance < CURRENT_DATE
     AND COALESCE(SUM(p.montant), 0) < f.montant_ttc   THEN 'en_retard'
    WHEN COALESCE(SUM(p.montant), 0) > 0               THEN 'partiel'
    ELSE f.statut
  END                                                         AS statut_paiement
FROM factures f
LEFT JOIN fournisseurs frs ON frs.id = f.fournisseur_id
LEFT JOIN paiements_facture p ON p.facture_id = f.id
GROUP BY f.id, frs.nom, frs.siret, frs.mode_paiement;
