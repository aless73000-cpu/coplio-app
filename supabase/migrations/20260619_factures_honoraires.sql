-- ════════════════════════════════════════════════════════════════════
-- MIGRATION : Factures d'honoraires (vente cabinet → syndicat)
-- Permet au syndic d'émettre une facture forfaitaire (mensuelle/annuelle)
-- au syndicat des copropriétaires — sens INVERSE des factures fournisseurs
-- (table `factures`, qui est de l'achat).
--
-- ⚠️ Récupération sur les lots : elle ne se fait PAS ici mais via le budget
--    prévisionnel (catégorie 'honoraires' déjà existante) + les appels de
--    charges répartis par tantièmes. Cette facture est le document forfait.
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS factures_honoraires (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id     UUID        NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  copropriete_id UUID        NOT NULL REFERENCES coproprietes(id) ON DELETE CASCADE,

  numero         TEXT,                              -- ex: FH-2026-0001 (attribué à la création)
  objet          TEXT        NOT NULL DEFAULT 'Honoraires de gestion',

  periode_type   TEXT        NOT NULL DEFAULT 'mensuel'
    CHECK (periode_type IN ('mensuel', 'annuel', 'ponctuel')),
  periode_label  TEXT,                              -- ex: 'Juin 2026', 'Année 2026'

  date_emission  DATE        NOT NULL DEFAULT current_date,
  date_echeance  DATE,

  montant_ht     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (montant_ht >= 0),
  taux_tva       NUMERIC(5,2)  NOT NULL DEFAULT 20,
  montant_tva    NUMERIC(12,2) NOT NULL DEFAULT 0,
  montant_ttc    NUMERIC(12,2) NOT NULL DEFAULT 0,

  statut         TEXT        NOT NULL DEFAULT 'brouillon'
    CHECK (statut IN ('brouillon', 'emise', 'payee', 'annulee')),

  notes          TEXT,
  created_by     UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE factures_honoraires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "factures_honoraires_cabinet" ON factures_honoraires
  FOR ALL USING (cabinet_id = get_user_cabinet_id());

-- Numéro unique par cabinet (quand renseigné)
CREATE UNIQUE INDEX IF NOT EXISTS idx_factures_honoraires_numero
  ON factures_honoraires (cabinet_id, numero)
  WHERE numero IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_factures_honoraires_cabinet
  ON factures_honoraires (cabinet_id, date_emission DESC);
CREATE INDEX IF NOT EXISTS idx_factures_honoraires_copropriete
  ON factures_honoraires (copropriete_id);

CREATE TRIGGER trigger_updated_at_factures_honoraires
  BEFORE UPDATE ON factures_honoraires
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE factures_honoraires IS
  'Factures d''honoraires émises par le cabinet au syndicat (forfait). La répartition par lot passe par le budget + les appels de charges.';
