import { test, expect, _electron as electron } from '@playwright/test';

test.describe('Sesiones, Oficios y UX Transversal', () => {
  let electronApp;
  let window;

  test.beforeAll(async () => {
    electronApp = await electron.launch({ args: ['.'] });
    window = await electronApp.firstWindow();
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('Manejo de Login y Acceso a Sesiones', async () => {
    const isAuthVisible = await window.locator('h1:has-text("Segundo Cerebro")').isVisible({ timeout: 2000 }).catch(() => false);
    if (isAuthVisible) {
      await window.fill('input[placeholder="admin"]', 'admin');
      await window.fill('input[placeholder="••••••••"]', 'Admin123!@#');
      await window.click('button:has-text("Acceder")');
    }
    await expect(window.locator('header span')).toContainText('Dashboard', { timeout: 10000 });
    
    // Navegar a Sesiones
    await window.click('nav button:has-text("Sesiones")');
    await expect(window.locator('h1')).toContainText('Control de Sesiones');
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
    await expect(window.locator('h2')).toContainText('Programar Sesión');

    await window.fill('input[placeholder="Ej: 001-2024"]', 'SES-TEST-01');
    await window.click('button:has-text("Guardar")');
    
    await expect(window.locator('text=SES-TEST-01')).toBeVisible();
  });

  test('Navegación y Modo Oscuro en Oficios', async () => {
    await window.click('nav button:has-text("Oficios")');
    await expect(window.locator('h1')).toContainText('Gestión de Oficios');

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
    await window.locator('select').first().selectOption({ label: 'Ordinaria SES-TEST-01' }).catch(() => {});
    
    await window.click('button:has-text("Registrar")');
    await expect(window.locator('text=OFI-TEST-01')).toBeVisible();
  });
});
