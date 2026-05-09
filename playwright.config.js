import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  timeout: 45000,
  fullyParallel: false, // En Electron es mejor secuencial para evitar conflictos de BD
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    viewport: { width: 1400, height: 900 },
    actionTimeout: 0,
    trace: 'on-first-retry',
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Electron',
      use: {
        browserName: 'chromium', // Playwright usa chromium para el driver de electron
      },
    },
  ],
});
