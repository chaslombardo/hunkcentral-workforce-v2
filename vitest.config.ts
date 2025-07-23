import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { codecovVitePlugin } from '@codecov/vite-plugin'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    // Put the Codecov vite plugin after all other plugins
    codecovVitePlugin({
      enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
      bundleName: "hunkcentral-workforce-app",
      uploadToken: process.env.CODECOV_TOKEN,
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        '.next/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
        '**/*.test.*',
        '**/*.spec.*',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})