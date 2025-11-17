import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // Exclude e2e tests (Playwright tests)
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
    // Memory leak prevention
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      }
    },
    isolate: true,
    coverage: {
      enabled: false,
      provider: 'none',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
