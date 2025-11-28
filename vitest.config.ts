import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import * as fs from 'fs';

// Detect if running in a git worktree (not main repo)
// In worktrees, .git is a file; in main repo, it's a directory
const gitPath = path.resolve(__dirname, '.git');
const isWorktree = fs.existsSync(gitPath) && fs.statSync(gitPath).isFile();

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // Exclude e2e tests (Playwright tests) and worktree directories
    // In worktrees, exclude all tests (run tests only on master)
    exclude: isWorktree
      ? ['**/*']
      : ['**/node_modules/**', '**/dist/**', '**/e2e/**', '**/.worktrees/**'],
    // Don't fail when no tests found (for worktrees where all tests are excluded)
    passWithNoTests: true,
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
