-- ════════════════════════════════════════════
-- SUIVI DES TRAVAUX
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS travaux (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  copropriete_id UUID NOT NULL REFERENCES coproprietes(id) ON DELETE CASCADE,
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  prestataire_id UUID REFERENCES prestataires(id) ON DELETE SET NULL,
  titre TEXT NOT NULL,
  description TEXT,
  priorite TEXT NOT NULL DEFAULT 'normale',
  statut TEXT NOT NULL DEFAULT 'demande',
  montant_estime NUMERIC(12,2),
  montant_final NUMERIC(12,2),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS travaux_etapes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travail_id UUID NOT NULL REFERENCES travaux(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT,
  fichier_url TEXT,
  montant NUMERIC(12,2),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE travaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE travaux_etapes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "syndic_travaux" ON travaux FOR ALL USING (cabinet_id IN (SELECT cabinet_id FROM profiles WHERE id = auth.uid() AND cabinet_id IS NOT NULL));
CREATE POLICY "syndic_travaux_etapes" ON travaux_etapes FOR ALL USING (travail_id IN (SELECT id FROM travaux WHERE cabinet_id IN (SELECT cabinet_id FROM profiles WHERE id = auth.uid() AND cabinet_id IS NOT NULL)));

-- ════════════════════════════════════════════
-- CLÉS ET ACCÈS
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS cles_acces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  copropriete_id UUID NOT NULL REFERENCES coproprietes(id) ON DELETE CASCADE,
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'cle',
  description TEXT NOT NULL,
  localisation TEXT,
  detenteur_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  detenteur_nom TEXT,
  date_remise TIMESTAMPTZ,
  retourne BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE cles_acces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "syndic_cles" ON cles_acces FOR ALL USING (cabinet_id IN (SELECT cabinet_id FROM profiles WHERE id = auth.uid() AND cabinet_id IS NOT NULL));

-- ════════════════════════════════════════════
-- OBLIGATIONS LÉGALES
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS obligations_legales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  copropriete_id UUID NOT NULL REFERENCES coproprietes(id) ON DELETE CASCADE,
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT,
  date_realisation TIMESTAMPTZ,
  date_expiration TIMESTAMPTZ,
  fichier_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE obligations_legales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "syndic_obligations" ON obligations_legales FOR ALL USING (cabinet_id IN (SELECT cabinet_id FROM profiles WHERE id = auth.uid() AND cabinet_id IS NOT NULL));

-- ════════════════════════════════════════════
-- ARCHIVAGE LÉGAL
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  copropriete_id UUID REFERENCES coproprietes(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'autre',
  nom TEXT NOT NULL,
  fichier_url TEXT NOT NULL,
  taille_octets BIGINT,
  hash_sha256 TEXT,
  date_document TIMESTAMPTZ,
  retention_jusqu_au TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE archives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "syndic_archives" ON archives FOR ALL USING (cabinet_id IN (SELECT cabinet_id FROM profiles WHERE id = auth.uid() AND cabinet_id IS NOT NULL));

-- ════════════════════════════════════════════
-- SIGNATURES ÉLECTRONIQUES (Yousign)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  copropriete_id UUID REFERENCES coproprietes(id) ON DELETE SET NULL,
  nom TEXT NOT NULL,
  type_document TEXT NOT NULL DEFAULT 'autre',
  yousign_request_id TEXT,
  statut TEXT NOT NULL DEFAULT 'brouillon',
  signataires JSONB NOT NULL DEFAULT '[]',
  fichier_url TEXT,
  lien_signature TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "syndic_signatures" ON signatures FOR ALL USING (cabinet_id IN (SELECT cabinet_id FROM profiles WHERE id = auth.uid() AND cabinet_id IS NOT NULL));
