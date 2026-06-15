/**
 * Tests E2E — Paiement / Abonnement Stripe
 *
 * Couvre :
 *   - Accès à la page des tarifs (publique)
 *   - Affichage des plans (Starter / Pro / Business)
 *   - Clic sur "Choisir ce plan" → appel /api/stripe/checkout → redirect Stripe
 *   - Vérification que la page /api/stripe/checkout exige une session
 *   - Accès au portail client Stripe (gestionnaire abonné)
 *
 * Note : Les tests ne complètent PAS la transaction Stripe (pas de carte réelle).
 *        On vérifie uniquement que l'app redirige vers stripe.com correctement.
 */
import { test, expect } from '@playwright/test'
import { STORAGE_STATE } from '../../playwright.config'

// Par défaut, les tests de ce fichier utilisent la session syndic du setup.
// Les blocs publics/non authentifiés la surchargent avec un storageState vide.
test.use({ storageState: STORAGE_STATE })

test.describe('Page Tarifs (publique)', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('affiche les 3 plans tarifaires', async ({ page }) => {
    await page.goto('/tarifs')

    // Les 3 plans doivent être visibles
    await expect(page.getByText(/starter/i).first()).toBeVisible()
    await expect(page.getByText(/pro/i).first()).toBeVisible()
    await expect(page.getByText(/business/i).first()).toBeVisible()
  })

  test('affiche les boutons de souscription', async ({ page }) => {
    await page.goto('/tarifs')

    const subscribeButtons = page.getByRole('button', { name: /choisir ce plan/i })
    await expect(subscribeButtons.first()).toBeVisible()
  })
})

test.describe('Checkout Stripe (authentifié)', () => {
  // Utilise la session du setup (storageState injecté par playwright.config.ts)

  test('appel /api/stripe/checkout retourne une URL Stripe', async ({ page, request }) => {
    // Test via l'API directement (plus rapide que via UI)
    const response = await request.post('/api/stripe/checkout', {
      data: { plan: 'pro' },
    })

    // Doit soit retourner une URL Stripe, soit être refusé si déjà abonné
    expect([200, 400, 403]).toContain(response.status())

    if (response.status() === 200) {
      const body = await response.json()
      expect(body.url).toMatch(/stripe\.com|checkout\.stripe\.com/)
    }
  })

  test('clic sur "Choisir ce plan" déclenche la redirection Stripe', async ({ page }) => {
    await page.goto('/tarifs')

    // Intercepter la requête checkout avant la redirection
    const checkoutPromise = page.waitForRequest(
      (req) => req.url().includes('/api/stripe/checkout'),
      { timeout: 10_000 }
    )

    await page.getByRole('button', { name: /choisir ce plan/i }).first().click()
    const checkoutRequest = await checkoutPromise

    expect(checkoutRequest.method()).toBe('POST')
    const body = checkoutRequest.postDataJSON()
    expect(body).toHaveProperty('plan')
  })

  test('affiche un état de chargement pendant le checkout', async ({ page }) => {
    await page.goto('/tarifs')

    // Ralentir la réponse pour observer le loading state
    await page.route('/api/stripe/checkout', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.continue()
    })

    await page.getByRole('button', { name: /choisir ce plan/i }).first().click()

    // Doit afficher "Chargement..." pendant l'attente
    await expect(page.getByText(/chargement/i)).toBeVisible({ timeout: 3_000 })
  })
})

test.describe('Portail client Stripe (gestionnaire)', () => {
  test('accès au portail Stripe via /api/stripe/portal', async ({ request }) => {
    const response = await request.post('/api/stripe/portal')

    // 200 → URL portail Stripe, 400 → pas d'abonnement actif, 403 → non autorisé
    expect([200, 400, 403]).toContain(response.status())

    if (response.status() === 200) {
      const body = await response.json()
      expect(body.url).toMatch(/billing\.stripe\.com/)
    }
  })
})

test.describe('Protection API Stripe', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('POST /api/stripe/checkout sans session retourne 401', async ({ request }) => {
    const response = await request.post('/api/stripe/checkout', {
      data: { plan: 'pro' },
    })
    expect(response.status()).toBe(401)
  })

  test('POST /api/stripe/portal sans session retourne 401', async ({ request }) => {
    const response = await request.post('/api/stripe/portal')
    expect(response.status()).toBe(401)
  })
})
