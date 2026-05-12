import { test, _electron as electron, expect } from '@playwright/test';

test.describe('Autenticación', () => {
  let electronApp;
  let window;

  test.beforeAll(async () => {
    electronApp = await electron.launch({ args: ['.'] });
    window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // Si aparece onboarding, saltarlo para llegar al login
    const isWelcomeVisible = await window.isVisible('text=Bienvenido a Cerebro Legislativo');
    if (isWelcomeVisible) {
      await window.click('button:has-text("Configurar más tarde")');
    }
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('Debe mostrar error con credenciales inválidas', async () => {
    await window.fill('input[placeholder="admin"]', 'usuario_inexistente');
    await window.fill('input[placeholder="••••••••"]', 'wrongpassword');
    await window.click('button:has-text("Acceder al Sistema")');

    // Verificar toast de error (buscamos el texto del toast)
    await expect(window.locator('text=Usuario no encontrado')).toBeVisible();
  });

  test('Debe permitir registrar un nuevo administrador y loguearse', async () => {
    await window.click('text=Registrar nuevo Administrador');
    
    const timestamp = Date.now();
    const username = `admin_${timestamp}`;
    
    await window.fill('input[placeholder="Ej: Dr. Juan Pérez"]', 'Admin de Prueba');
    await window.fill('input[placeholder="admin"]', username);
    await window.fill('input[placeholder="••••••••"]', 'Password123!@#');
    
    await window.click('button:has-text("Registrar y Configurar")');
    
    // Debería volver al login tras registrar
    await expect(window.locator('text=Bienvenido a Cerebro Legislativo')).not.toBeVisible();
    await expect(window.locator('text=Segundo Cerebro')).toBeVisible();

    // Loguearse con el nuevo usuario
    await window.fill('input[placeholder="admin"]', username);
    await window.fill('input[placeholder="••••••••"]', 'Password123!@#');
    await window.click('button:has-text("Acceder al Sistema")');

    // Verificar que entró al Dashboard
    await expect(window.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(window.locator(`text=Admin de Prueba`)).toBeVisible();
  });

  test('Debe permitir cerrar sesión', async () => {
    // Asegurarse de estar en el dashboard antes de cerrar sesión
    await expect(window.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await window.click('button:has-text("Cerrar Sesión")');
    await expect(window.locator('text=Segundo Cerebro')).toBeVisible();
  });
});
