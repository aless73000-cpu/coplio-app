-- ═══════════════════════════════════════════════════════════════
-- INDEXES PERFORMANCE — Coplio
-- Basé sur l'analyse de 247 opérations de requête sur 30 tables
-- À exécuter dans Supabase Dashboard → SQL Editor
--
-- Colonnes les plus filtrées (hors PK qui sont déjà indexées) :
--   cabinet_id (68x), copropriete_id (48x), created_at (32x),
--   lot_id (13x), coproprietaire_id (10x), date_echeance (12x),
--   role (8x), paye (8x), date_ag (14x), status/statut (9x)
-- ═══════════════════════════════════════════════════════════════


-- ── PHASE 1 : Indexes simples sur FK et colonnes très filtrées ──

-- profiles (91 requêtes — table la plus sollicitée)
CREATE INDEX IF NOT EXISTS idx_profiles_cabinet_id         ON profiles(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_profiles_lot_id             ON profiles(lot_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role               ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email              ON profiles(email);

-- cabinets (23 requêtes, 0 index hors PK)
CREATE INDEX IF NOT EXISTS idx_cabinets_stripe_customer_id ON cabinets(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_cabinets_plan               ON cabinets(plan);
CREATE INDEX IF NOT EXISTS idx_cabinets_subscription_status ON cabinets(subscription_status);

-- coproprietes (16 requêtes)
CREATE INDEX IF NOT EXISTS idx_coproprietes_cabinet_id     ON coproprietes(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_coproprietes_statut         ON coproprietes(statut);
CREATE INDEX IF NOT EXISTS idx_coproprietes_gestionnaire_id ON coproprietes(gestionnaire_id);

-- lots (17 requêtes)
CREATE INDEX IF NOT EXISTS idx_lots_copropriete_id         ON lots(copropriete_id);

-- coproprietaires (16 requêtes)
CREATE INDEX IF NOT EXISTS idx_coproprietaires_cabinet_id  ON coproprietaires(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_coproprietaires_profile_id  ON coproprietaires(profile_id);
CREATE INDEX IF NOT EXISTS idx_coproprietaires_portail_actif ON coproprietaires(portail_actif);

-- coproprietaire_lots (pivot table — filtrée dans les 2 sens)
CREATE INDEX IF NOT EXISTS idx_coproprietaire_lots_copro_id ON coproprietaire_lots(coproprietaire_id);
CREATE INDEX IF NOT EXISTS idx_coproprietaire_lots_lot_id   ON coproprietaire_lots(lot_id);

-- appels_charges (14 requêtes, colonnes de filtrage critiques)
CREATE INDEX IF NOT EXISTS idx_appels_charges_copropriete_id ON appels_charges(copropriete_id);
CREATE INDEX IF NOT EXISTS idx_appels_charges_lot_id         ON appels_charges(lot_id);
CREATE INDEX IF NOT EXISTS idx_appels_charges_coproprietaire_id ON appels_charges(coproprietaire_id);
CREATE INDEX IF NOT EXISTS idx_appels_charges_paye           ON appels_charges(paye);
CREATE INDEX IF NOT EXISTS idx_appels_charges_date_echeance  ON appels_charges(date_echeance);

-- sinistres
CREATE INDEX IF NOT EXISTS idx_sinistres_cabinet_id        ON sinistres(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_sinistres_copropriete_id    ON sinistres(copropriete_id);
CREATE INDEX IF NOT EXISTS idx_sinistres_gestionnaire_id   ON sinistres(gestionnaire_id);
CREATE INDEX IF NOT EXISTS idx_sinistres_status            ON sinistres(status);

-- assemblees_generales (date_ag très filtrée : .gte, .lte, .order)
CREATE INDEX IF NOT EXISTS idx_ag_cabinet_id               ON assemblees_generales(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_ag_copropriete_id           ON assemblees_generales(copropriete_id);
CREATE INDEX IF NOT EXISTS idx_ag_date_ag                  ON assemblees_generales(date_ag);
CREATE INDEX IF NOT EXISTS idx_ag_status                   ON assemblees_generales(status);

-- ag_resolutions
CREATE INDEX IF NOT EXISTS idx_ag_resolutions_ag_id        ON ag_resolutions(ag_id);

-- ag_votes
CREATE INDEX IF NOT EXISTS idx_ag_votes_resolution_id      ON ag_votes(resolution_id);
CREATE INDEX IF NOT EXISTS idx_ag_votes_coproprietaire_id  ON ag_votes(coproprietaire_id);
CREATE INDEX IF NOT EXISTS idx_ag_votes_lot_id             ON ag_votes(lot_id);

-- votes (module votes copropriétaires)
CREATE INDEX IF NOT EXISTS idx_votes_copropriete_id        ON votes(copropriete_id);
CREATE INDEX IF NOT EXISTS idx_votes_statut                ON votes(statut);

-- vote_reponses
CREATE INDEX IF NOT EXISTS idx_vote_reponses_vote_id       ON vote_reponses(vote_id);
CREATE INDEX IF NOT EXISTS idx_vote_reponses_copro_id      ON vote_reponses(coproprietaire_id);

-- vote_options
CREATE INDEX IF NOT EXISTS idx_vote_options_vote_id        ON vote_options(vote_id);

-- conversations
CREATE INDEX IF NOT EXISTS idx_conversations_cabinet_id    ON conversations(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_conversations_copro_id      ON conversations(coproprietaire_id);
CREATE INDEX IF NOT EXISTS idx_conversations_activite      ON conversations(derniere_activite DESC);

-- messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id    ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_expediteur_id      ON messages(expediteur_id);
CREATE INDEX IF NOT EXISTS idx_messages_lu                 ON messages(lu);

-- notifications (filtrées par user + statut lu)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id       ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_lu            ON notifications(lu);
CREATE INDEX IF NOT EXISTS idx_notifications_cabinet_id    ON notifications(cabinet_id);

-- documents
CREATE INDEX IF NOT EXISTS idx_documents_cabinet_id        ON documents(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_documents_copropriete_id    ON documents(copropriete_id);
CREATE INDEX IF NOT EXISTS idx_documents_lot_id            ON documents(lot_id);
CREATE INDEX IF NOT EXISTS idx_documents_visible           ON documents(visible_coproprietaires);
CREATE INDEX IF NOT EXISTS idx_documents_categorie         ON documents(categorie);

-- relances
CREATE INDEX IF NOT EXISTS idx_relances_cabinet_id         ON relances(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_relances_coproprietaire_id  ON relances(coproprietaire_id);

-- signatures
CREATE INDEX IF NOT EXISTS idx_signatures_cabinet_id       ON signatures(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_signatures_yousign_id       ON signatures(yousign_request_id);

-- sinistre_etapes / sinistre_devis
CREATE INDEX IF NOT EXISTS idx_sinistre_etapes_sinistre_id ON sinistre_etapes(sinistre_id);
CREATE INDEX IF NOT EXISTS idx_sinistre_devis_sinistre_id  ON sinistre_devis(sinistre_id);

-- travaux
CREATE INDEX IF NOT EXISTS idx_travaux_copropriete_id      ON travaux(copropriete_id);
CREATE INDEX IF NOT EXISTS idx_travaux_cabinet_id          ON travaux(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_travaux_statut              ON travaux(statut);

-- travaux_etapes
CREATE INDEX IF NOT EXISTS idx_travaux_etapes_travail_id   ON travaux_etapes(travail_id);

-- budgets / budget_lignes
CREATE INDEX IF NOT EXISTS idx_budgets_copropriete_id      ON budgets(copropriete_id);
CREATE INDEX IF NOT EXISTS idx_budget_lignes_budget_id     ON budget_lignes(budget_id);

-- fonds_travaux
CREATE INDEX IF NOT EXISTS idx_fonds_travaux_copropriete_id ON fonds_travaux(copropriete_id);
CREATE INDEX IF NOT EXISTS idx_fonds_travaux_mvts_fonds_id  ON fonds_travaux_mouvements(fonds_id);

-- obligations_legales
CREATE INDEX IF NOT EXISTS idx_obligations_copropriete_id  ON obligations_legales(copropriete_id);
CREATE INDEX IF NOT EXISTS idx_obligations_cabinet_id      ON obligations_legales(cabinet_id);

-- evenements_cabinet
CREATE INDEX IF NOT EXISTS idx_evenements_cabinet_id       ON evenements_cabinet(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_evenements_copropriete_id   ON evenements_cabinet(copropriete_id);
CREATE INDEX IF NOT EXISTS idx_evenements_date_debut       ON evenements_cabinet(date_debut);

-- archives
CREATE INDEX IF NOT EXISTS idx_archives_cabinet_id         ON archives(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_archives_copropriete_id     ON archives(copropriete_id);

-- prospects
CREATE INDEX IF NOT EXISTS idx_prospects_cabinet_id        ON prospects(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_prospects_statut            ON prospects(statut);

-- relance_parametres
CREATE INDEX IF NOT EXISTS idx_relance_parametres_copro_id ON relance_parametres(copropriete_id);

-- cles_acces
CREATE INDEX IF NOT EXISTS idx_cles_acces_copropriete_id   ON cles_acces(copropriete_id);

-- conseil_syndical
CREATE INDEX IF NOT EXISTS idx_conseil_syndical_copro_id   ON conseil_syndical(copropriete_id);

-- entretiens
CREATE INDEX IF NOT EXISTS idx_entretiens_cabinet_id       ON entretiens(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_entretiens_copropriete_id   ON entretiens(copropriete_id);


-- ── PHASE 2 : Indexes composites (filtres combinés fréquents) ───

-- profiles(cabinet_id, role) — utilisé pour lister les gestionnaires d'un cabinet
CREATE INDEX IF NOT EXISTS idx_profiles_cabinet_role
  ON profiles(cabinet_id, role);

-- appels_charges(copropriete_id, paye) — impayés par copropriété
CREATE INDEX IF NOT EXISTS idx_appels_charges_copro_paye
  ON appels_charges(copropriete_id, paye);

-- appels_charges(lot_id, paye) — impayés par lot
CREATE INDEX IF NOT EXISTS idx_appels_charges_lot_paye
  ON appels_charges(lot_id, paye);

-- appels_charges(copropriete_id, date_echeance) — requêtes de période
CREATE INDEX IF NOT EXISTS idx_appels_charges_copro_echeance
  ON appels_charges(copropriete_id, date_echeance);

-- notifications(user_id, lu) — notifications non lues
CREATE INDEX IF NOT EXISTS idx_notifications_user_lu
  ON notifications(user_id, lu);

-- sinistres(cabinet_id, status) — sinistres ouverts par cabinet
CREATE INDEX IF NOT EXISTS idx_sinistres_cabinet_status
  ON sinistres(cabinet_id, status);

-- assemblees_generales(cabinet_id, date_ag) — AG à venir par cabinet
CREATE INDEX IF NOT EXISTS idx_ag_cabinet_date
  ON assemblees_generales(cabinet_id, date_ag);

-- coproprietes(cabinet_id, statut) — tableau de bord statuts
CREATE INDEX IF NOT EXISTS idx_coproprietes_cabinet_statut
  ON coproprietes(cabinet_id, statut);

-- documents(cabinet_id, categorie) — filtrage par catégorie
CREATE INDEX IF NOT EXISTS idx_documents_cabinet_categorie
  ON documents(cabinet_id, categorie);

-- coproprietaire_lots(lot_id, coproprietaire_id) — pivot bidirectionnel
CREATE INDEX IF NOT EXISTS idx_copro_lots_pivot
  ON coproprietaire_lots(lot_id, coproprietaire_id);
