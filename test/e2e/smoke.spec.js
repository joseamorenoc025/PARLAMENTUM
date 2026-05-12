import { test, _electron as electron, expect } from '@playwright/test';

test('Smoke Test: App launches and shows login or dashboard', async () => {
  const electronApp = await electron.launch({ args: ['.'] });
  
  // Wait for the first BrowserWindow to open
  const window = await electronApp.firstWindow();
  
  // Wait for the app to load (checking for a common element or title)
  await window.waitForLoadState('domcontentloaded');
  
  // Check title
  const title = await window.title();
  expect(title).toBe('Segundo Cerebro Legislativo');

  // Check if we are at login, onboarding or dashboard
  const content = await window.textContent('body');
  
  if (content.includes('Entorno No Soportado')) {
    throw new Error('La app detectó un entorno no Electron en el test E2E');
  }

  // Take a screenshot for evidence
  await window.screenshot({ path: 'test-results/smoke-screenshot.png' });

  await electronApp.close();
});
