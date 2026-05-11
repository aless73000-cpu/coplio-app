-- Budget prévisionnel
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  copropriete_id UUID NOT NULL REFERENCES coproprietes(id) ON DELETE CASCADE,
  annee INTEGER NOT NULL,
  statut TEXT NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'valide', 'approuve')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (copropriete_id, annee)
);

CREATE TABLE IF NOT EXISTS budget_lignes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  poste TEXT NOT NULL,
  categorie TEXT NOT NULL DEFAULT 'charges_generales'
    CHECK (categorie IN ('charges_generales', 'entretien', 'travaux', 'assurances', 'honoraires', 'reserves', 'autre')),
  montant_previsionnel NUMERIC(12,2) NOT NULL DEFAULT 0,
  montant_reel NUMERIC(12,2),
  commentaire TEXT,
  ordre INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_lignes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budgets_cabinet_access" ON budgets
  FOR ALL USING (
    copropriete_id IN (
      SELECT id FROM coproprietes
      WHERE cabinet_id = (SELECT cabinet_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "budget_lignes_access" ON budget_lignes
  FOR ALL USING (
    budget_id IN (
      SELECT b.id FROM budgets b
      JOIN coproprietes c ON c.id = b.copropriete_id
      WHERE c.cabinet_id = (SELECT cabinet_id FROM profiles WHERE id = auth.uid())
    )
  );
