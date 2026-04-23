-- ═══════════════════════════════════════════════════════════════
-- COPLIO — Schéma PostgreSQL complet (Supabase)
-- Version : 1.0.0
-- ═══════════════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Pour la recherche full-text

-- ───────────────────────────────────────────────────────────────
-- TYPES ENUM
-- ───────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('owner', 'manager', 'owner_resident');
CREATE TYPE subscription_plan AS ENUM ('trial', 'starter', 'pro', 'expert');
CREATE TYPE subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'incomplete');
CREATE TYPE lot_type AS ENUM ('appartement', 'maison', 'local_commercial', 'parking', 'cave', 'autre');
CREATE TYPE sinistre_status AS ENUM ('signale', 'assurance_declaree', 'urgence', 'expertise', 'travaux', 'cloture');
CREATE TYPE document_category AS ENUM ('pv_ag', 'budget', 'contrat', 'sinistre', 'appel_fonds', 'reglement', 'autre');
CREATE TYPE ag_status AS ENUM ('planifiee', 'convocations_envoyees', 'en_cours', 'terminee', 'annulee');
CREATE TYPE ag_type AS ENUM ('ordinaire', 'extraordinaire');
CREATE TYPE vote_type AS ENUM ('art_24', 'art_25', 'art_26', 'unanimite');
CREATE TYPE vote_value AS ENUM ('pour', 'contre', 'abstention');
CREATE TYPE relance_type AS ENUM ('email', 'sms', 'mise_en_demeure', 'manuel');
CREATE TYPE devis_status AS ENUM ('en_attente', 'accepte', 'refuse');
CREATE TYPE notification_type AS ENUM ('info', 'alerte', 'urgent');

-- ───────────────────────────────────────────────────────────────
-- CABINETS (Syndics)
-- ───────────────────────────────────────────────────────────────

CREATE TABLE cabinets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom VARCHAR(255) NOT NULL,
  siret VARCHAR(14) UNIQUE,
  adresse TEXT,
  code_postal VARCHAR(10),
  ville VARCHAR(100),
  telephone VARCHAR(20),
  email_contact VARCHAR(255),
  logo_url TEXT,
  couleur_primaire VARCHAR(7) DEFAULT '#0F6E56',

  -- Abonnement Stripe
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  plan subscription_plan DEFAULT 'trial',
  subscription_status subscription_status DEFAULT 'trialing',
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  current_period_end TIMESTAMPTZ,
  addon_portail_actif BOOLEAN DEFAULT FALSE,

  -- Limites selon plan
  max_gestionnaires INTEGER DEFAULT 1,
  max_lots INTEGER DEFAULT 50,

  -- Paramètres
  timezone VARCHAR(50) DEFAULT 'Europe/Paris',
  notifications_email BOOLEAN DEFAULT TRUE,
  notifications_sms BOOLEAN DEFAULT FALSE,
  recap_quotidien BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- PROFILS UTILISATEURS (étend auth.users de Supabase)
