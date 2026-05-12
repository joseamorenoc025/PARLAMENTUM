import { test, _electron as electron, expect } from '@playwright/test';

test.describe('Onboarding Wizard', () => {
  let electronApp;
  let window;

  test.beforeEach(async () => {
    // Launch creates a fresh userData dir by default
    electronApp = await electron.launch({ args: ['.'] });
    window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');
  });

  test.afterEach(async () => {
    await electronApp.close();
  });

  test('Debe completar el flujo de onboarding exitosamente', async () => {
    // Paso 1: Bienvenida
    await expect(window.locator('text=Bienvenido a Cerebro Legislativo')).toBeVisible();
    await window.click('button:has-text("Comenzar configuración")');

    // Paso 2: Cuenta Administrador
    await expect(window.locator('text=Cuenta de Administrador')).toBeVisible();
    await window.fill('input[placeholder="ej: admin.secretaria"]', 'testadmin');
    const passwordInputs = window.locator('input[type="password"]');
    await passwordInputs.nth(0).fill('Password123!');
    await passwordInputs.nth(1).fill('Password123!');
    await window.fill('input[placeholder="Su respuesta..."]', 'MascotaTest');
    await window.click('button:has-text("Continuar")');

    // Paso 3: Datos Institucionales
    await expect(window.locator('text=Datos Institucionales')).toBeVisible();
    await window.fill('input[placeholder="ej: Concejo Municipal de..."]', 'Cámara de Prueba');
    await window.click('button:has-text("Finalizar")');

    // Paso 4: Finalización
    await expect(window.locator('text=¡Configuración Exitosa!')).toBeVisible();
    await expect(window.locator('text=Código de Recuperación')).toBeVisible();
    
    // Click en "Comenzar a usar el sistema"
    await window.click('button:has-text("Comenzar a usar el sistema")');

    // Debería redirigir al login (AuthScreen) porque user es null inicialmente
    await expect(window.locator('text=Segundo Cerebro')).toBeVisible();
    await expect(window.locator('text=Sistema de Gestión Legislativa')).toBeVisible();
  });

  test('Debe permitir saltar el onboarding', async () => {
    await expect(window.locator('text=Bienvenido a Cerebro Legislativo')).toBeVisible();
    await window.click('button:has-text("Configurar más tarde")');

    // Debería ir directo al login
    await expect(window.locator('text=Segundo Cerebro')).toBeVisible();
  });
});
