import { defineConfig, devices } from '@playwright/test'
import path from 'path'

/**
 * Playwright E2E config — Coplio
 * Docs: https://playwright.dev/docs/test-configuration
 */

// Fichier de storage pour la session authentifiée
export const STORAGE_STATE = path.join(__dirname, 'e2e/.auth/user.json')

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // séquentiel pour ne pas saturer Supabase
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'on-failure' }]],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Délai entre actions (évite les race conditions)
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },

  projects: [
    // ── Setup : crée une session auth réutilisable ───────────────
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // ── Tests principaux (réutilisent la session) ────────────────
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
      testIgnore: /.*\.setup\.ts/,
    },

    // ── Tests sans auth (login, portail) ─────────────────────────
    {
      name: 'auth-flows',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /login\.spec\.ts|portail\.spec\.ts/,
    },
  ],

  // Lance le serveur Next.js en dev si pas déjà démarré
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      NODE_ENV: 'test',
    },
  },
})
