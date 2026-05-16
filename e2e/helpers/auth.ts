import { Page, expect } from '@playwright/test'

/**
 * Credentials de test — lus depuis les variables d'environnement
 * Configurer dans .env.test.local :
 *   E2E_EMAIL=test@coplio.fr
 *   E2E_PASSWORD=test1234
 *   E2E_PORTAIL_EMAIL=coproprietaire@test.fr
 *   E2E_PORTAIL_PASSWORD=test1234
 */
export const TEST_USER = {
  email: process.env.E2E_EMAIL ?? 'test@coplio.fr',
  password: process.env.E2E_PASSWORD ?? 'test1234',
}

export const TEST_PORTAIL_USER = {
  email: process.env.E2E_PORTAIL_EMAIL ?? 'portail@test.fr',
  password: process.env.E2E_PORTAIL_PASSWORD ?? 'test1234',
}

/**
 * Se connecte en tant que gestionnaire syndic
 */
export async function loginAsSyndic(page: Page) {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(TEST_USER.email)
  await page.getByLabel(/mot de passe/i).fill(TEST_USER.password)
  await page.getByRole('button', { name: /se connecter/i }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
}

/**
 * Se connecte en tant que copropriétaire (portail)
 */
export async function loginAsPortail(page: Page) {
  await page.goto('/portail')
  await page.getByLabel(/email/i).fill(TEST_PORTAIL_USER.email)
  await page.getByLabel(/mot de passe/i).fill(TEST_PORTAIL_USER.password)
  await page.getByRole('button', { name: /se connecter/i }).click()
  await expect(page).toHaveURL(/\/accueil/, { timeout: 15_000 })
}

/**
 * Se déconnecte
 */
export async function logout(page: Page) {
  await page.goto('/api/auth/signout')
}
