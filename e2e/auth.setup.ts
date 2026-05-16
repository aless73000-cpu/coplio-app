/**
 * Auth Setup — Playwright
 *
 * Ce fichier s'exécute une seule fois avant les tests.
 * Il crée un fichier de session réutilisable (e2e/.auth/user.json)
 * pour éviter de se reconnecter à chaque spec.
 */
import { test as setup, expect } from '@playwright/test'
import { STORAGE_STATE } from '../playwright.config'
import { TEST_USER } from './helpers/auth'

setup('authenticate as syndic', async ({ page }) => {
  await page.goto('/login')

  // Remplir le formulaire
  await page.getByLabel(/email/i).fill(TEST_USER.email)
  await page.getByLabel(/mot de passe/i).fill(TEST_USER.password)
  await page.getByRole('button', { name: /se connecter/i }).click()

  // Attendre la redirection vers le dashboard
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })

  // Sauvegarder la session
  await page.context().storageState({ path: STORAGE_STATE })
})
