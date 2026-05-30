/**
 * Tests E2E — Espace Syndic (pages principales)
 * Nécessite une session syndic active.
 */

import { test, expect, type Page } from '@playwright/test'

const SYNDIC_EMAIL    = process.env.TEST_SYNDIC_EMAIL    ?? 'test.phase3.coplio@mailinator.com'
const SYNDIC_PASSWORD = process.env.TEST_SYNDIC_PASSWORD ?? 'TestCoplio2026!'

async function loginSyndic(page: Page) {
  await page.goto('/login')
  await page.getByPlaceholder('vous@cabinet.fr').fill(SYNDIC_EMAIL)
  await page.locator('input[type="password"]').fill(SYNDIC_PASSWORD)
  await page.getByRole('button', { name: /Se connecter/ }).click()
  await page.waitForURL('**/dashboard', { timeout: 10000 })
}

test.describe('Pages syndic', () => {
  test.beforeEach(async ({ page }) => {
    await loginSyndic(page)
  })

  test('/dashboard se charge correctement', async ({ page }) => {
    await expect(page.getByText(/Bonjour/)).toBeVisible()
    // Sidebar visible
    await expect(page.getByRole('link', { name: /Tableau de bord/i }).first()).toBeVisible()
  })

  test('/coproprietes se charge et liste les copropriétés', async ({ page }) => {
    await page.goto('/coproprietes')
    await expect(page).toHaveTitle(/Copropriétés/)
    await expect(page.getByText(/Résidence Les Oliviers/i)).toBeVisible({ timeout: 8000 })
  })

  test('/prestataires affiche la liste', async ({ page }) => {
    await page.goto('/prestataires')
    await expect(page).toHaveTitle(/Prestataires/)
    await expect(page.getByText(/Plomberie Dupont|Électricité Bernard/i)).toBeVisible({ timeout: 8000 })
  })

  test('/documents affiche les documents', async ({ page }) => {
    await page.goto('/documents')
    await expect(page).toHaveTitle(/Documents/)
    await expect(page.getByText(/Règlement de copropriété/i)).toBeVisible({ timeout: 8000 })
  })

  test('/sinistres se charge', async ({ page }) => {
    await page.goto('/sinistres')
    await expect(page).toHaveTitle(/Sinistres/)
  })

  test('/impayes se charge', async ({ page }) => {
    await page.goto('/impayes')
    await expect(page).toHaveTitle(/Impayés/)
  })

  test('/messages se charge', async ({ page }) => {
    await page.goto('/messages')
    await expect(page).toHaveTitle(/Messages/)
  })

  test('/assemblees se charge', async ({ page }) => {
    await page.goto('/assemblees')
    await expect(page).toHaveTitle(/Assemblées/)
  })

  test('/comptabilite affiche les modules', async ({ page }) => {
    await page.goto('/comptabilite')
    await expect(page).toHaveTitle(/Comptabilité/)
    await expect(page.getByText(/Plan comptable|Saisie écritures|Grand livre/i)).toBeVisible({ timeout: 8000 })
  })

  test('/agenda se charge', async ({ page }) => {
    await page.goto('/agenda')
    await expect(page).toHaveTitle(/Agenda/)
  })

  test('/relances-config affiche le sélecteur de copropriété', async ({ page }) => {
    await page.goto('/relances-config')
    await expect(page).toHaveTitle(/Relances/)
    // Le sélecteur doit charger les copropriétés
    await expect(page.getByRole('combobox')).toBeVisible({ timeout: 8000 })
    await expect(page.getByText(/Résidence Les Oliviers/i)).toBeVisible({ timeout: 8000 })
  })

  test('/notifications se charge', async ({ page }) => {
    await page.goto('/notifications')
    await expect(page).toHaveTitle(/Notifications/)
  })

  test('/parametres affiche le formulaire profil', async ({ page }) => {
    await page.goto('/parametres')
    await expect(page).toHaveTitle(/Paramètres/)
    await expect(page.locator('input[name="prenom"], input[name="nom"]').first()).toBeVisible({ timeout: 8000 })
  })

  test('/facturation affiche le plan actuel', async ({ page }) => {
    await page.goto('/facturation')
    await expect(page).toHaveTitle(/Facturation/)
    await expect(page.getByText(/Essai|Starter|Pro|Expert/i)).toBeVisible({ timeout: 8000 })
  })
})
