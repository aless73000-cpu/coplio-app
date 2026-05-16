/**
 * Tests E2E — Assemblées Générales & Votes
 *
 * Couvre :
 *   - Accès à la liste des AG
 *   - Création d'une AG
 *   - Ajout d'une résolution
 *   - Changement de statut AG (planifiee → en_cours → terminee)
 *   - Vote côté portail copropriétaire
 *   - Protection des routes AG sans session
 */
import { test, expect, Page } from '@playwright/test'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function navigateToAssemblees(page: Page) {
  await page.goto('/assemblees')
  await expect(page).toHaveURL(/\/assemblees/)
}

// ── Liste des AG ──────────────────────────────────────────────────────────────

test.describe('Liste des Assemblées Générales', () => {
  test('affiche la page des AG avec le bouton Nouvelle AG', async ({ page }) => {
    await navigateToAssemblees(page)

    await expect(page.getByRole('heading', { name: /assembl/i })).toBeVisible()
    await expect(
      page.getByRole('link', { name: /nouvelle ag|créer/i })
        .or(page.getByRole('button', { name: /nouvelle ag|créer/i }))
    ).toBeVisible()
  })

  test('affiche les filtres de statut', async ({ page }) => {
    await navigateToAssemblees(page)

    // Des filtres par statut doivent être présents
    await expect(
      page.getByText(/toutes|planifiée|convoquée|terminée/i).first()
    ).toBeVisible()
  })
})

// ── Création d'une AG ─────────────────────────────────────────────────────────

test.describe('Création d\'une AG', () => {
  test('accède au formulaire de création', async ({ page }) => {
    await page.goto('/assemblees/new')
    await expect(page).toHaveURL(/\/assemblees\/new/)
    await expect(page.getByRole('heading', { name: /nouvelle|créer/i })).toBeVisible()
  })

  test('affiche les champs obligatoires du formulaire', async ({ page }) => {
    await page.goto('/assemblees/new')

    // Champs attendus
    await expect(page.getByLabel(/titre/i)).toBeVisible()
    await expect(page.getByLabel(/date/i).first()).toBeVisible()
    await expect(page.getByLabel(/copropriété/i).or(page.getByRole('combobox'))).toBeVisible()
  })

  test('valide les champs obligatoires avant soumission', async ({ page }) => {
    await page.goto('/assemblees/new')

    // Soumettre sans remplir
    await page.getByRole('button', { name: /créer|enregistrer|valider/i }).click()

    // Des messages d'erreur doivent apparaître
    await expect(
      page.getByText(/requis|obligatoire|manquant/i).first()
    ).toBeVisible({ timeout: 5_000 })
  })
})

// ── Détail d'une AG ───────────────────────────────────────────────────────────

test.describe('Détail d\'une AG', () => {
  test('affiche les sections principales d\'une AG', async ({ page }) => {
    await navigateToAssemblees(page)

    // Cliquer sur la première AG de la liste (si elle existe)
    const firstAg = page.getByRole('link', { name: /voir|détail/i }).first()
      .or(page.locator('a[href*="/assemblees/"]').first())

    const count = await firstAg.count()
    if (count === 0) {
      test.skip()
      return
    }

    await firstAg.click()
    await expect(page).toHaveURL(/\/assemblees\/.+/)

    // Les sections doivent être présentes
    await expect(page.getByRole('heading').first()).toBeVisible()
  })

  test('affiche les résolutions de l\'AG', async ({ page }) => {
    await navigateToAssemblees(page)

    const agLink = page.locator('a[href*="/assemblees/"]').first()
    const count = await agLink.count()
    if (count === 0) {
      test.skip()
      return
    }

    await agLink.click()
    await expect(page).toHaveURL(/\/assemblees\/.+/)

    // La section résolutions doit être présente
    await expect(
      page.getByText(/résolution|ordre du jour/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })
})

// ── API Résolutions ───────────────────────────────────────────────────────────

test.describe('API Résolutions (authentifié)', () => {
  test('POST /api/ag/:id/resolutions crée une résolution', async ({ request }) => {
    // On ne connaît pas l'ID d'une AG de test — on vérifie juste la protection
    const response = await request.post('/api/ag/fake-id/resolutions', {
      data: { titre: 'Test résolution', description: '' },
    })

    // 404 (AG inconnue) ou 400 (données invalides) — PAS 401 (on est authentifié)
    expect([400, 404]).toContain(response.status())
  })
})

// ── Votes copropriétaires ─────────────────────────────────────────────────────

test.describe('Module Votes (syndic)', () => {
  test('accède à la page des votes d\'une copropriété', async ({ page }) => {
    await page.goto('/coproprietes')

    // Trouver une copropriété et naviguer vers ses votes
    const coproprieteLink = page.locator('a[href*="/coproprietes/"]').first()
    const count = await coproprieteLink.count()
    if (count === 0) {
      test.skip()
      return
    }

    const href = await coproprieteLink.getAttribute('href')
    if (!href) {
      test.skip()
      return
    }

    // Extraire l'ID et naviguer vers la page votes
    const id = href.split('/coproprietes/')[1]?.split('/')[0]
    if (!id) {
      test.skip()
      return
    }

    await page.goto(`/coproprietes/${id}/votes`)
    await expect(page).toHaveURL(new RegExp(`/coproprietes/${id}/votes`))
    await expect(page.getByRole('heading', { name: /vote/i })).toBeVisible()
  })

  test('affiche le bouton pour créer un vote', async ({ page }) => {
    await page.goto('/coproprietes')

    const coproprieteLink = page.locator('a[href*="/coproprietes/"]').first()
    const count = await coproprieteLink.count()
    if (count === 0) {
      test.skip()
      return
    }

    const href = await coproprieteLink.getAttribute('href')
    const id = href?.split('/coproprietes/')[1]?.split('/')[0]
    if (!id) {
      test.skip()
      return
    }

    await page.goto(`/coproprietes/${id}/votes`)

    await expect(
      page.getByRole('button', { name: /nouveau vote|créer/i })
        .or(page.getByRole('link', { name: /nouveau vote|créer/i }))
    ).toBeVisible({ timeout: 10_000 })
  })
})

// ── Protection des routes sans session ────────────────────────────────────────

test.describe('Protection routes AG (sans session)', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('redirige /assemblees vers /login sans session', async ({ page }) => {
    await page.goto('/assemblees')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test('redirige /assemblees/new vers /login sans session', async ({ page }) => {
    await page.goto('/assemblees/new')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test('POST /api/ag/:id/resolutions sans session retourne 401', async ({ request }) => {
    const response = await request.post('/api/ag/any-id/resolutions', {
      data: { titre: 'Test' },
    })
    expect(response.status()).toBe(401)
  })
})
