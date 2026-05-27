# SQL_A_APPLIQUER — Archive documentaire

> ⚠️ **Ces fichiers sont des copies de travail.** Les migrations sont déjà dans `supabase/migrations/` et sont gérées par l'outil `/admin/migrations`.
> **Il n'y a rien à appliquer manuellement depuis ce dossier.**

---

## Correspondance avec supabase/migrations/

| Fichier ici | Migration dans supabase/migrations/ | Statut |
|---|---|---|
| `01_sprint1_structure_db.sql` | `20260526_compliance_sprint1.sql` | ✅ Dans la liste des migrations |
| `02_sprint2_moteur_vote_ag.sql` | `20260527_compliance_sprint2.sql` | ✅ Dans la liste des migrations |
| `03_sprint3_regularisation_charges.sql` | `20260527_compliance_sprint3.sql` | ✅ Dans la liste des migrations |
| `04_sprint4_fonds_travaux_alur.sql` | `20260527_compliance_sprint4.sql` | ✅ Dans la liste des migrations |
| `05_migration_donnees_fonds_travaux.sql` | `20260528_fonds_travaux_data_migration.sql` | ✅ Dans la liste des migrations |

## Comment appliquer les migrations en production

→ Aller sur **coplio.fr/admin/migrations** et cliquer **Lancer**.

L'outil vérifie automatiquement quelles migrations n'ont pas encore été appliquées et les exécute dans l'ordre.

---

## Note sur le script 05

Le script `05_migration_donnees_fonds_travaux.sql` redistribue les fonds de travaux
existants (niveau copropriété) en données par lot (ALUR art. 14-2).

- Pour les nouvelles installations : **no-op** (aucune donnée à migrer, ON CONFLICT DO NOTHING protège tout)
- Pour les cabinets existants avec des fonds de travaux : lire les instructions
  en tête du fichier `supabase/migrations/20260528_fonds_travaux_data_migration.sql`
  avant exécution (prévisualisation + backup recommandé)