-- ───────────────────────────────────────────────────────────────

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cabinet_id UUID REFERENCES cabinets(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'manager',

  -- Informations personnelles
  prenom VARCHAR(100),
  nom VARCHAR(100),
  email VARCHAR(255) NOT NULL,
  telephone VARCHAR(20),
  avatar_url TEXT,

  -- Pour les copropriétaires : lien vers leur lot
  lot_id UUID, -- sera référencé après création de la table lots

  -- Préférences
  langue VARCHAR(5) DEFAULT 'fr',
  notifications_push BOOLEAN DEFAULT TRUE,
  push_subscription JSONB, -- Web Push subscription object

  -- Onboarding
  onboarding_complete BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- COPROPRIÉTÉS
-- ───────────────────────────────────────────────────────────────

CREATE TABLE coproprietes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  gestionnaire_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Informations générales
  nom VARCHAR(255) NOT NULL,
  adresse TEXT NOT NULL,
  code_postal VARCHAR(10),
  ville VARCHAR(100),
  pays VARCHAR(50) DEFAULT 'France',

  -- Détails techniques
  annee_construction INTEGER,
  nb_etages INTEGER,
  tantièmes_totaux INTEGER DEFAULT 10000,
  surface_totale NUMERIC(10,2), -- m²

  -- Assurance
  assureur VARCHAR(255),
  numero_contrat_assurance VARCHAR(100),
  expiration_assurance DATE,

  -- Compte bancaire syndic
  iban VARCHAR(34),
  banque VARCHAR(100),

  -- Statut calculé (mis à jour par triggers)
  statut VARCHAR(20) DEFAULT 'a_jour' CHECK (statut IN ('a_jour', 'attention', 'urgent')),

  -- Compteurs dénormalisés (mis à jour par triggers)
  nb_lots INTEGER DEFAULT 0,
  nb_copropriétaires INTEGER DEFAULT 0,
  nb_sinistres_ouverts INTEGER DEFAULT 0,
  montant_impayes NUMERIC(12,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- LOTS
-- ───────────────────────────────────────────────────────────────

CREATE TABLE lots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  copropriete_id UUID NOT NULL REFERENCES coproprietes(id) ON DELETE CASCADE,

  -- Identification
  numero VARCHAR(20) NOT NULL,
  etage VARCHAR(10),
  type lot_type DEFAULT 'appartement',

  -- Caractéristiques
  surface NUMERIC(8,2),
  nb_pieces INTEGER,
  tantiemes INTEGER NOT NULL DEFAULT 0,

  -- Situation financière
  solde_compte NUMERIC(12,2) DEFAULT 0,
  montant_impaye NUMERIC(12,2) DEFAULT 0,
  derniere_regularisation DATE,

  -- Statut
  occupe BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(copropriete_id, numero)
);

-- Ajouter la FK lot_id dans profiles après création de lots
ALTER TABLE profiles ADD CONSTRAINT profiles_lot_id_fkey
  FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE SET NULL;

-- ───────────────────────────────────────────────────────────────
-- COPROPRIÉTAIRES (peuvent avoir plusieurs lots)
-- ───────────────────────────────────────────────────────────────

CREATE TABLE copropriétaires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- NULL si pas encore invité

  -- Informations
  prenom VARCHAR(100) NOT NULL,
  nom VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  telephone VARCHAR(20),
  adresse_correspondance TEXT, -- Si différente du lot

  -- Statut portail
  portail_actif BOOLEAN DEFAULT FALSE,
  invitation_envoyee_at TIMESTAMPTZ,
  invitation_token VARCHAR(255),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table de liaison copropriétaire <-> lots (un copropriétaire peut avoir N lots)
CREATE TABLE copropriétaire_lots (
  copropriétaire_id UUID NOT NULL REFERENCES copropriétaires(id) ON DELETE CASCADE,
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  date_acquisition DATE,
  PRIMARY KEY (copropriétaire_id, lot_id)
);

-- ───────────────────────────────────────────────────────────────
-- APPELS DE CHARGES
-- ───────────────────────────────────────────────────────────────

CREATE TABLE appels_charges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  copropriete_id UUID NOT NULL REFERENCES coproprietes(id) ON DELETE CASCADE,
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  copropriétaire_id UUID REFERENCES copropriétaires(id) ON DELETE SET NULL,

  -- Détails
  libelle VARCHAR(255) NOT NULL, -- ex: "Appel de fonds T3 2024"
  montant NUMERIC(12,2) NOT NULL,
  date_appel DATE NOT NULL,
  date_echeance DATE NOT NULL,

  -- Paiement
  montant_paye NUMERIC(12,2) DEFAULT 0,
  date_paiement DATE,
  paye BOOLEAN GENERATED ALWAYS AS (montant_paye >= montant) STORED,

  -- Relances
  nb_relances INTEGER DEFAULT 0,
  derniere_relance_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- DOCUMENTS (GED)
-- ───────────────────────────────────────────────────────────────

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  copropriete_id UUID REFERENCES coproprietes(id) ON DELETE CASCADE,
  lot_id UUID REFERENCES lots(id) ON DELETE SET NULL,
  sinistre_id UUID, -- référence ajoutée après
  ag_id UUID, -- référence ajoutée après

  -- Métadonnées
  nom VARCHAR(255) NOT NULL,
  description TEXT,
  categorie document_category DEFAULT 'autre',
  taille_bytes BIGINT,
  type_mime VARCHAR(100),

  -- Stockage Supabase Storage
  storage_path TEXT NOT NULL, -- ex: "documents/cabinet_id/copropriete_id/filename.pdf"
  storage_bucket VARCHAR(100) DEFAULT 'documents',

  -- Accès
  visible_copropriétaires BOOLEAN DEFAULT FALSE,
  upload_par UUID REFERENCES profiles(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- SINISTRES ET TRAVAUX
-- ───────────────────────────────────────────────────────────────

CREATE TABLE sinistres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  copropriete_id UUID NOT NULL REFERENCES coproprietes(id) ON DELETE CASCADE,
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  gestionnaire_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Informations
  reference VARCHAR(50) UNIQUE, -- ex: "SIN-2024-001"
  titre VARCHAR(255) NOT NULL,
  description TEXT,
  status sinistre_status DEFAULT 'signale',

  -- Localisation
  lots_concernes UUID[], -- array de lot_id

  -- Assurance
  numero_declaration_assurance VARCHAR(100),
  compagnie_assurance VARCHAR(255),
  montant_franchise NUMERIC(12,2),
  montant_indemnisation NUMERIC(12,2),

  -- Dates
  date_sinistre DATE,
  date_declaration DATE,
  date_cloture DATE,

  -- Montant travaux estimé
  montant_travaux_estime NUMERIC(12,2),
  montant_travaux_reel NUMERIC(12,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Étapes timeline sinistre
CREATE TABLE sinistre_etapes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sinistre_id UUID NOT NULL REFERENCES sinistres(id) ON DELETE CASCADE,
  status sinistre_status NOT NULL,
  titre VARCHAR(255),
  description TEXT,
  date_etape TIMESTAMPTZ DEFAULT NOW(),
  created_par UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Devis sinistres
CREATE TABLE sinistre_devis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sinistre_id UUID NOT NULL REFERENCES sinistres(id) ON DELETE CASCADE,
  prestataire VARCHAR(255) NOT NULL,
  montant NUMERIC(12,2) NOT NULL,
  description TEXT,
  statut devis_status DEFAULT 'en_attente',
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intervenants sinistres
CREATE TABLE sinistre_intervenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sinistre_id UUID NOT NULL REFERENCES sinistres(id) ON DELETE CASCADE,
  nom VARCHAR(255) NOT NULL,
  role VARCHAR(100), -- ex: "Expert assurance", "Plombier", etc.
  telephone VARCHAR(20),
  email VARCHAR(255),
  entreprise VARCHAR(255),
  notes TEXT
);

-- Ajouter FK sinistre_id dans documents
ALTER TABLE documents ADD CONSTRAINT documents_sinistre_id_fkey
  FOREIGN KEY (sinistre_id) REFERENCES sinistres(id) ON DELETE SET NULL;

-- ───────────────────────────────────────────────────────────────
-- ASSEMBLÉES GÉNÉRALES
-- ───────────────────────────────────────────────────────────────

CREATE TABLE assemblees_generales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  copropriete_id UUID NOT NULL REFERENCES coproprietes(id) ON DELETE CASCADE,
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  gestionnaire_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Informations
  titre VARCHAR(255) NOT NULL,
  type ag_type DEFAULT 'ordinaire',
  status ag_status DEFAULT 'planifiee',

  -- Date et lieu
  date_ag TIMESTAMPTZ NOT NULL,
  lieu TEXT,
  lien_visio TEXT,
  est_visio BOOLEAN DEFAULT FALSE,

  -- Quorum
  tantiemes_presents INTEGER DEFAULT 0,
  tantiemes_requis INTEGER, -- calculé selon type

  -- Dates importantes
  date_limite_vote TIMESTAMPTZ,
  convocations_envoyees_at TIMESTAMPTZ,

  -- Document PV généré
  pv_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Résolutions AG
CREATE TABLE ag_resolutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ag_id UUID NOT NULL REFERENCES assemblees_generales(id) ON DELETE CASCADE,
  ordre INTEGER NOT NULL,
  titre VARCHAR(255) NOT NULL,
  description TEXT,
  type_vote vote_type DEFAULT 'art_24',

  -- Résultats (calculés)
  voix_pour INTEGER DEFAULT 0,
  voix_contre INTEGER DEFAULT 0,
  voix_abstention INTEGER DEFAULT 0,
  tantiemes_pour INTEGER DEFAULT 0,
  tantiemes_contre INTEGER DEFAULT 0,
  adoptee BOOLEAN,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes
CREATE TABLE ag_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resolution_id UUID NOT NULL REFERENCES ag_resolutions(id) ON DELETE CASCADE,
  copropriétaire_id UUID NOT NULL REFERENCES copropriétaires(id) ON DELETE CASCADE,
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  valeur vote_value NOT NULL,
  tantiemes INTEGER NOT NULL,
  vote_a TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET, -- pour audit

  UNIQUE(resolution_id, lot_id)
);

-- Ajouter FK ag_id dans documents
ALTER TABLE documents ADD CONSTRAINT documents_ag_id_fkey
  FOREIGN KEY (ag_id) REFERENCES assemblees_generales(id) ON DELETE SET NULL;

-- ───────────────────────────────────────────────────────────────
-- RELANCES IMPAYÉS
-- ───────────────────────────────────────────────────────────────

CREATE TABLE relances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  copropriete_id UUID NOT NULL REFERENCES coproprietes(id) ON DELETE CASCADE,
  appel_charge_id UUID REFERENCES appels_charges(id) ON DELETE CASCADE,
  copropriétaire_id UUID REFERENCES copropriétaires(id) ON DELETE SET NULL,

  type relance_type NOT NULL,
  statut VARCHAR(20) DEFAULT 'envoye' CHECK (statut IN ('envoye', 'echec', 'manuel')),
  sujet VARCHAR(255),
  contenu TEXT,
  envoye_at TIMESTAMPTZ DEFAULT NOW(),
  envoye_par UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Paramètres de relance par copropriété
CREATE TABLE relance_parametres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  copropriete_id UUID NOT NULL REFERENCES coproprietes(id) ON DELETE CASCADE UNIQUE,

  -- Activation
  actif BOOLEAN DEFAULT TRUE,

  -- Délais (en jours après échéance)
  delai_premier_rappel INTEGER DEFAULT 30,
  delai_deuxieme_rappel INTEGER DEFAULT 60,
  delai_mise_en_demeure INTEGER DEFAULT 90,

  -- Canaux
  premier_rappel_email BOOLEAN DEFAULT TRUE,
  premier_rappel_sms BOOLEAN DEFAULT FALSE,
  deuxieme_rappel_email BOOLEAN DEFAULT TRUE,
  deuxieme_rappel_sms BOOLEAN DEFAULT TRUE,

  -- Messages personnalisés
  texte_premier_rappel TEXT,
  texte_deuxieme_rappel TEXT,
  texte_mise_en_demeure TEXT,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- MESSAGERIE (Syndic <-> Copropriétaire)
-- ───────────────────────────────────────────────────────────────

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  copropriete_id UUID REFERENCES coproprietes(id) ON DELETE SET NULL,
  copropriétaire_id UUID REFERENCES copropriétaires(id) ON DELETE CASCADE,
  gestionnaire_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sujet VARCHAR(255),
  derniere_activite TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  expediteur_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contenu TEXT NOT NULL,
  lu BOOLEAN DEFAULT FALSE,
  lu_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ───────────────────────────────────────────────────────────────

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cabinet_id UUID REFERENCES cabinets(id) ON DELETE CASCADE,

  type notification_type DEFAULT 'info',
  titre VARCHAR(255) NOT NULL,
  message TEXT,
  lien TEXT, -- URL vers la ressource concernée

  -- Références optionnelles
  copropriete_id UUID REFERENCES coproprietes(id) ON DELETE SET NULL,
  sinistre_id UUID REFERENCES sinistres(id) ON DELETE SET NULL,
  ag_id UUID REFERENCES assemblees_generales(id) ON DELETE SET NULL,

  lu BOOLEAN DEFAULT FALSE,
  lu_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- AGENDA (Événements)
-- ───────────────────────────────────────────────────────────────

CREATE TABLE evenements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  gestionnaire_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  copropriete_id UUID REFERENCES coproprietes(id) ON DELETE SET NULL,

  titre VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50), -- 'ag', 'visite', 'expertise', 'autre'
  date_debut TIMESTAMPTZ NOT NULL,
  date_fin TIMESTAMPTZ,
  lieu TEXT,
  rappel_avant INTEGER DEFAULT 24, -- heures avant

  -- Liens
  ag_id UUID REFERENCES assemblees_generales(id) ON DELETE SET NULL,
  sinistre_id UUID REFERENCES sinistres(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- FONCTIONS ET TRIGGERS
-- ───────────────────────────────────────────────────────────────

-- Fonction: mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur toutes les tables principales
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'cabinets', 'profiles', 'coproprietes', 'lots',
    'copropriétaires', 'appels_charges', 'documents',
    'sinistres', 'sinistre_devis', 'assemblees_generales'
  ]
  LOOP
    EXECUTE format('
      CREATE TRIGGER trigger_updated_at_%s
      BEFORE UPDATE ON %s
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    ', tbl, tbl);
  END LOOP;
END $$;

-- Fonction: générer référence sinistre automatique
CREATE OR REPLACE FUNCTION generate_sinistre_reference()
RETURNS TRIGGER AS $$
DECLARE
  year TEXT;
  seq INTEGER;
BEGIN
  year := EXTRACT(YEAR FROM NOW())::TEXT;
  SELECT COUNT(*) + 1 INTO seq
  FROM sinistres
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
    AND cabinet_id = NEW.cabinet_id;
  NEW.reference := 'SIN-' || year || '-' || LPAD(seq::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sinistre_reference
  BEFORE INSERT ON sinistres
  FOR EACH ROW
  WHEN (NEW.reference IS NULL)
  EXECUTE FUNCTION generate_sinistre_reference();

-- Fonction: mettre à jour les compteurs de copropriété
CREATE OR REPLACE FUNCTION update_copropriete_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'lots' THEN
    UPDATE coproprietes
    SET nb_lots = (SELECT COUNT(*) FROM lots WHERE copropriete_id = COALESCE(NEW.copropriete_id, OLD.copropriete_id))
    WHERE id = COALESCE(NEW.copropriete_id, OLD.copropriete_id);
  END IF;

  IF TG_TABLE_NAME = 'sinistres' THEN
    UPDATE coproprietes
    SET nb_sinistres_ouverts = (
      SELECT COUNT(*) FROM sinistres
      WHERE copropriete_id = COALESCE(NEW.copropriete_id, OLD.copropriete_id)
        AND status != 'cloture'
    )
    WHERE id = COALESCE(NEW.copropriete_id, OLD.copropriete_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lots_count
  AFTER INSERT OR UPDATE OR DELETE ON lots
  FOR EACH ROW EXECUTE FUNCTION update_copropriete_counts();

CREATE TRIGGER trigger_update_sinistres_count
  AFTER INSERT OR UPDATE OR DELETE ON sinistres
  FOR EACH ROW EXECUTE FUNCTION update_copropriete_counts();

-- Fonction: créer automatiquement un profil après inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'manager'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ───────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ───────────────────────────────────────────────────────────────

-- Activer RLS sur toutes les tables
ALTER TABLE cabinets ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coproprietes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE copropriétaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE copropriétaire_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appels_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sinistres ENABLE ROW LEVEL SECURITY;
ALTER TABLE sinistre_etapes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sinistre_devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE sinistre_intervenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE assemblees_generales ENABLE ROW LEVEL SECURITY;
ALTER TABLE ag_resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ag_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE relances ENABLE ROW LEVEL SECURITY;
ALTER TABLE relance_parametres ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE evenements ENABLE ROW LEVEL SECURITY;

-- Helper: récupérer le cabinet_id de l'utilisateur connecté
CREATE OR REPLACE FUNCTION get_user_cabinet_id()
RETURNS UUID AS $$
  SELECT cabinet_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper: récupérer le rôle de l'utilisateur connecté
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ── CABINETS ──
CREATE POLICY "cabinet_select_own" ON cabinets
  FOR SELECT USING (id = get_user_cabinet_id());

CREATE POLICY "cabinet_update_owner" ON cabinets
  FOR UPDATE USING (id = get_user_cabinet_id() AND get_user_role() = 'owner');

-- ── PROFILES ──
CREATE POLICY "profiles_select_same_cabinet" ON profiles
  FOR SELECT USING (
    id = auth.uid() OR cabinet_id = get_user_cabinet_id()
  );

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- ── COPROPRIÉTÉS ──
CREATE POLICY "coproprietes_select" ON coproprietes
  FOR SELECT USING (cabinet_id = get_user_cabinet_id());

CREATE POLICY "coproprietes_insert" ON coproprietes
  FOR INSERT WITH CHECK (cabinet_id = get_user_cabinet_id());

CREATE POLICY "coproprietes_update" ON coproprietes
  FOR UPDATE USING (cabinet_id = get_user_cabinet_id());

CREATE POLICY "coproprietes_delete" ON coproprietes
  FOR DELETE USING (cabinet_id = get_user_cabinet_id() AND get_user_role() = 'owner');

-- ── LOTS ──
CREATE POLICY "lots_select" ON lots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coproprietes c
      WHERE c.id = lots.copropriete_id AND (
        c.cabinet_id = get_user_cabinet_id()
        OR lots.id = (SELECT lot_id FROM profiles WHERE id = auth.uid())
      )
    )
  );

CREATE POLICY "lots_insert_update_delete" ON lots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM coproprietes c
      WHERE c.id = lots.copropriete_id AND c.cabinet_id = get_user_cabinet_id()
    )
  );

