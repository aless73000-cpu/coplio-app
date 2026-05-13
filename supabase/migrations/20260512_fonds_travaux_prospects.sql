-- Fonds de travaux ALUR (article 18 loi ALUR)
CREATE TABLE IF NOT EXISTS fonds_travaux (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  copropriete_id uuid REFERENCES coproprietes(id) ON DELETE CASCADE NOT NULL,
  annee integer NOT NULL,
  cotisation_annuelle numeric(12,2) DEFAULT 0,
  solde_actuel numeric(12,2) DEFAULT 0,
  objectif_5ans numeric(12,2) DEFAULT 0,
  compte_bancaire text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(copropriete_id, annee)
);

CREATE TABLE IF NOT EXISTS fonds_travaux_mouvements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fonds_travaux_id uuid REFERENCES fonds_travaux(id) ON DELETE CASCADE NOT NULL,
  date_mouvement date NOT NULL DEFAULT current_date,
  type text NOT NULL CHECK (type IN ('cotisation', 'retrait', 'interet', 'autre')),
  montant numeric(12,2) NOT NULL,
  libelle text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fonds_travaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE fonds_travaux_mouvements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fonds_travaux_cabinet" ON fonds_travaux
  USING (copropriete_id IN (
    SELECT c.id FROM coproprietes c
    WHERE c.cabinet_id IN (SELECT cabinet_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "fonds_travaux_mouvements_cabinet" ON fonds_travaux_mouvements
  USING (fonds_travaux_id IN (
    SELECT ft.id FROM fonds_travaux ft
    JOIN coproprietes c ON c.id = ft.copropriete_id
    WHERE c.cabinet_id IN (SELECT cabinet_id FROM profiles WHERE id = auth.uid())
  ));

-- CRM Prospects
CREATE TABLE IF NOT EXISTS prospects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cabinet_id uuid REFERENCES cabinets(id) ON DELETE CASCADE NOT NULL,
  nom text NOT NULL,
  adresse text,
  ville text,
  code_postal text,
  nb_lots integer DEFAULT 0,
  contact_nom text,
  contact_email text,
  contact_telephone text,
  statut text NOT NULL DEFAULT 'lead' CHECK (statut IN ('lead', 'contact', 'proposition', 'nego', 'gagne', 'perdu')),
  probabilite integer DEFAULT 0 CHECK (probabilite >= 0 AND probabilite <= 100),
  montant_potentiel numeric(12,2) DEFAULT 0,
  notes text,
  prochain_rdv timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prospects_cabinet" ON prospects
  USING (cabinet_id IN (SELECT cabinet_id FROM profiles WHERE id = auth.uid()));

-- Coordonnées géographiques pour la carte
ALTER TABLE coproprietes ADD COLUMN IF NOT EXISTS latitude decimal(9,6);
ALTER TABLE coproprietes ADD COLUMN IF NOT EXISTS longitude decimal(9,6);

-- Conseil syndical (membres)
CREATE TABLE IF NOT EXISTS conseil_syndical (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  copropriete_id uuid REFERENCES coproprietes(id) ON DELETE CASCADE NOT NULL,
  prenom text NOT NULL,
  nom text NOT NULL,
  email text,
  telephone text,
  role text DEFAULT 'membre' CHECK (role IN ('president', 'vice_president', 'secretaire', 'tresorier', 'membre')),
  lot_numero text,
  date_debut date DEFAULT current_date,
  date_fin date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE conseil_syndical ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conseil_syndical_cabinet" ON conseil_syndical
  USING (copropriete_id IN (
    SELECT c.id FROM coproprietes c
    WHERE c.cabinet_id IN (SELECT cabinet_id FROM profiles WHERE id = auth.uid())
  ));
