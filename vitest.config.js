import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    exclude: ['node_modules/**', 'dist/**', 'test/e2e/**', 'electron/src/db/migrations/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        branches: 70,
        functions: 75,
        statements: 80
      },
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.config.js',
        'electron/src/db/migrations/**'
      ]
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
