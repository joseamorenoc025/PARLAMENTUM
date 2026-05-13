import { test, expect, _electron as electron } from '@playwright/test';

test.describe('Biblioteca de Leyes y Auditoría (UX Transversal)', () => {
  let electronApp;
  let window;

  test.beforeAll(async () => {
    electronApp = await electron.launch({ args: ['.'] });
    window = await electronApp.firstWindow();
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('Autenticación rápida y acceso a Biblioteca', async () => {
    const isAuthVisible = await window.locator('h1:has-text("Segundo Cerebro")').isVisible({ timeout: 2000 }).catch(() => false);
    if (isAuthVisible) {
      await window.fill('input[placeholder="admin"]', 'admin');
      await window.fill('input[placeholder="••••••••"]', 'Admin123!@#');
      await window.click('button:has-text("Acceder")');
    }
    await expect(window.locator('header span')).toContainText('Dashboard', { timeout: 10000 });
    await window.click('nav button:has-text("Biblioteca")');
    await expect(window.locator('h1')).toContainText('Biblioteca de Leyes');
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
    await window.click('button:has-text("Registrar Ley")');
    await expect(window.locator('h2')).toContainText('Registrar Ley');

    // 2. Llenar datos
    await window.fill('input[placeholder*="Ej: Reforma"]', 'Ley de Test E2E');
    await window.fill('input[placeholder="Ej: 42.123"]', '99.999');
    await window.fill('input[placeholder*="https://drive.google.com"]', 'https://drive.google.com/ley-test');

    // 3. Guardar
    await window.click('button:has-text("Registrar")');
    
    // 4. Buscar
    await window.fill('input[placeholder*="Buscar por título"]', 'Ley de Test E2E');
    await expect(window.locator('text=Ley de Test E2E')).toBeVisible();
    await expect(window.locator('text=#99.999')).toBeVisible();
  });

  test('Edición y Actualización de Enlace', async () => {
    // 1. Clic en Editar (el botón con Plus rotado / Edit)
    await window.click('button[title="Editar Ley"]');
    await expect(window.locator('h2')).toContainText('Editar Ley');
    
    // 2. Modificar Enlace
    await window.fill('input[placeholder*="https://drive.google.com"]', 'https://drive.google.com/enlace-actualizado');
    
    // 3. Actualizar
    await window.click('button:has-text("Actualizar")');
    
    // 4. Verificar en tarjeta (Enlace de Respaldo)
    await expect(window.locator('span:has-text("enlace-actualizado")')).toBeVisible();
  });
});
