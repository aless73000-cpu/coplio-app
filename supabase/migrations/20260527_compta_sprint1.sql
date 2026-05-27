-- ════════════════════════════════════════════════════════════════════
-- MIGRATION : Module Comptabilité — Sprint 1
-- Plan comptable syndic (Arrêté 14 mars 2005) + Écritures comptables
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. TABLE comptes_comptables ─────────────────────────────────
-- Plan comptable normalisé syndic (Arrêté 14 mars 2005)
-- Chaque cabinet peut surcharger avec des comptes personnalisés

CREATE TABLE IF NOT EXISTS comptes_comptables (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id      UUID        REFERENCES cabinets(id) ON DELETE CASCADE,
    -- NULL = compte du plan standard (partagé, lecture seule)
    -- NOT NULL = compte personnalisé du cabinet
  copropriete_id  UUID        REFERENCES coproprietes(id) ON DELETE CASCADE,
    -- NULL = commun à toutes les copropriétés du cabinet
  numero          TEXT        NOT NULL,
    -- Ex: '512100', '450100', '6020'
  libelle         TEXT        NOT NULL,
  classe          INTEGER     NOT NULL CHECK (classe BETWEEN 1 AND 9),
    -- 1=Capitaux 4=Tiers 5=Financiers 6=Charges 7=Produits
  type_compte     TEXT        NOT NULL DEFAULT 'detail'
    CHECK (type_compte IN ('titre', 'detail')),
    -- titre = compte de regroupement (non saisissable)
    -- detail = compte saisissable
  sens_normal     TEXT        NOT NULL DEFAULT 'debit'
    CHECK (sens_normal IN ('debit', 'credit')),
    -- Sens de solde normal (débit pour charges/actif, crédit pour produits/passif)
  actif           BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (cabinet_id, copropriete_id, numero)
);

ALTER TABLE comptes_comptables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comptes_comptables_read" ON comptes_comptables
  FOR SELECT USING (
    cabinet_id IS NULL  -- plan standard accessible à tous
    OR cabinet_id = get_user_cabinet_id()
  );

CREATE POLICY "comptes_comptables_write" ON comptes_comptables
  FOR ALL USING (cabinet_id = get_user_cabinet_id());

CREATE INDEX IF NOT EXISTS idx_comptes_numero
  ON comptes_comptables (numero);
CREATE INDEX IF NOT EXISTS idx_comptes_cabinet
  ON comptes_comptables (cabinet_id, numero);
CREATE INDEX IF NOT EXISTS idx_comptes_copropriete
  ON comptes_comptables (copropriete_id, numero);


-- ─── 2. TABLE journaux ────────────────────────────────────────────
-- Journaux comptables (achats, banque, OD, etc.)

CREATE TABLE IF NOT EXISTS journaux (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  copropriete_id  UUID        NOT NULL REFERENCES coproprietes(id) ON DELETE CASCADE,
  code            TEXT        NOT NULL,  -- 'ACH', 'BQ', 'OD', 'AN'
  libelle         TEXT        NOT NULL,  -- 'Achats', 'Banque', 'Opérations diverses'
  type_journal    TEXT        NOT NULL DEFAULT 'achats'
    CHECK (type_journal IN ('achats', 'banque', 'caisse', 'operations_diverses', 'a_nouveau')),
  compte_contrepartie TEXT,   -- Compte de contrepartie automatique (ex: 512 pour banque)
  actif           BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (copropriete_id, code)
);

ALTER TABLE journaux ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journaux_cabinet" ON journaux
  FOR ALL USING (
    copropriete_id IN (
      SELECT c.id FROM coproprietes c WHERE c.cabinet_id = get_user_cabinet_id()
    )
  );

CREATE INDEX IF NOT EXISTS idx_journaux_copropriete
  ON journaux (copropriete_id);


-- ─── 3. TABLE ecritures_comptables ───────────────────────────────
-- En-tête d'écriture (pièce comptable)