-- ── DOCUMENTS ──
CREATE POLICY "documents_select_cabinet" ON documents
  FOR SELECT USING (
    cabinet_id = get_user_cabinet_id()
    OR (
      visible_copropriétaires = TRUE
      AND EXISTS (
        SELECT 1 FROM copropriétaire_lots cl
        JOIN profiles p ON p.lot_id = cl.lot_id
        WHERE p.id = auth.uid() AND cl.lot_id = documents.lot_id
      )
    )
  );

CREATE POLICY "documents_insert" ON documents
  FOR INSERT WITH CHECK (cabinet_id = get_user_cabinet_id());

CREATE POLICY "documents_update_delete" ON documents
  FOR ALL USING (cabinet_id = get_user_cabinet_id());

-- ── SINISTRES ──
CREATE POLICY "sinistres_cabinet" ON sinistres
  FOR ALL USING (cabinet_id = get_user_cabinet_id());

CREATE POLICY "sinistres_copropriétaire" ON sinistres
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'owner_resident'
        AND p.lot_id = ANY(sinistres.lots_concernes)
    )
  );

-- ── ASSEMBLÉES GÉNÉRALES ──
CREATE POLICY "ag_cabinet" ON assemblees_generales
  FOR ALL USING (cabinet_id = get_user_cabinet_id());

