/**
 * Tests E2E — Authentification Coplio
 * Flows testés :
 * - Page de connexion accessible
 * - Login syndic avec identifiants valides → dashboard
 * - Login portail copropriétaire → accueil
 * - Mauvais identifiants → message d'erreur
 * - Accès à route protégée sans session → redirect /login
 * - Page /forgot-password accessible
 * - Page /register accessible
 */

import { test, expect } from '@playwright/test'

const SYNDIC_EMAIL    = process.env.TEST_SYNDIC_EMAIL    ?? 'test.phase3.coplio@mailinator.com'
const SYNDIC_PASSWORD = process.env.TEST_SYNDIC_PASSWORD ?? 'TestCoplio2026!'
const PORTAIL_EMAIL    = process.env.TEST_PORTAIL_EMAIL   ?? 'marie.martin.test@mailinator.com'
const PORTAIL_PASSWORD = process.env.TEST_PORTAIL_PASSWORD ?? 'TestPortail2026!'

test.describe('Page de connexion', () => {
  test('est accessible et affiche le formulaire', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/Connexion/)
    await expect(page.getByPlaceholder('vous@cabinet.fr')).toBeVisible()
    await expect(page.getByRole('button', { name: /Se connecter/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Essai gratuit/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Accéder au portail/ })).toBeVisible()
  })

  test('affiche une erreur pour des identifiants invalides', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('vous@cabinet.fr').fill('mauvais@email.com')
    await page.locator('input[type="password"]').fill('mauvaismdp')
    await page.getByRole('button', { name: /Se connecter/ }).click()
    await expect(page.locator('text=Email ou mot de passe incorrect')).toBeVisible({ timeout: 8000 })
  })

  test('lien Mot de passe oublié fonctionne', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: /Mot de passe oublié/ }).click()
    await expect(page).toHaveURL(/forgot-password/)
    await expect(page.getByRole('heading', { name: /Mot de passe oublié/ })).toBeVisible()
  })
})

test.describe('Connexion syndic', () => {
  test('login réussi → redirige vers /dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('vous@cabinet.fr').fill(SYNDIC_EMAIL)
    await page.locator('input[type="password"]').fill(SYNDIC_PASSWORD)
    await page.getByRole('button', { name: /Se connecter/ }).click()
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    await expect(page).toHaveURL(/dashboard/)
    await expect(page.getByText(/Bonjour/)).toBeVisible({ timeout: 8000 })
  })

  test('dashboard affiche les KPIs', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('vous@cabinet.fr').fill(SYNDIC_EMAIL)
    await page.locator('input[type="password"]').fill(SYNDIC_PASSWORD)
    await page.getByRole('button', { name: /Se connecter/ }).click()
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    // Au moins 1 copropriété visible
    await expect(page.getByText(/Copropriétés?/i).first()).toBeVisible({ timeout: 8000 })
  })
})

test.describe('Connexion portail copropriétaire', () => {
  test('login portail → redirige vers /accueil', async ({ page }) => {
    await page.goto('/portail')
    await page.getByPlaceholder('vous@cabinet.fr').fill(PORTAIL_EMAIL)
    await page.locator('input[type="password"]').fill(PORTAIL_PASSWORD)
    await page.getByRole('button', { name: /Se connecter/i }).click()
    await page.waitForURL('**/accueil', { timeout: 15000 })
    await expect(page).toHaveURL(/accueil/)
  })
})

test.describe('Protection des routes', () => {
  test('accès à /dashboard sans session → redirect /login', async ({ page }) => {
    // Pas de session = nouveau contexte frais
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/login/, { timeout: 8000 })
  })

  test('accès à /coproprietes sans session → redirect /login', async ({ page }) => {
    await page.goto('/coproprietes')
    await expect(page).toHaveURL(/login/, { timeout: 8000 })
  })

  test('accès à /accueil sans session → redirect /portail', async ({ page }) => {
    await page.goto('/accueil')
    await expect(page).toHaveURL(/portail|login/, { timeout: 8000 })
  })
})

test.describe('Pages publiques', () => {
  test('/register est accessible', async ({ page }) => {
    await page.goto('/register')
    await expect(page).toHaveTitle(/Démarrer|Essai|Inscription|Coplio/)
    await expect(page.getByRole('button', { name: /Créer mon compte/ })).toBeVisible()
  })

  test('/forgot-password est accessible et header aligné avec /login', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.getByText('Coplio')).toBeVisible()
    await expect(page.getByText('BETA')).toBeVisible()
    await expect(page.getByRole('heading', { name: /Mot de passe oublié/ })).toBeVisible()
  })

  test('/tarifs a une navigation principale', async ({ page }) => {
    await page.goto('/tarifs')
    // Nav doit être présente (Fonctionnalités, Tarifs, etc.)
    await expect(page.getByRole('link', { name: /Fonctionnalités/i })).toBeVisible({ timeout: 5000 })
  })
})
