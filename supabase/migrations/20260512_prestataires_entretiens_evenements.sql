-- ════════════════════════════════════════════
-- PRESTATAIRES (annuaire cabinet)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS prestataires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  categorie TEXT NOT NULL DEFAULT 'autre',
  email TEXT,
  telephone TEXT,
  siret TEXT,
  adresse TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE prestataires ENABLE ROW LEVEL SECURITY;
CREATE POLICY "syndic_prestataires" ON prestataires FOR ALL USING (cabinet_id IN (SELECT cabinet_id FROM profiles WHERE id = auth.uid() AND cabinet_id IS NOT NULL));

-- ════════════════════════════════════════════
-- ENTRETIENS (carnet d'entretien par copropriété)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS entretiens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  copropriete_id UUID NOT NULL REFERENCES coproprietes(id) ON DELETE CASCADE,
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  prestataire_id UUID REFERENCES prestataires(id) ON DELETE SET NULL,
  titre TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'maintenance',
  date_intervention TIMESTAMPTZ NOT NULL,
  cout NUMERIC(12,2),
  statut TEXT NOT NULL DEFAULT 'planifie',
  document_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE entretiens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "syndic_entretiens" ON entretiens FOR ALL USING (cabinet_id IN (SELECT cabinet_id FROM profiles WHERE id = auth.uid() AND cabinet_id IS NOT NULL));

-- ════════════════════════════════════════════
-- EVENEMENTS CABINET (agenda partagé)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS evenements_cabinet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  copropriete_id UUID REFERENCES coproprietes(id) ON DELETE SET NULL,
  titre TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'autre',
  date_debut TIMESTAMPTZ NOT NULL,
  date_fin TIMESTAMPTZ,
  lieu TEXT,
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE evenements_cabinet ENABLE ROW LEVEL SECURITY;
CREATE POLICY "syndic_evenements" ON evenements_cabinet FOR ALL USING (cabinet_id IN (SELECT cabinet_id FROM profiles WHERE id = auth.uid() AND cabinet_id IS NOT NULL));
