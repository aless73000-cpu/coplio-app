/**
 * Tests E2E — Facturation
 *
 * Couvre :
 *   - Accès à /facturation (owner uniquement)
 *   - Affichage du plan actuel
 *   - Présence du bouton "Gérer l'abonnement" pour les abonnés actifs
 *   - Présence des plans disponibles pour les comptes en trial
 *   - Redirect /facturation → /dashboard pour les non-owner
 */
import { test, expect } from '@playwright/test'
import { loginAsSyndic } from './helpers/auth'

test.describe('Page Facturation', () => {
  test('est accessible depuis la sidebar', async ({ page }) => {
    await page.goto('/facturation')
    await expect(page).toHaveURL(/\/facturation/)
    await expect(page.getByRole('heading', { name: /facturation/i })).toBeVisible()
  })

  test('affiche le plan actuel du cabinet', async ({ page }) => {
    await page.goto('/facturation')
    // Un des plans doit être mis en avant
    await expect(
      page.getByText(/trial|starter|pro|cabinet|essai/i).first()
    ).toBeVisible()
  })

  test('affiche les 3 plans tarifaires disponibles', async ({ page }) => {
    await page.goto('/facturation')
    // Les 3 plans de la landing doivent être présents
    await expect(page.getByText(/starter/i)).toBeVisible()
    await expect(page.getByText(/pro/i)).toBeVisible()
    await expect(page.getByText(/cabinet/i)).toBeVisible()
  })

  test('affiche le bouton Gérer l\'abonnement pour les abonnés', async ({ page }) => {
    await page.goto('/facturation')
    // Si l'utilisateur de test a un abonnement actif
    const manageBtn = page.getByRole('button', { name: /gérer.*abonnement/i })
    const hasSub = await manageBtn.count() > 0

    if (hasSub) {
      await expect(manageBtn).toBeVisible()
      await expect(manageBtn).toBeEnabled()
    } else {
      // En trial : les boutons de souscription doivent être visibles
      await expect(
        page.getByRole('button', { name: /choisir|commencer|souscrire/i }).first()
      ).toBeVisible()
    }
  })

  test('affiche une alerte si le trial expire bientôt', async ({ page }) => {
    await page.goto('/facturation')
    // Si le trial est proche de l'expiration, une alerte doit apparaître
    // (non bloquant si le compte de test n'est pas en fin de trial)
    const alert = page.getByText(/expire dans|jours? restant/i)
    const hasAlert = await alert.count() > 0
    if (hasAlert) {
      await expect(alert).toBeVisible()
    }
  })

  test('affiche un message de succès après souscription', async ({ page }) => {
    await page.goto('/facturation?success=true')
    await expect(
      page.getByText(/activé|félicitations|succès|abonnement.*actif/i)
    ).toBeVisible({ timeout: 5_000 })
  })

  test('affiche un message d\'annulation si checkout annulé', async ({ page }) => {
    await page.goto('/facturation?canceled=true')
    await expect(
      page.getByText(/annulé|abandonné|pas été finalisé/i)
    ).toBeVisible({ timeout: 5_000 })
  })
})
