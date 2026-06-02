/**
 * Tests E2E — Portail Locataire
 * Nécessite un compte locataire actif (Lucas, locataire de Marie sur le Lot A01).
 */

import { test, expect, type Page } from '@playwright/test'

const TENANT_EMAIL    = process.env.TEST_TENANT_EMAIL    ?? 'test.locataire.coplio@mailinator.com'
const TENANT_PASSWORD = process.env.TEST_TENANT_PASSWORD ?? 'TestLocataire2026!'

async function loginTenant(page: Page) {
  await page.goto('/portail')
  await page.getByPlaceholder('vous@cabinet.fr').fill(TENANT_EMAIL)
  await page.locator('input[type="password"]').fill(TENANT_PASSWORD)
  await page.getByRole('button', { name: /Se connecter/i }).click()
  await page.waitForURL('**/accueil', { timeout: 15000 })
}

test.describe('Portail locataire — espace allégé', () => {
  test.beforeEach(async ({ page }) => {
    await loginTenant(page)
  })

  test('/accueil affiche la vue locataire (CTA Signaler)', async ({ page }) => {
    await expect(page.getByText(/Signaler un problème/i).first()).toBeVisible({ timeout: 8000 })
    // Nav réduite : "Signaler" présent (nav + raccourci), "Mes charges"/"Votes" absents
    await expect(page.getByRole('link', { name: /^Signaler$/ }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /Mes charges/i })).toHaveCount(0)
    await expect(page.getByRole('link', { name: /^Votes$/i })).toHaveCount(0)
  })

  test('/signaler est accessible au locataire', async ({ page }) => {
    await page.goto('/signaler')
    await expect(page).toHaveTitle(/Signaler/)
    await expect(page.getByText(/Escaliers|Cave|Toiture|Localisation/i).first()).toBeVisible({ timeout: 8000 })
  })

  test('messagerie cible le propriétaire (pas le syndic)', async ({ page }) => {
    await page.goto('/mes-messages')
    await expect(page.getByText(/votre propriétaire/i).first()).toBeVisible({ timeout: 8000 })
    await expect(page.getByText(/votre syndic/i)).toHaveCount(0)
  })

  test('annuaire affiche "Mon propriétaire"', async ({ page }) => {
    await page.goto('/mes-contacts')
    await expect(page.getByText(/Mon propriétaire/i)).toBeVisible({ timeout: 8000 })
  })

  test('/mes-travaux (mes signalements) accessible', async ({ page }) => {
    await page.goto('/mes-travaux')
    await expect(page).toHaveTitle(/Travaux/)
  })
})

test.describe('Confinement locataire — pages owner-only bloquées', () => {
  test.beforeEach(async ({ page }) => {
    await loginTenant(page)
  })

  for (const route of ['/mes-charges', '/mes-votes', '/mes-assemblees', '/mes-signatures', '/mon-calendrier', '/mon-locataire']) {
    test(`${route} → redirige vers /accueil`, async ({ page }) => {
      await page.goto(route)
      await expect(page).toHaveURL(/\/accueil/, { timeout: 8000 })
    })
  }
})
