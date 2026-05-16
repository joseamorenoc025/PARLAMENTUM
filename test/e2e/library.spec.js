import { test, expect } from '@playwright/test';
import { launchTestApp, cleanupTestApp } from './electron-test-setup';

test.describe('Biblioteca de Leyes y Auditoría (UX Transversal)', () => {
  let testContext;
  let window;

  test.beforeAll(async () => {
    testContext = await launchTestApp();
    window = testContext.window;

    // Completar el Onboarding Wizard para crear el admin
    await window.getByTestId('btn-start-setup').click({ force: true });
    await window.getByTestId('admin-password-input').fill('Password123!');
    await window.getByTestId('admin-confirm-password-input').fill('Password123!');
    await window.getByTestId('btn-onboarding-next').click({ force: true });
    await window.getByTestId('chamber-name-input').fill('Cámara Biblioteca');
    await window.getByTestId('btn-onboarding-finish').click({ force: true });
    await window.getByTestId('btn-onboarding-start-using').click({ force: true });

    // Iniciar sesión y validar Dashboard
    await window.locator('input[type="password"]').fill('Password123!');
    await window.getByRole('button', { name: 'Acceder al Sistema' }).click({ force: true });
    await expect(window.getByTestId('dashboard-title')).toBeVisible({ timeout: 15000 });
  });

  test.afterAll(async () => {
    await cleanupTestApp(testContext);
  });

  test('Acceso a Biblioteca', async () => {
    await window.getByTestId('nav-leyes').waitFor({ state: 'visible' });
    await window.getByTestId('nav-leyes').click();
    await expect(window.getByTestId('laws-page-title')).toContainText('Biblioteca de Leyes');
  });

  test('Modo Oscuro/Claro en Biblioteca', async () => {
    const body = window.locator('body');
    const themeBtn = window.locator('header button:has(svg.lucide-sun), header button:has(svg.lucide-moon)').last();
    
    // Test Dark
    await expect(body.locator('xpath=..')).toHaveClass(/dark/);
    
    // Test Light
    await themeBtn.click();
    await expect(body.locator('xpath=..')).not.toHaveClass(/dark/);
    
    // Revert
    await themeBtn.click();
  });

  test('Registro y Búsqueda de Ley', async () => {
    // 1. Abrir Formulario
    await window.getByTestId('btn-open-law-form').click({ force: true });
    await expect(window.locator('h2')).toContainText('Registrar Ley');

    // 2. Llenar datos
    await window.getByTestId('law-title-input').fill('Ley de Test E2E');
    await window.fill('input[placeholder="Ej: 42.123"]', '99.999');
    await window.getByTestId('law-drive-link-input').fill('https://drive.google.com/ley-test');

    // 3. Guardar
    await window.getByTestId('btn-save-law').click({ force: true });
    
    // 4. Buscar
    await window.fill('input[placeholder*="Buscar por título"]', 'Ley de Test E2E');
    await expect(window.locator('text=Ley de Test E2E').first()).toBeVisible();
  });

  test('Edición de Ley', async () => {
    // 1. Clic en Editar (el botón con Plus rotado / Edit)
    await window.click('button[title="Editar Ley"]');
    await expect(window.locator('h2')).toContainText('Editar Ley');
    
    // 2. Modificar Enlace
    await window.getByTestId('law-drive-link-input').fill('https://drive.google.com/enlace-actualizado');
    
    // 3. Actualizar
    await window.getByTestId('btn-save-law').click({ force: true });
    
    // 4. Verificar en tarjeta (Enlace de Respaldo)
    await expect(window.locator('span:has-text("enlace-actualizado")')).toBeVisible();
  });
});
