-- ============================================================
-- Sprint Compta 3 — Rapprochement bancaire
-- Import relevé + lettrage avec écritures comptables
-- ============================================================

-- ── 1. Table comptes_bancaires ────────────────────────────
-- Comptes bancaires de la copropriété (type 512xxx)
CREATE TABLE IF NOT EXISTS comptes_bancaires (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  copropriete_id   UUID        NOT NULL REFERENCES coproprietes(id) ON DELETE CASCADE,
  compte_id        UUID        REFERENCES comptes_comptables(id) ON DELETE SET NULL,
  libelle          TEXT        NOT NULL,   -- ex: "Compte courant BNP"
  iban             TEXT,
  bic              TEXT,
  banque           TEXT,
  solde_initial    NUMERIC(14,2) NOT NULL DEFAULT 0,
  actif            BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. Table releves_bancaires ────────────────────────────
-- Un relevé = une session d'import (période donnée)
CREATE TABLE IF NOT EXISTS releves_bancaires (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  compte_bancaire_id UUID      NOT NULL REFERENCES comptes_bancaires(id) ON DELETE CASCADE,
  copropriete_id   UUID        NOT NULL REFERENCES coproprietes(id) ON DELETE CASCADE,
  date_debut       DATE        NOT NULL,
  date_fin         DATE        NOT NULL,
  solde_debut      NUMERIC(14,2) NOT NULL DEFAULT 0,
  solde_fin        NUMERIC(14,2) NOT NULL DEFAULT 0,
  statut           TEXT        NOT NULL DEFAULT 'en_cours'
                               CHECK (statut IN ('en_cours', 'rapproche', 'valide')),
  created_by       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 3. Table lignes_releve ────────────────────────────────
-- Lignes du relevé bancaire (importées ou saisies manuellement)
CREATE TABLE IF NOT EXISTS lignes_releve (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  releve_id        UUID        NOT NULL REFERENCES releves_bancaires(id) ON DELETE CASCADE,
  date_operation   DATE        NOT NULL,
  date_valeur      DATE,
  libelle          TEXT        NOT NULL,
  reference        TEXT,
  montant          NUMERIC(14,2) NOT NULL,  -- positif = crédit, négatif = débit
  -- Lettrage
  ecriture_id      UUID        REFERENCES ecritures_comptables(id) ON DELETE SET NULL,
  statut_lettrage  TEXT        NOT NULL DEFAULT 'non_lettre'
                               CHECK (statut_lettrage IN ('non_lettre', 'lettre', 'ignore')),
  ordre            INTEGER     NOT NULL DEFAULT 0
);

-- ── 4. RLS ────────────────────────────────────────────────
ALTER TABLE comptes_bancaires  ENABLE ROW LEVEL SECURITY;
ALTER TABLE releves_bancaires  ENABLE ROW LEVEL SECURITY;
ALTER TABLE lignes_releve      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comptes_bancaires_cabinet" ON comptes_bancaires
  FOR ALL USING (
    copropriete_id IN (
      SELECT c.id FROM coproprietes c
      JOIN profiles p ON p.cabinet_id = c.cabinet_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "releves_bancaires_cabinet" ON releves_bancaires
  FOR ALL USING (
    copropriete_id IN (
      SELECT c.id FROM coproprietes c
      JOIN profiles p ON p.cabinet_id = c.cabinet_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "lignes_releve_cabinet" ON lignes_releve
  FOR ALL USING (
    releve_id IN (
      SELECT r.id FROM releves_bancaires r
      JOIN coproprietes c ON c.id = r.copropriete_id
      JOIN profiles p ON p.cabinet_id = c.cabinet_id
      WHERE p.id = auth.uid()
    )
  );

-- ── 5. Indexes ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_comptes_bancaires_copro  ON comptes_bancaires(copropriete_id);
CREATE INDEX IF NOT EXISTS idx_releves_compte            ON releves_bancaires(compte_bancaire_id);
CREATE INDEX IF NOT EXISTS idx_releves_copro             ON releves_bancaires(copropriete_id);
CREATE INDEX IF NOT EXISTS idx_lignes_releve_releve      ON lignes_releve(releve_id);
CREATE INDEX IF NOT EXISTS idx_lignes_releve_lettrage    ON lignes_releve(statut_lettrage);

-- ── 6. Vue v_rapprochement ────────────────────────────────
CREATE OR REPLACE VIEW v_rapprochement AS
SELECT
  lr.id,
  lr.releve_id,
  lr.date_operation,
  lr.date_valeur,
  lr.libelle,
  lr.reference,
  lr.montant,
  lr.statut_lettrage,
  lr.ecriture_id,
  lr.ordre,
  -- Écriture associée
  ec.date_ecriture,
  ec.libelle                    AS libelle_ecriture,
  ec.statut                     AS statut_ecriture,
  j.code                        AS journal_code,
  -- Relevé
  rb.compte_bancaire_id,
  rb.date_debut,
  rb.date_fin,
  rb.copropriete_id
FROM lignes_releve lr
JOIN releves_bancaires rb ON rb.id = lr.releve_id
LEFT JOIN ecritures_comptables ec ON ec.id = lr.ecriture_id
LEFT JOIN journaux j ON j.id = ec.journal_id;
