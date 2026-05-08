import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'packages/**/__tests__/**/*.test.ts',
      'scripts/**/__tests__/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['packages/ao-parser/src/**'],
      exclude: ['**/__tests__/**', '**/node_modules/**'],
    },
  },
  resolve: {
    alias: {
      '@albion-tool/types': resolve(__dirname, 'packages/types/src/index.ts'),
    },
  },
})