CREATE POLICY "ag_copropriétaire_select" ON assemblees_generales
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN copropriétaire_lots cl ON cl.lot_id = p.lot_id
      JOIN copropriétaires c ON c.id = cl.copropriétaire_id
      WHERE p.id = auth.uid()
        AND assemblees_generales.copropriete_id = (
          SELECT copropriete_id FROM lots WHERE id = p.lot_id
        )
    )
  );

-- ── VOTES ──
CREATE POLICY "votes_insert_own" ON ag_votes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.lot_id = ag_votes.lot_id
    )
  );

CREATE POLICY "votes_select_cabinet" ON ag_votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ag_resolutions r
      JOIN assemblees_generales ag ON ag.id = r.ag_id
      WHERE r.id = ag_votes.resolution_id
        AND ag.cabinet_id = get_user_cabinet_id()
    )
  );

-- ── NOTIFICATIONS ──
CREATE POLICY "notifications_own" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- ── MESSAGES ──
CREATE POLICY "messages_own_conversation" ON messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (
          c.cabinet_id = get_user_cabinet_id()
          OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'owner_resident'
          )
        )
    )
  );

-- ── APPELS DE CHARGES ──
CREATE POLICY "appels_charges_cabinet" ON appels_charges
  FOR ALL USING (copropriete_id IN (
    SELECT id FROM coproprietes WHERE cabinet_id = get_user_cabinet_id()
  ));

