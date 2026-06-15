import { defineConfig, devices } from '@playwright/test'
import path from 'path'

// Chemin du fichier de session auth (généré par le projet "setup")
export const STORAGE_STATE = path.join(__dirname, 'tests', 'e2e', '.auth', 'user.json')

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Génère une session syndic réutilisable (tests/e2e/.auth/user.json)
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // Pas de storageState global : les specs s'authentifient elles-mêmes
      // (login en beforeEach) ou optent pour la session du setup via
      // `test.use({ storageState: STORAGE_STATE })`.
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts/,
    },
  ],
  // En local : lance le serveur Next.js automatiquement
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120_000,
      },
})
