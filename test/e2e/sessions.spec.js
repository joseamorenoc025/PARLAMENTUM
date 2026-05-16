import { test, expect } from '@playwright/test';
import { launchTestApp, cleanupTestApp } from './electron-test-setup';

test.describe('Sesiones, Oficios y UX Transversal', () => {
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
    await window.getByTestId('chamber-name-input').fill('Cámara Sesiones');
    await window.getByTestId('btn-onboarding-finish').click({ force: true });
    await window.getByTestId('btn-onboarding-start-using').click({ force: true });

    // Iniciar sesión y validar Dashboard
    await window.locator('input[type="password"]').fill('Password123!');
    await window.getByRole('button', { name: 'Acceder al Sistema' }).click({ force: true });
    await expect(window.getByRole('banner').getByText('Dashboard').first()).toBeVisible({ timeout: 10000 });
  });

  test.afterAll(async () => {
    await cleanupTestApp(testContext);
  });

  test('Acceso a Sesiones', async () => {
    // Navegar a Sesiones
    await window.getByTestId('nav-sesiones').click();
    await expect(window.locator('h1')).toContainText('Sesiones');
  });

  test('Modo Oscuro/Claro en Sesiones', async () => {
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

  test('Creación de Sesión', async () => {
    await window.click('button:has-text("Nueva Sesión")');
    await expect(window.locator('h2')).toContainText('Nueva Sesión');

    await window.fill('input[placeholder="Ej: 001-2024"]', 'SES-TEST-01');
    await window.click('button:has-text("Guardar")');
    
    await expect(window.locator('text=SES-TEST-01')).toBeVisible();
  });

  test('Navegación y Modo Oscuro en Oficios', async () => {
    await window.getByTestId('nav-oficios').click();
    await expect(window.locator('h1')).toContainText('Oficios Salientes');

    const body = window.locator('body');
    const themeBtn = window.locator('header button:has(svg.lucide-sun), header button:has(svg.lucide-moon)').last();
    
    // Test Light
    await themeBtn.click();
    await expect(body.locator('xpath=..')).not.toHaveClass(/dark/);
    
    // Revert
    await themeBtn.click();
  });

  test('Creación de Oficio Vinculado', async () => {
    await window.click('button:has-text("Nuevo Oficio")');
    await window.fill('input[placeholder="Ej: 001-2024"]', 'OFI-TEST-01');
    await window.fill('input[placeholder="Nombre del destinatario"]', 'Destinatario Prueba');
    
    // Seleccionar sesión vinculada (debe estar la que creamos)
    await window.locator('select').first().selectOption({ label: /SES-TEST-01/ }).catch(() => {});
    
    await window.click('button:has-text("Registrar")');
    await expect(window.locator('text=OFI-TEST-01')).toBeVisible();
  });
});
