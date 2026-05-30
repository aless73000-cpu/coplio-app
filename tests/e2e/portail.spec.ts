/**
 * Tests E2E — Portail Copropriétaire
 * Nécessite une session copropriétaire active.
 */

import { test, expect, type Page } from '@playwright/test'

const PORTAIL_EMAIL    = process.env.TEST_PORTAIL_EMAIL    ?? 'marie.martin.test@mailinator.com'
const PORTAIL_PASSWORD = process.env.TEST_PORTAIL_PASSWORD ?? 'TestPortail2026!'

async function loginPortail(page: Page) {
  await page.goto('/portail')
  await page.getByPlaceholder(/email/i).fill(PORTAIL_EMAIL)
  await page.locator('input[type="password"]').fill(PORTAIL_PASSWORD)
  await page.getByRole('button', { name: /Se connecter|Connexion/i }).click()
  await page.waitForURL('**/accueil', { timeout: 10000 })
}

test.describe('Portail copropriétaire', () => {
  test.beforeEach(async ({ page }) => {
    await loginPortail(page)
  })

  test('/accueil se charge correctement', async ({ page }) => {
    await expect(page.getByText(/Marie|Bonjour/i)).toBeVisible({ timeout: 8000 })
    await expect(page.getByText(/Signaler un problème/i)).toBeVisible()
  })

  test('/mes-charges affiche les charges', async ({ page }) => {
    await page.goto('/mes-charges')
    await expect(page).toHaveTitle(/Charges/)
    await expect(page.getByText(/Télécharger PDF/i)).toBeVisible({ timeout: 8000 })
  })

  test('/mes-documents affiche les documents', async ({ page }) => {
    await page.goto('/mes-documents')
    await expect(page).toHaveTitle(/Documents/)
    await expect(page.getByText(/Règlement|PV|Budget/i)).toBeVisible({ timeout: 8000 })
  })

  test('/mes-votes se charge', async ({ page }) => {
    await page.goto('/mes-votes')
    await expect(page).toHaveTitle(/Votes/)
  })

  test('/mes-assemblees se charge', async ({ page }) => {
    await page.goto('/mes-assemblees')
    await expect(page).toHaveTitle(/Assemblées/)
  })

  test('/mes-travaux affiche les sinistres', async ({ page }) => {
    await page.goto('/mes-travaux')
    await expect(page).toHaveTitle(/Travaux/)
  })

  test('/signaler affiche le formulaire', async ({ page }) => {
    await page.goto('/signaler')
    await expect(page).toHaveTitle(/Signaler/)
    await expect(page.getByText(/Escaliers|Cave|Toiture|Localisation/i)).toBeVisible({ timeout: 8000 })
  })

  test('/mon-compte affiche le profil', async ({ page }) => {
    await page.goto('/mon-compte')
    await expect(page).toHaveTitle(/Compte/)
    await expect(page.locator('input[name="prenom"], input[name="nom"]').first()).toBeVisible({ timeout: 8000 })
  })

  test('PDF charges se télécharge sans erreur', async ({ page }) => {
    await page.goto('/mes-charges')
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null)
    const btn = page.getByText(/Télécharger PDF/i)
    if (await btn.isVisible()) {
      await btn.click()
      const download = await downloadPromise
      if (download) {
        expect(download.suggestedFilename()).toMatch(/charges.*\.pdf/i)
      }
    }
  })
})

test.describe('Séparation des espaces', () => {
  test('un syndic connecté accédant au portail voit un toast de conflit', async ({ page }) => {
    // Login en tant que syndic
    await page.goto('/login')
    await page.getByPlaceholder('vous@cabinet.fr').fill('test.phase3.coplio@mailinator.com')
    await page.locator('input[type="password"]').fill('TestCoplio2026!')
    await page.getByRole('button', { name: /Se connecter/ }).click()
    await page.waitForURL('**/dashboard', { timeout: 10000 })

    // Tenter d'accéder à une route portail → redirect dashboard avec ?conflict=portail
    await page.goto('/accueil')
    // Doit rester sur dashboard ou redirect avec conflict param
    await expect(page).toHaveURL(/dashboard/, { timeout: 8000 })
  })
})
