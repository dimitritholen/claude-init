import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.ts',
        'coverage/**'
      ]
    },
    testTimeout: 120000, // Allow longer timeouts for real API calls
    environment: 'node'
  }
})