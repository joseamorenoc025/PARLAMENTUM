import { test, expect } from '@playwright/test';
import { launchTestApp, cleanupTestApp } from './electron-test-setup';

test.describe('Onboarding Wizard', () => {
  let testContext;

  test.beforeEach(async () => {
    // Lanzar app con carpeta limpia
    testContext = await launchTestApp();
  });

  test.afterEach(async () => {
    // Cerrar app y borrar carpeta
    await cleanupTestApp(testContext);
  });

  test('Debe completar el flujo de onboarding exitosamente', async () => {
    const { window } = testContext;
    // Paso 1: Bienvenida
    const welcomeTitle = window.getByTestId('onboarding-welcome-title');
    await welcomeTitle.waitFor({ state: 'visible', timeout: 15000 });
    await expect(welcomeTitle).toContainText('Bienvenido a Cerebro Legislativo');
    
    await window.getByTestId('btn-start-setup').click({ force: true });

    // Paso 2: Cuenta Administrador
    await expect(window.getByText('Cuenta de Administrador')).toBeVisible();
    await window.getByTestId('admin-password-input').fill('Password123!');
    await window.getByTestId('admin-confirm-password-input').fill('Password123!');
    
    await window.getByTestId('btn-onboarding-next').click({ force: true });

    // Paso 3: Datos Institucionales
    await expect(window.getByText('Datos Institucionales')).toBeVisible();
    await window.getByTestId('chamber-name-input').fill('Cámara de Prueba E2E');
    await window.getByTestId('btn-onboarding-finish').click({ force: true });

    // Paso 4: Finalización
    await expect(window.getByTestId('onboarding-success-title')).toBeVisible({ timeout: 15000 });
    await expect(window.getByText('Frase de Recuperación')).toBeVisible();
    
    // Click en "Comenzar a usar el sistema"
    await window.getByTestId('btn-onboarding-start-using').click({ force: true });

    // Debería redirigir al login (AuthScreen)
    await expect(window.getByText('Segundo Cerebro')).toBeVisible();
  });

});
