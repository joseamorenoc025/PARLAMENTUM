import { test, expect } from '@playwright/test';
import { launchTestApp, cleanupTestApp } from './electron-test-setup';

test.describe('Biblioteca de Leyes', () => {
  let electronApp;
  let window;
  let userDataDir;

  test.beforeEach(async ({}, testInfo) => {
    const setup = await launchTestApp(testInfo);
    electronApp = setup.electronApp;
    window = setup.window;
    userDataDir = setup.userDataDir;

    // Resetear DB y saltar onboarding para ir directo al login/dashboard
    await window.evaluate(() => window.legisAPI.invoke('db:reset-for-tests', { onboardingCompleted: true }));
    
    // Registrar un admin rápido para poder entrar (ya que reseteamos la DB)
    await window.click('text=Registrar nuevo Administrador');
    await window.getByPlaceholder('Ej: Dr. Juan Pérez').fill('Leyes Admin');
    await window.getByPlaceholder('admin').fill('admin_leyes');
    await window.locator('input[type="password"]').fill('Password123!@#');
    await window.getByRole('button', { name: 'Registrar y Configurar' }).click({ force: true });
    
    await window.getByPlaceholder('admin').fill('admin_leyes');
    await window.locator('input[type="password"]').fill('Password123!@#');
    await window.getByRole('button', { name: 'Acceder al Sistema' }).click({ force: true });
    
    await expect(window.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 20000 });
  });

  test.afterEach(async () => {
    await cleanupTestApp(electronApp, userDataDir);
  });

  test('Debe permitir registrar una nueva ley', async () => {
    // Navegar a Biblioteca
    await window.getByRole('button', { name: 'Biblioteca' }).click({ force: true });
    await expect(window.getByTestId('laws-page-title')).toBeVisible();

    // Abrir formulario
    await window.getByTestId('btn-open-law-form').click({ force: true });

    const leyTitulo = `Ley de Prueba E2E ${Date.now()}`;
    await window.getByTestId('law-title-input').fill(leyTitulo);
    await window.getByTestId('law-drive-link-input').fill('https://drive.google.com/test-law');
    
    await window.getByTestId('btn-save-law').click({ force: true });

    // Verificar que aparece en la lista
    await expect(window.getByText(leyTitulo).first()).toBeVisible({ timeout: 15000 });
  });

  test('Debe filtrar leyes', async () => {
    await window.getByRole('button', { name: 'Biblioteca' }).click({ force: true });
    await expect(window.getByTestId('laws-page-title')).toBeVisible();

    const searchInput = window.getByPlaceholder('Buscar por título o gaceta...');
    await searchInput.fill('Inexistente');
    await expect(window.getByText('No se encontraron resultados').first()).toBeVisible();
    
    await searchInput.fill('');
    await expect(window.getByText('No se encontraron resultados').first()).not.toBeVisible();
  });

  test('Debe mostrar QR (simulado)', async () => {
    await window.getByRole('button', { name: 'Biblioteca' }).click({ force: true });
    await expect(window.getByTestId('laws-page-title')).toBeVisible();

    // Registrar una ley primero
    await window.getByTestId('btn-open-law-form').click({ force: true });
    await window.getByTestId('law-title-input').fill('Ley QR');
    await window.getByTestId('law-drive-link-input').fill('https://drive.google.com/test-qr');
    await window.getByTestId('btn-save-law').click({ force: true });

    const qrButton = window.locator('button[title="Ver Código QR"]').first();
    await expect(qrButton).toBeVisible();
  });
});
