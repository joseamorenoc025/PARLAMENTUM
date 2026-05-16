import { test, expect } from '@playwright/test';
import { launchTestApp, cleanupTestApp } from './electron-test-setup';

test.describe('Biblioteca de Leyes', () => {
  let electronApp;
  let window;
  let testUserDataDir;

  test.beforeAll(async () => {
    const setup = await launchTestApp();
    electronApp = setup.electronApp;
    window = setup.window;
    testUserDataDir = setup.testUserDataDir;

    // Resetear DB a estado cero
    await window.evaluate(() => window.legisAPI.invoke('db:reset-for-tests', { onboardingCompleted: false }));
    
    // Pasar por el onboarding para crear el admin
    await window.getByTestId('btn-start-setup').click({ force: true });
    await window.getByTestId('admin-password-input').fill('Password123!');
    await window.getByTestId('admin-confirm-password-input').fill('Password123!');
    await window.getByTestId('btn-onboarding-next').click({ force: true });
    await window.getByTestId('chamber-name-input').fill('Cámara Leyes');
    await window.getByTestId('btn-onboarding-finish').click({ force: true });
    await window.getByTestId('btn-onboarding-start-using').click({ force: true });
    
    // Login
    await window.locator('input[type="password"]').fill('Password123!');
    await window.getByRole('button', { name: 'Acceder al Sistema' }).click({ force: true });
    
    await expect(window.getByTestId('dashboard-title')).toBeVisible({ timeout: 20000 });
  });

  test.afterAll(async () => {
    await cleanupTestApp({ electronApp, testUserDataDir });
  });

  test('Debe permitir registrar una nueva ley', async () => {
    // Navegar a Biblioteca
    await window.getByTestId('nav-leyes').waitFor({ state: 'visible' });
    await window.getByTestId('nav-leyes').click();
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
    await window.getByTestId('nav-leyes').waitFor({ state: 'visible' });
    await window.getByTestId('nav-leyes').click();
    await expect(window.getByTestId('laws-page-title')).toBeVisible();
    // Registrar una ley primero para que no esté vacía la lista
    await window.getByTestId('btn-open-law-form').click({ force: true });
    await window.getByTestId('law-title-input').fill('Ley para Filtrar');
    await window.getByTestId('law-drive-link-input').fill('https://drive.google.com/test-filter');
    await window.getByTestId('btn-save-law').click({ force: true });
    await expect(window.getByText('Ley para Filtrar').first()).toBeVisible({ timeout: 15000 });

    const searchInput = window.getByPlaceholder('Buscar por título o gaceta...');
    await searchInput.fill('Inexistente');
    await expect(window.getByText('No se encontraron resultados').first()).toBeVisible();
    
    await searchInput.fill('');
    await expect(window.getByText('No se encontraron resultados').first()).not.toBeVisible();
  });

  test('Debe mostrar QR (simulado)', async () => {
    await window.getByTestId('nav-leyes').waitFor({ state: 'visible' });
    await window.getByTestId('nav-leyes').click();
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