CREATE TABLE IF NOT EXISTS ecritures_comptables (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  copropriete_id  UUID        NOT NULL REFERENCES coproprietes(id) ON DELETE CASCADE,
  journal_id      UUID        NOT NULL REFERENCES journaux(id) ON DELETE RESTRICT,
  exercice_id     UUID        REFERENCES exercices(id) ON DELETE SET NULL,

  date_ecriture   DATE        NOT NULL,
  numero_piece    TEXT,         -- Numéro de pièce justificative (facture, etc.)
  libelle         TEXT        NOT NULL,
  reference       TEXT,         -- Référence libre (n° facture fournisseur, etc.)

  -- Lien optionnel avec autres entités
  facture_id      UUID,         -- Lien vers facture (Sprint 2)
  releve_id       UUID,         -- Lien vers relevé bancaire (Sprint 3)

  statut          TEXT        NOT NULL DEFAULT 'brouillon'
    CHECK (statut IN ('brouillon', 'valide', 'cloture')),
    -- brouillon = modifiable, valide = figé, cloture = exercice clôturé

  created_by      UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Contrôle d'équilibre : débit = crédit (vérifiée par trigger)
  CHECK (statut = 'brouillon' OR statut IN ('valide', 'cloture'))
);

ALTER TABLE ecritures_comptables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ecritures_cabinet" ON ecritures_comptables
  FOR ALL USING (
    copropriete_id IN (
      SELECT c.id FROM coproprietes c WHERE c.cabinet_id = get_user_cabinet_id()
    )
  );

CREATE TRIGGER trigger_updated_at_ecritures
  BEFORE UPDATE ON ecritures_comptables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_ecritures_copropriete
  ON ecritures_comptables (copropriete_id, date_ecriture DESC);
CREATE INDEX IF NOT EXISTS idx_ecritures_exercice
  ON ecritures_comptables (exercice_id);
CREATE INDEX IF NOT EXISTS idx_ecritures_statut
  ON ecritures_comptables (statut)
  WHERE statut = 'brouillon';
CREATE INDEX IF NOT EXISTS idx_ecritures_journal
  ON ecritures_comptables (journal_id, date_ecriture DESC);


-- ─── 4. TABLE lignes_ecriture ────────────────────────────────────
-- Lignes de l'écriture comptable (débit/crédit)

