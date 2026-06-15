# Tests E2E (Playwright)

Tous les tests end-to-end vivent ici (`tests/e2e/`, c'est le `testDir` de
`playwright.config.ts`). Le dossier `e2e/` historique a été fusionné ici.

## Structure

| Fichier | Couvre |
|---|---|
| `auth.setup.ts` | Projet `setup` : connecte un syndic et sauvegarde la session dans `tests/e2e/.auth/user.json` |
| `helpers/auth.ts` | `loginAsSyndic` / `loginAsPortail` / `logout` + identifiants de test |
| `auth.spec.ts` | Connexion syndic/portail, erreurs, redirections, pages publiques |
| `syndic.spec.ts` | Pages de l'espace syndic |
| `portail.spec.ts` | Espace copropriétaire |
| `locataire.spec.ts` | Espace locataire (allégé) |
| `facturation.spec.ts` · `paiement.spec.ts` | Plans, abonnement, checkout/portal Stripe |
| `onboarding.spec.ts` | Parcours d'onboarding + protection des routes |
| `vote-ag.spec.ts` | Assemblées générales, résolutions, votes |

Deux stratégies d'authentification coexistent :
- **Auto-login** en `beforeEach` (auth/syndic/portail/locataire) via `helpers/auth`.
- **Session du setup** : les specs qui en ont besoin déclarent
  `test.use({ storageState: STORAGE_STATE })` ; les blocs publics surchargent
  avec `test.use({ storageState: { cookies: [], origins: [] } })`.

## Lancer en local

1. `cp .env.test.local.example .env.test.local` puis renseigner les comptes de test.
2. `npm run test:e2e` (Playwright lance `npm run dev` automatiquement en local).
   - UI : `npm run test:e2e:ui` · debug : `npm run test:e2e:debug` · rapport : `npm run test:e2e:report`

> Sans identifiants valides, le projet `setup` échoue et les tests dépendants
> sont ignorés — c'est attendu.

## En CI

Le workflow `.github/workflows/e2e.yml` est **gardé** : il ne tourne que si la
variable de dépôt `RUN_E2E == 'true'`. Il faut aussi définir les secrets
`E2E_BASE_URL` (app déployée) et `TEST_*` (comptes de test). Tant que `RUN_E2E`
n'est pas défini, le workflow est un no-op et ne bloque aucune PR.

Le pipeline principal (`ci.yml` : lint · types · tests unitaires · build) ne
lance pas les E2E — ils restent optionnels et isolés.
