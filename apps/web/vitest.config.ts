import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // Exclude Playwright E2E tests - these run via `pnpm test:e2e` with Playwright
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'tests/**/*.spec.ts', // Playwright E2E tests in tests/ folder
      'tests/e2e/**', // Playwright E2E tests in tests/e2e/ folder
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
