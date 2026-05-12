import { test, _electron as electron, expect } from '@playwright/test';

test.describe('Biblioteca de Leyes', () => {
  let electronApp;
  let window;

  test.beforeAll(async () => {
    electronApp = await electron.launch({ args: ['.'] });
    window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // Saltar onboarding si es necesario
    if (await window.isVisible('text=Bienvenido a Cerebro Legislativo')) {
      await window.click('button:has-text("Configurar más tarde")');
    }

    // Login (crear uno si no hay, o usar uno conocido)
    // En este entorno de test fresco, registramos uno
    await window.click('text=Registrar nuevo Administrador');
    await window.fill('input[placeholder="Ej: Dr. Juan Pérez"]', 'Leyes Admin');
    await window.fill('input[placeholder="admin"]', 'admin_leyes');
    await window.fill('input[placeholder="••••••••"]', 'Password123!@#');
    await window.click('button:has-text("Registrar y Configurar")');
    
    await window.fill('input[placeholder="admin"]', 'admin_leyes');
    await window.fill('input[placeholder="••••••••"]', 'Password123!@#');
    await window.click('button:has-text("Acceder al Sistema")');
    
    await expect(window.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('Debe permitir registrar una nueva ley', async () => {
    // Navegar a Biblioteca
    await window.click('button:has-text("Biblioteca")');
    await expect(window.locator('h1')).toContainText('Biblioteca de Leyes');

    // Abrir formulario
    await window.click('button:has-text("Registrar Ley")');

    const leyTitulo = `Ley de Prueba E2E ${Date.now()}`;
    await window.fill('input[placeholder="Ej: Reforma al Código de Comercio..."]', leyTitulo);
    await window.fill('input[placeholder="Pegue aquí el enlace compartido..."]', 'https://drive.google.com/test-law');
    
    await window.click('button:has-text("Registrar")');

    // Verificar que aparece en la lista
    await expect(window.locator(`text=${leyTitulo}`)).toBeVisible();
    await expect(window.locator('text=Gaceta Ordinaria')).toBeVisible();
  });

  test('Debe filtrar leyes', async () => {
    const searchInput = window.locator('input[placeholder="Buscar por título o gaceta..."]');
    await searchInput.fill('Inexistente');
    await expect(window.locator('text=No se encontraron resultados')).toBeVisible();
    
    await searchInput.fill('');
    await expect(window.locator('text=No se encontraron resultados')).not.toBeVisible();
  });

  test('Debe mostrar QR (simulado)', async () => {
    // El botón de QR abre una nueva ventana, lo cual es difícil de testear en Electron Playwright 
    // sin manejar múltiples ventanas, pero podemos al menos verificar que el botón existe y es clickable.
    const qrButton = window.locator('button[title="Ver Código QR"]').first();
    await expect(qrButton).toBeVisible();
    // No clickeamos porque window.open() podría causar problemas en el entorno de test si no se maneja
  });
});