CREATE TABLE IF NOT EXISTS lignes_ecriture (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ecriture_id     UUID        NOT NULL REFERENCES ecritures_comptables(id) ON DELETE CASCADE,
  compte_id       UUID        NOT NULL REFERENCES comptes_comptables(id) ON DELETE RESTRICT,

  libelle         TEXT,         -- Libellé de la ligne (différent de l'écriture si besoin)
  debit           NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit          NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
  lettrage        TEXT,         -- Code de lettrage (rapprochement tiers)

  -- Tiers optionnel (copropriétaire ou fournisseur)
  coproprietaire_id UUID REFERENCES coproprietaires(id) ON DELETE SET NULL,
  lot_id          UUID REFERENCES lots(id) ON DELETE SET NULL,

  ordre           INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Une ligne ne peut pas être 0/0
  CHECK (debit > 0 OR credit > 0),
  -- Une ligne ne peut pas avoir débit ET crédit simultanément
  CHECK (NOT (debit > 0 AND credit > 0))
);

ALTER TABLE lignes_ecriture ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lignes_ecriture_cabinet" ON lignes_ecriture
  FOR ALL USING (
    ecriture_id IN (
      SELECT e.id FROM ecritures_comptables e
      JOIN coproprietes c ON c.id = e.copropriete_id
      WHERE c.cabinet_id = get_user_cabinet_id()
    )
  );

CREATE INDEX IF NOT EXISTS idx_lignes_ecriture_id
  ON lignes_ecriture (ecriture_id);
CREATE INDEX IF NOT EXISTS idx_lignes_compte
  ON lignes_ecriture (compte_id);
CREATE INDEX IF NOT EXISTS idx_lignes_lettrage
  ON lignes_ecriture (lettrage)
  WHERE lettrage IS NOT NULL;


-- ─── 5. TRIGGER vérification équilibre écriture ──────────────────
-- Vérifie que total débit = total crédit avant validation

CREATE OR REPLACE FUNCTION check_ecriture_equilibre()
RETURNS TRIGGER AS $$
DECLARE
  v_total_debit  NUMERIC;
  v_total_credit NUMERIC;
BEGIN
  -- Seulement lors de la validation (brouillon → valide)
  IF NEW.statut = 'valide' AND OLD.statut = 'brouillon' THEN
    SELECT
      COALESCE(SUM(debit), 0),
      COALESCE(SUM(credit), 0)
    INTO v_total_debit, v_total_credit
    FROM lignes_ecriture
    WHERE ecriture_id = NEW.id;

    IF v_total_debit = 0 AND v_total_credit = 0 THEN
      RAISE EXCEPTION 'Impossible de valider une écriture sans lignes.';
    END IF;

    IF ROUND(v_total_debit, 2) <> ROUND(v_total_credit, 2) THEN
      RAISE EXCEPTION
        'Écriture déséquilibrée : débit % ≠ crédit %.',
        v_total_debit, v_total_credit;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_equilibre
  BEFORE UPDATE ON ecritures_comptables
  FOR EACH ROW EXECUTE FUNCTION check_ecriture_equilibre();


-- ─── 6. TABLE fournisseurs ────────────────────────────────────────
-- Tiers fournisseurs (prestataires, artisans, etc.)

CREATE TABLE IF NOT EXISTS fournisseurs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id      UUID        NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,

  nom             TEXT        NOT NULL,
  siret           TEXT,
  tva_intra       TEXT,         -- Numéro TVA intracommunautaire
  email           TEXT,
  telephone       TEXT,
  adresse         TEXT,
  code_postal     TEXT,
  ville           TEXT,

  -- Compte comptable associé (40xxxx)
  compte_comptable TEXT        NOT NULL DEFAULT '401000',

  -- Conditions de paiement
  delai_paiement  INTEGER     NOT NULL DEFAULT 30, -- jours
  mode_paiement   TEXT        NOT NULL DEFAULT 'virement'
    CHECK (mode_paiement IN ('virement', 'cheque', 'prelevement', 'carte', 'especes')),

  actif           BOOLEAN     NOT NULL DEFAULT TRUE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fournisseurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fournisseurs_cabinet" ON fournisseurs
  FOR ALL USING (cabinet_id = get_user_cabinet_id());

CREATE TRIGGER trigger_updated_at_fournisseurs
  BEFORE UPDATE ON fournisseurs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_fournisseurs_cabinet
  ON fournisseurs (cabinet_id, nom);


-- ─── 7. VUE grand_livre ──────────────────────────────────────────
-- Grand livre : toutes les écritures par compte, avec solde cumulé

CREATE OR REPLACE VIEW v_grand_livre AS
SELECT
  le.id                       AS ligne_id,
  le.ecriture_id,
  e.copropriete_id,
  e.date_ecriture,
  e.numero_piece,
  e.libelle                   AS libelle_ecriture,
  le.libelle                  AS libelle_ligne,
  j.code                      AS journal_code,
  j.libelle                   AS journal_libelle,
  cc.numero                   AS compte_numero,
  cc.libelle                  AS compte_libelle,
  cc.classe,
  le.debit,
  le.credit,
  le.debit - le.credit        AS mouvement_net,
  le.lettrage,
  e.statut,
  e.exercice_id,
  ex.annee                    AS exercice_annee
FROM lignes_ecriture le
JOIN ecritures_comptables e  ON e.id  = le.ecriture_id
JOIN journaux j              ON j.id  = e.journal_id
JOIN comptes_comptables cc   ON cc.id = le.compte_id
LEFT JOIN exercices ex       ON ex.id = e.exercice_id
WHERE e.statut IN ('valide', 'cloture')
ORDER BY cc.numero, e.date_ecriture, le.ordre;

COMMENT ON VIEW v_grand_livre IS
  'Grand livre comptable — toutes les lignes validées par compte et par date.';


-- ─── 8. VUE balance_comptes ──────────────────────────────────────
-- Balance des comptes : solde par compte sur un exercice

CREATE OR REPLACE VIEW v_balance_comptes AS
SELECT
  e.copropriete_id,
  e.exercice_id,
  ex.annee                    AS exercice_annee,
  cc.id                       AS compte_id,
  cc.numero                   AS compte_numero,
  cc.libelle                  AS compte_libelle,
  cc.classe,
  cc.sens_normal,
  COALESCE(SUM(le.debit),  0) AS total_debit,
  COALESCE(SUM(le.credit), 0) AS total_credit,
  COALESCE(SUM(le.debit),  0) - COALESCE(SUM(le.credit), 0) AS solde_debiteur,
  COALESCE(SUM(le.credit), 0) - COALESCE(SUM(le.debit),  0) AS solde_crediteur
FROM lignes_ecriture le
JOIN ecritures_comptables e ON e.id  = le.ecriture_id
JOIN comptes_comptables cc  ON cc.id = le.compte_id
LEFT JOIN exercices ex      ON ex.id = e.exercice_id
WHERE e.statut IN ('valide', 'cloture')
GROUP BY
  e.copropriete_id, e.exercice_id, ex.annee,
  cc.id, cc.numero, cc.libelle, cc.classe, cc.sens_normal;

COMMENT ON VIEW v_balance_comptes IS
  'Balance des comptes : total débit/crédit et solde par compte et exercice.';


-- ─── 9. SEED plan comptable standard syndic ──────────────────────
-- Arrêté du 14 mars 2005 — Plan comptable des syndicats de copropriétaires
-- cabinet_id NULL = plan standard (commun à tous)

INSERT INTO comptes_comptables (cabinet_id, copropriete_id, numero, libelle, classe, type_compte, sens_normal) VALUES

-- ── Classe 1 — Capitaux ──────────────────────────────────────────
(NULL, NULL, '10',      'Fonds propres et réserves',               1, 'titre',  'credit'),
(NULL, NULL, '102',     'Fonds de travaux',                        1, 'detail', 'credit'),
(NULL, NULL, '103',     'Avances et acomptes reçus',               1, 'detail', 'credit'),
(NULL, NULL, '105',     'Réserves',                                1, 'detail', 'credit'),
(NULL, NULL, '120',     'Résultat de l''exercice (excédent)',      1, 'detail', 'credit'),
(NULL, NULL, '129',     'Résultat de l''exercice (déficit)',       1, 'detail', 'debit'),

-- ── Classe 4 — Comptes de tiers ──────────────────────────────────
(NULL, NULL, '40',      'Fournisseurs',                            4, 'titre',  'credit'),
(NULL, NULL, '401',     'Fournisseurs — dettes',                   4, 'titre',  'credit'),
(NULL, NULL, '401000',  'Fournisseurs divers',                     4, 'detail', 'credit'),
(NULL, NULL, '408',     'Fournisseurs — factures non parvenues',   4, 'detail', 'credit'),
(NULL, NULL, '409',     'Fournisseurs débiteurs',                  4, 'detail', 'debit'),
(NULL, NULL, '42',      'Personnel',                               4, 'titre',  'credit'),
(NULL, NULL, '421',     'Personnel — rémunérations dues',          4, 'detail', 'credit'),
(NULL, NULL, '43',      'Sécurité sociale et organismes sociaux',  4, 'titre',  'credit'),
(NULL, NULL, '431',     'Sécurité sociale',                        4, 'detail', 'credit'),
(NULL, NULL, '44',      'État et collectivités',                   4, 'titre',  'credit'),
(NULL, NULL, '445',     'TVA',                                     4, 'titre',  'credit'),
(NULL, NULL, '4452',    'TVA due intracommunautaire',               4, 'detail', 'credit'),
(NULL, NULL, '4456',    'TVA déductible',                          4, 'detail', 'debit'),
(NULL, NULL, '4457',    'TVA collectée',                           4, 'detail', 'credit'),
(NULL, NULL, '45',      'Copropriétaires',                         4, 'titre',  'credit'),
(NULL, NULL, '450',     'Copropriétaires — charges courantes',     4, 'titre',  'credit'),
(NULL, NULL, '450100',  'Appels de provisions — charges générales',4, 'detail', 'credit'),
(NULL, NULL, '450200',  'Appels de provisions — charges spéciales',4, 'detail', 'credit'),
(NULL, NULL, '4503',    'Copropriétaires — fonds de travaux',      4, 'detail', 'credit'),
(NULL, NULL, '4504',    'Copropriétaires — avances',               4, 'detail', 'credit'),
(NULL, NULL, '4508',    'Provisions appelées non encore dues',     4, 'detail', 'credit'),
(NULL, NULL, '4509',    'Copropriétaires débiteurs — impayés',     4, 'detail', 'debit'),
(NULL, NULL, '46',      'Débiteurs et créditeurs divers',          4, 'titre',  'credit'),
(NULL, NULL, '467',     'Autres comptes débiteurs ou créditeurs',  4, 'detail', 'credit'),
(NULL, NULL, '48',      'Comptes de régularisation',               4, 'titre',  'credit'),
(NULL, NULL, '486',     'Charges constatées d''avance',            4, 'detail', 'debit'),
(NULL, NULL, '487',     'Produits constatés d''avance',            4, 'detail', 'credit'),

-- ── Classe 5 — Comptes financiers ────────────────────────────────
(NULL, NULL, '51',      'Banques',                                 5, 'titre',  'debit'),
(NULL, NULL, '512',     'Banque — compte courant',                 5, 'titre',  'debit'),
(NULL, NULL, '512100',  'Banque — compte courant opérations',      5, 'detail', 'debit'),
(NULL, NULL, '512200',  'Banque — compte séparé fonds travaux',    5, 'detail', 'debit'),
(NULL, NULL, '514',     'Chèques postaux (CCP)',                   5, 'detail', 'debit'),
(NULL, NULL, '530',     'Caisse',                                  5, 'detail', 'debit'),

-- ── Classe 6 — Charges ───────────────────────────────────────────
(NULL, NULL, '60',      'Achats',                                  6, 'titre',  'debit'),
(NULL, NULL, '602',     'Achats stockés — autres approvisionnements',6,'detail','debit'),
(NULL, NULL, '6020',    'Fournitures d''entretien et de bureau',   6, 'detail', 'debit'),
(NULL, NULL, '61',      'Services extérieurs',                     6, 'titre',  'debit'),
(NULL, NULL, '611',     'Sous-traitance générale',                 6, 'detail', 'debit'),
(NULL, NULL, '6122',    'Locations immobilières',                  6, 'detail', 'debit'),
(NULL, NULL, '6135',    'Locations mobilières',                    6, 'detail', 'debit'),
(NULL, NULL, '614',     'Charges locatives et copropriétés',       6, 'detail', 'debit'),
(NULL, NULL, '615',     'Entretien et réparations',                6, 'titre',  'debit'),
(NULL, NULL, '6151',    'Entretien et réparations — immobilier',   6, 'detail', 'debit'),
(NULL, NULL, '6155',    'Entretien et réparations — équipements',  6, 'detail', 'debit'),
(NULL, NULL, '616',     'Primes d''assurance',                     6, 'detail', 'debit'),
(NULL, NULL, '617',     'Études et recherches',                    6, 'detail', 'debit'),
(NULL, NULL, '618',     'Divers',                                  6, 'detail', 'debit'),
(NULL, NULL, '62',      'Autres services extérieurs',              6, 'titre',  'debit'),
(NULL, NULL, '621',     'Personnel extérieur',                     6, 'detail', 'debit'),
(NULL, NULL, '622',     'Rémunérations d''intermédiaires',         6, 'detail', 'debit'),
(NULL, NULL, '6222',    'Honoraires syndic',                       6, 'detail', 'debit'),
(NULL, NULL, '623',     'Publicité, publications, catalogues',     6, 'detail', 'debit'),
(NULL, NULL, '625',     'Déplacements, missions, réceptions',      6, 'detail', 'debit'),
(NULL, NULL, '626',     'Frais postaux et télécommunications',     6, 'detail', 'debit'),
(NULL, NULL, '627',     'Services bancaires et assimilés',         6, 'detail', 'debit'),
(NULL, NULL, '63',      'Impôts, taxes et versements assimilés',   6, 'titre',  'debit'),
(NULL, NULL, '635',     'Autres impôts, taxes',                    6, 'detail', 'debit'),
(NULL, NULL, '6351',    'Taxes foncières',                         6, 'detail', 'debit'),
(NULL, NULL, '64',      'Charges de personnel',                    6, 'titre',  'debit'),
(NULL, NULL, '641',     'Rémunérations du personnel',              6, 'detail', 'debit'),
(NULL, NULL, '645',     'Charges de sécurité sociale',             6, 'detail', 'debit'),
(NULL, NULL, '65',      'Autres charges de gestion',               6, 'titre',  'debit'),
(NULL, NULL, '651',     'Redevances pour concessions',             6, 'detail', 'debit'),
(NULL, NULL, '654',     'Pertes sur créances irrécouvrables',      6, 'detail', 'debit'),
(NULL, NULL, '66',      'Charges financières',                     6, 'titre',  'debit'),
(NULL, NULL, '661',     'Charges d''intérêts',                     6, 'detail', 'debit'),
(NULL, NULL, '668',     'Autres charges financières',              6, 'detail', 'debit'),

-- ── Classe 7 — Produits ──────────────────────────────────────────
(NULL, NULL, '70',      'Ventes et produits des services',         7, 'titre',  'credit'),
(NULL, NULL, '702',     'Appels de charges générales',             7, 'detail', 'credit'),
(NULL, NULL, '7020',    'Provisions sur charges générales',        7, 'detail', 'credit'),
(NULL, NULL, '703',     'Appels fonds de travaux',                 7, 'detail', 'credit'),
(NULL, NULL, '704',     'Appels de charges spéciales',             7, 'detail', 'credit'),
(NULL, NULL, '706',     'Intérêts sur fonds placés',               7, 'detail', 'credit'),
(NULL, NULL, '708',     'Autres produits de gestion',              7, 'detail', 'credit'),
(NULL, NULL, '74',      'Subventions d''exploitation',             7, 'detail', 'credit'),
(NULL, NULL, '75',      'Autres produits de gestion courante',     7, 'titre',  'credit'),
(NULL, NULL, '756',     'Cotisations',                             7, 'detail', 'credit'),
(NULL, NULL, '758',     'Produits divers',                         7, 'detail', 'credit'),
(NULL, NULL, '76',      'Produits financiers',                     7, 'titre',  'credit'),
(NULL, NULL, '764',     'Revenus des valeurs mobilières',          7, 'detail', 'credit'),
(NULL, NULL, '768',     'Autres produits financiers',              7, 'detail', 'credit')

ON CONFLICT (cabinet_id, copropriete_id, numero) DO NOTHING;
