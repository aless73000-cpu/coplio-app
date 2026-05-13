-- ═══════════════════════════════════════════════════════════════
-- COPLIO — Prestataires & Carnet d'entretien
-- ═══════════════════════════════════════════════════════════════

-- ── Prestataires ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prestataires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  nom VARCHAR(255) NOT NULL,
  metier VARCHAR(100),
  telephone VARCHAR(30),
  email VARCHAR(255),
  adresse TEXT,
  siret VARCHAR(20),
  note INTEGER CHECK (note BETWEEN 1 AND 5),
  commentaire TEXT,
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prestataires_cabinet ON prestataires(cabinet_id);

ALTER TABLE prestataires ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cabinet members can manage prestataires"
  ON prestataires FOR ALL
  USING (cabinet_id IN (SELECT cabinet_id FROM profiles WHERE id = auth.uid()));

-- ── Carnet d'entretien ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS carnet_entretien (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  copropriete_id UUID NOT NULL REFERENCES coproprietes(id) ON DELETE CASCADE,
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  prestataire_id UUID REFERENCES prestataires(id) ON DELETE SET NULL,

  titre VARCHAR(255) NOT NULL,
  description TEXT,
  categorie VARCHAR(50) DEFAULT 'entretien' CHECK (
    categorie IN ('entretien','reparation','controle','renovation','urgence','autre')
  ),
  statut VARCHAR(30) DEFAULT 'planifie' CHECK (
    statut IN ('planifie','en_cours','realise','annule')
  ),

  date_intervention DATE,
  date_realisation DATE,
  cout_prevu NUMERIC(12,2),
  cout_reel NUMERIC(12,2),

  document_url TEXT,
  periodicite VARCHAR(30) CHECK (
    periodicite IN ('unique','mensuel','trimestriel','semestriel','annuel','pluriannuel')
  ),
  prochaine_echeance DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carnet_copropriete ON carnet_entretien(copropriete_id);
CREATE INDEX IF NOT EXISTS idx_carnet_cabinet ON carnet_entretien(cabinet_id);

ALTER TABLE carnet_entretien ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cabinet members can manage carnet"
  ON carnet_entretien FOR ALL
  USING (cabinet_id IN (SELECT cabinet_id FROM profiles WHERE id = auth.uid()));
