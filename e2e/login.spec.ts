/**
 * Tests E2E — Authentification
 *
 * Couvre :
 *   - Connexion avec identifiants valides → redirect dashboard
 *   - Connexion avec mauvais mot de passe → message d'erreur
 *   - Connexion avec email invalide → validation formulaire
 *   - Accès à une route protégée sans session → redirect /login
 *   - Déconnexion
 */
import { test, expect } from '@playwright/test'
import { TEST_USER } from './helpers/auth'

// Ce fichier est exécuté par le projet "auth-flows" (sans storageState)
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Authentification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  // ── Page de login ──────────────────────────────────────────────

  test('affiche la page de connexion correctement', async ({ page }) => {
    await expect(page).toHaveTitle(/Connexion/i)
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /mot de passe oublié/i })).toBeVisible()
  })

  // ── Validation formulaire ──────────────────────────────────────

  test('affiche une erreur pour un email invalide', async ({ page }) => {
    await page.getByLabel(/email/i).fill('pas-un-email')
    await page.getByLabel(/mot de passe/i).fill('test1234')
    await page.getByRole('button', { name: /se connecter/i }).click()

    await expect(page.getByText(/email invalide/i)).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('affiche une erreur si mot de passe trop court', async ({ page }) => {
    await page.getByLabel(/email/i).fill(TEST_USER.email)
    await page.getByLabel(/mot de passe/i).fill('123')
    await page.getByRole('button', { name: /se connecter/i }).click()

    await expect(page.getByText(/mot de passe trop court/i)).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  // ── Identifiants incorrects ────────────────────────────────────

  test('affiche une erreur pour un mauvais mot de passe', async ({ page }) => {
    await page.getByLabel(/email/i).fill(TEST_USER.email)
    await page.getByLabel(/mot de passe/i).fill('mauvais_mdp_xyz')
    await page.getByRole('button', { name: /se connecter/i }).click()

    await expect(
      page.getByText(/email ou mot de passe incorrect/i)
    ).toBeVisible({ timeout: 10_000 })
    await expect(page).toHaveURL(/\/login/)
  })

  // ── Connexion réussie ──────────────────────────────────────────

  test('connecte un gestionnaire et redirige vers le dashboard', async ({ page }) => {
    await page.getByLabel(/email/i).fill(TEST_USER.email)
    await page.getByLabel(/mot de passe/i).fill(TEST_USER.password)
    await page.getByRole('button', { name: /se connecter/i }).click()

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })

    // Le dashboard doit afficher des éléments clés
    await expect(page.getByRole('navigation')).toBeVisible()
  })

  // ── Route protégée sans session ────────────────────────────────

  test('redirige vers /login si accès direct à /dashboard sans session', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test('redirige vers /login si accès direct à /coproprietes sans session', async ({ page }) => {
    await page.goto('/coproprietes')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })

  // ── Mot de passe oublié ────────────────────────────────────────

  test('navigue vers la page mot de passe oublié', async ({ page }) => {
    await page.getByRole('link', { name: /mot de passe oublié/i }).click()
    await expect(page).toHaveURL(/\/forgot-password/)
  })

  test('affiche un message de confirmation sur forgot-password', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.getByLabel(/email/i).fill(TEST_USER.email)
    await page.getByRole('button', { name: /envoyer|réinitialiser/i }).click()

    // Soit un message de succès, soit on reste sur la page (selon le serveur)
    await expect(
      page.getByText(/email envoyé|vérifiez votre boîte|instructions/i)
    ).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Déconnexion', () => {
  // Ce test nécessite une session — on se connecte d'abord
  test('déconnecte et redirige vers /login', async ({ page }) => {
    // Se connecter
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(TEST_USER.email)
    await page.getByLabel(/mot de passe/i).fill(TEST_USER.password)
    await page.getByRole('button', { name: /se connecter/i }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })

    // Se déconnecter via l'API
    await page.goto('/api/auth/signout')

    // Doit revenir sur /login ou page publique
    await expect(page).toHaveURL(/\/login|^\/$/, { timeout: 10_000 })

    // Vérifier que la session est bien détruite
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })
})
