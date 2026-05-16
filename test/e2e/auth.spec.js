import { test, expect } from '@playwright/test';
import { launchTestApp, cleanupTestApp } from './electron-test-setup';

test.describe('Autenticación', () => {
  let testContext;
  let window;

  test.beforeEach(async () => {
    testContext = await launchTestApp();
    window = testContext.window;
  });

  test.afterEach(async () => {
    await cleanupTestApp(testContext);
  });

  test('Debe permitir loguearse con la contraseña', async () => {
    // Resetear DB a estado cero
    await window.evaluate(() => window.legisAPI.invoke('db:reset-for-tests', { onboardingCompleted: false }));
    
    // Pasar por el onboarding
    await window.getByTestId('btn-start-setup').click({ force: true });
    await window.getByTestId('admin-password-input').fill('Password123!');
    await window.getByTestId('admin-confirm-password-input').fill('Password123!');
    await window.getByTestId('btn-onboarding-next').click({ force: true });
    await window.getByTestId('chamber-name-input').fill('Cámara Auth');
    await window.getByTestId('btn-onboarding-finish').click({ force: true });
    await window.getByTestId('btn-onboarding-start-using').click({ force: true });
    
    // Login
    await window.locator('input[type="password"]').fill('Password123!');
    await window.getByRole('button', { name: 'Acceder al Sistema' }).click();

    // Verificar que entró al Dashboard
    await expect(window.getByRole('heading', { name: 'Dashboard' }).first()).toBeVisible({ timeout: 20000 });
  });

  test('Debe permitir cerrar sesión', async () => {
    // Resetear DB a estado cero
    await window.evaluate(() => window.legisAPI.invoke('db:reset-for-tests', { onboardingCompleted: false }));
    
    // Pasar por el onboarding
    await window.getByTestId('btn-start-setup').click({ force: true });
    await window.getByTestId('admin-password-input').fill('Password123!');
    await window.getByTestId('admin-confirm-password-input').fill('Password123!');
    await window.getByTestId('btn-onboarding-next').click({ force: true });
    await window.getByTestId('chamber-name-input').fill('Cámara Auth');
    await window.getByTestId('btn-onboarding-finish').click({ force: true });
    await window.getByTestId('btn-onboarding-start-using').click({ force: true });

    // Login
    await window.locator('input[type="password"]').fill('Password123!');
    await window.getByRole('button', { name: 'Acceder al Sistema' }).click();
    await expect(window.getByRole('heading', { name: 'Dashboard' }).first()).toBeVisible();
    
    // Cerrar sesión
    await window.click('button:has-text("Cerrar Sesión")');
    await expect(window.getByText('Segundo Cerebro').first()).toBeVisible();
  });
});
