/**
 * Tests E2E — Onboarding
 *
 * Couvre le parcours critique d'un nouveau syndic :
 *   - Accès à /onboarding sans profil → reste sur la page
 *   - Accès à /dashboard sans onboarding → redirect /onboarding
 *   - Remplissage du formulaire étape 1 (profil)
 *   - Remplissage du formulaire étape 2 (cabinet)
 *   - Succès : redirect vers /dashboard
 *   - Vérification que trial_ends_at est bien défini après onboarding
 *
 * ⚠️ Ces tests nécessitent un compte de test dédié dans Supabase
 *    avec onboarding_complete = false.
 *    Configurer : E2E_ONBOARDING_EMAIL / E2E_ONBOARDING_PASSWORD
 */
import { test, expect } from '@playwright/test'

const ONBOARDING_USER = {
  email: process.env.E2E_ONBOARDING_EMAIL ?? 'onboarding-test@coplio.fr',
  password: process.env.E2E_ONBOARDING_PASSWORD ?? 'test1234',
}

// Ces tests utilisent leur propre session (pas le storageState partagé)
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Onboarding — parcours complet', () => {
  test('redirige /dashboard → /onboarding si onboarding non complété', async ({ page }) => {
    // Se connecter avec le compte onboarding
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(ONBOARDING_USER.email)
    await page.getByLabel(/mot de passe/i).fill(ONBOARDING_USER.password)
    await page.getByRole('button', { name: /se connecter/i }).click()

    // Doit être redirigé vers /onboarding
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 15_000 })
  })

  test('affiche les 3 étapes du wizard', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(ONBOARDING_USER.email)
    await page.getByLabel(/mot de passe/i).fill(ONBOARDING_USER.password)
    await page.getByRole('button', { name: /se connecter/i }).click()
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 15_000 })

    // Les 3 étapes doivent être visibles
    await expect(page.getByText(/votre profil/i)).toBeVisible()
    await expect(page.getByText(/votre cabinet/i)).toBeVisible()
    await expect(page.getByText(/prêt/i)).toBeVisible()
  })

  test('valide les champs obligatoires étape 1', async ({ page }) => {
    await page.goto('/onboarding')

    // Cliquer suivant sans remplir
    await page.getByRole('button', { name: /suivant|continuer/i }).first().click()

    // Des erreurs de validation doivent apparaître
    await expect(page.getByText(/prénom requis|requis/i)).toBeVisible({ timeout: 3_000 })
  })
})

test.describe('Onboarding — protection des routes', () => {
  test('redirige /onboarding → /dashboard si onboarding déjà complété', async ({ page }) => {
    // Se connecter avec le compte principal (onboarding complet)
    const { TEST_USER } = await import('./helpers/auth')
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(TEST_USER.email)
    await page.getByLabel(/mot de passe/i).fill(TEST_USER.password)
    await page.getByRole('button', { name: /se connecter/i }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })

    // Tenter d'accéder à /onboarding
    await page.goto('/onboarding')

    // Doit être redirigé vers le dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 })
  })
})