CREATE POLICY "appels_charges_copropriétaire" ON appels_charges
  FOR SELECT USING (
    lot_id = (SELECT lot_id FROM profiles WHERE id = auth.uid())
  );

-- ── RELANCES ──
CREATE POLICY "relances_cabinet" ON relances
  FOR ALL USING (cabinet_id = get_user_cabinet_id());

-- ───────────────────────────────────────────────────────────────
-- INDEX POUR LES PERFORMANCES
-- ───────────────────────────────────────────────────────────────

CREATE INDEX idx_profiles_cabinet_id ON profiles(cabinet_id);
CREATE INDEX idx_profiles_lot_id ON profiles(lot_id);
CREATE INDEX idx_coproprietes_cabinet_id ON coproprietes(cabinet_id);
CREATE INDEX idx_lots_copropriete_id ON lots(copropriete_id);
CREATE INDEX idx_copropriétaires_cabinet_id ON copropriétaires(cabinet_id);
CREATE INDEX idx_appels_charges_lot_id ON appels_charges(lot_id);
CREATE INDEX idx_appels_charges_copropriete_id ON appels_charges(copropriete_id);
CREATE INDEX idx_appels_charges_paye ON appels_charges(paye);
CREATE INDEX idx_documents_copropriete_id ON documents(copropriete_id);
CREATE INDEX idx_documents_categorie ON documents(categorie);
CREATE INDEX idx_sinistres_copropriete_id ON sinistres(copropriete_id);
CREATE INDEX idx_sinistres_status ON sinistres(status);
CREATE INDEX idx_ag_copropriete_id ON assemblees_generales(copropriete_id);
CREATE INDEX idx_ag_status ON assemblees_generales(status);
CREATE INDEX idx_ag_date ON assemblees_generales(date_ag);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_lu ON notifications(lu);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);

-- Full-text search sur copropriétés
CREATE INDEX idx_coproprietes_search ON coproprietes USING gin(
  to_tsvector('french', nom || ' ' || COALESCE(ville, '') || ' ' || COALESCE(adresse, ''))
);

-- ───────────────────────────────────────────────────────────────
-- STORAGE BUCKETS (à créer dans le dashboard Supabase)
-- ───────────────────────────────────────────────────────────────
-- COMMANDES À EXÉCUTER DANS LA CONSOLE SUPABASE :
--
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('sinistres-photos', 'sinistres-photos', false);
--
-- Storage RLS:
-- CREATE POLICY "documents_authenticated" ON storage.objects FOR ALL
--   USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- ───────────────────────────────────────────────────────────────
-- DONNÉES DE TEST (seed)
-- ───────────────────────────────────────────────────────────────

-- À exécuter séparément dans supabase/seed.sql
