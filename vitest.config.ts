import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    // Inclut tous les fichiers *.test.ts dans src/
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // Exclut les fichiers E2E Playwright
    exclude: ['e2e/**', 'node_modules/**'],
    // Rapport de couverture
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**', 'src/app/api/**'],
      exclude: ['src/**/*.test.ts'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
