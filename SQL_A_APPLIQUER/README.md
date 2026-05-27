# SQL à appliquer — Conformité législative Coplio

## Comment appliquer les migrations

1. Ouvrir **Supabase Dashboard** → projet Coplio → **SQL Editor**
2. Appliquer les fichiers dans l'**ordre numéroté ci-dessous** (sprint par sprint)
3. Vérifier que chaque script se termine sans erreur avant de passer au suivant
4. Une fois tous les scripts appliqués, les migrations Supabase locales (`supabase/migrations/`) sont déjà à jour

---

## Ordre d'application

| # | Fichier | Loi | Description |
|---|---------|-----|-------------|
| 1 | `01_sprint1_structure_db.sql` | Loi 1965, Décret 1967 | Structure de base : historique lots, contrainte votes, clé répartition, pouvoirs AG |
| 2 | `02_sprint2_moteur_vote_ag.sql` | Art. 24/25/25-1/26 | Vote AG : colonnes résultat MajorityEngine, vue v_resultats_ag |
| 3 | `03_sprint3_regularisation_charges.sql` | Art. 14-1, Décret art. 10 | Tables exercices + régularisations, vue v_regularisations_soldes |
| 4 | `04_sprint4_fonds_travaux_alur.sql` | ALUR 2014, art. 14-2 | Fonds de travaux par lot, transfert mutation, vue v_fonds_travaux_par_lot |

---

## ⚠️ Migration des données existantes (Sprint 4)

Après application du Sprint 4, les `fonds_travaux` existants ont `lot_id = NULL` (ils étaient gérés au niveau de la copropriété). Vous devez les redistribuer par lot selon les tantièmes.

Un script de migration des données est fourni : `05_migration_donnees_fonds_travaux.sql`

**Ce script ne doit pas être appliqué automatiquement** — vérifiez les montants avant de l'exécuter.

---

## Résumé des changements par sprint

### Sprint 1 — Structure DB (`01_sprint1_structure_db.sql`)
- **`coproprietaire_lots`** : ajout `date_fin`, `motif_fin`, `notes` → historique des mutations
- **`ag_votes`** : contrainte UNIQUE sur `(resolution_id, coproprietaire_id)` au lieu de `(resolution_id, lot_id)` → Art. 22 : 1 copropriétaire = 1 vote
- **`budget_lignes`** : ajout `cle_repartition` → clé de répartition légale (tantièmes généraux, ascenseur, etc.)
- **Nouvelle table `pouvoirs`** : mandats AG avec trigger limite 3 mandats/mandataire (Art. 22 al. 2)
- **Nouvelle vue `v_lots_actifs`** : lots dont `date_fin IS NULL` (propriétaires actifs)

### Sprint 2 — Moteur de vote AG (`02_sprint2_moteur_vote_ag.sql`)
- **`ag_resolutions`** : ajout `vote_raison` (explication textuelle) + `passerelle_25_1` (flag Art. 25-1)
- **Nouvelle vue `v_resultats_ag`** : consolidation des résultats pour PV et tableau de bord

### Sprint 3 — Régularisation des charges (`03_sprint3_regularisation_charges.sql`)
- **Nouvelle table `exercices`** : exercice comptable annuel par copropriété (statut `en_cours`/`cloture`)
- **Nouvelle table `regularisations`** : résultats de régularisation par lot et exercice
  - `solde = montant_provisionnel - montant_reel` (positif = trop-perçu, négatif = complément dû)
  - Prorata pour les mutations en cours d'exercice
- **Nouvelle vue `v_regularisations_soldes`** : tableau de bord financier avec interprétation (`trop_percu`/`complement`/`equilibre`)

### Sprint 4 — Fonds de travaux ALUR (`04_sprint4_fonds_travaux_alur.sql`)
- **`fonds_travaux`** : ajout `lot_id` (ventilation par lot, ALUR art. 14-2) + `vendeur_historique` JSONB
- **Contrainte UNIQUE** `(lot_id, annee)` pour les nouveaux enregistrements avec `lot_id` renseigné
- **`fonds_travaux_mouvements`** : ajout du type `transfert_mutation` au CHECK constraint
- **Nouvelle vue `v_fonds_travaux_par_lot`** : suivi par lot avec propriétaire actuel

---

## APIs créées (à tester après application des migrations)

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET/POST` | `/api/assemblees/[id]/pouvoirs` | Mandats AG (Art. 22) |
| `DELETE` | `/api/assemblees/[id]/pouvoirs/[pouvoir_id]` | Révoquer un mandat |
| `POST` | `/api/assemblees/[id]/resolutions/[resolution_id]/resultat` | Recalculer résultat vote |
| `GET/POST` | `/api/exercices` | Exercices comptables |
| `POST` | `/api/exercices/[id]/cloture` | Clôturer un exercice et calculer régularisations |
| `POST` | `/api/lots/[id]/cession` | Enregistrer une mutation (vente) de lot |
