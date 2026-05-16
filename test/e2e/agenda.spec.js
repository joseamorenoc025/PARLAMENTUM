import { test, expect } from '@playwright/test';
import { launchTestApp, cleanupTestApp } from './electron-test-setup';

test.describe('Agenda Legislativa', () => {
  let testContext;
  let window;

  test.beforeAll(async () => {
    testContext = await launchTestApp();
    window = testContext.window;

    // Resetear DB a estado cero
    await window.evaluate(() => window.legisAPI.invoke('db:reset-for-tests', { onboardingCompleted: false }));
    
    // Registrar un admin para el test usando el wizard
    await window.getByTestId('btn-start-setup').click({ force: true });
    await window.getByTestId('admin-password-input').fill('Password123!');
    await window.getByTestId('admin-confirm-password-input').fill('Password123!');
    await window.getByTestId('btn-onboarding-next').click({ force: true });
    await window.getByTestId('chamber-name-input').fill('Cámara Agenda');
    await window.getByTestId('btn-onboarding-finish').click({ force: true });
    await window.getByTestId('btn-onboarding-start-using').click({ force: true });
    
    // Login
    await window.locator('input[type="password"]').fill('Password123!');
    await window.getByRole('button', { name: 'Acceder al Sistema' }).click({ force: true });
    
    await expect(window.getByRole('heading', { name: 'Dashboard' }).first()).toBeVisible({ timeout: 20000 });
  });

  test.afterAll(async () => {
    await cleanupTestApp(testContext);
  });

  test('Debe permitir crear y avanzar un proyecto de ley', async () => {
    // 1. Navegar a Agenda
    await window.getByTestId('nav-agenda').click();
    await expect(window.getByTestId('agenda-page-title')).toBeVisible();

    // 2. Abrir formulario
    await window.getByTestId('btn-new-project').click({ force: true });
    
    // 3. Llenar formulario
    const proyectoTitulo = `Proyecto E2E Test ${Date.now()}`;
    await window.getByTestId('project-title-input').fill(proyectoTitulo);
    
    // Seleccionar comisión. Esperar a que haya opciones.
    const comisionSelect = window.locator('select').nth(1);
    await expect(async () => {
      const count = await comisionSelect.locator('option').count();
      expect(count).toBeGreaterThan(0);
    }).toPass({ timeout: 15000 });

    if (await comisionSelect.isVisible()) {
      await comisionSelect.selectOption({ index: 0 });
    }

    // 4. Guardar
    await window.getByTestId('btn-save-project').click({ force: true });
    
    // 5. Verificar en Kanban (columna Estudio en Comisión)
    const card = window.getByText(proyectoTitulo).first();
    await expect(card).toBeVisible({ timeout: 20000 });

    // 6. Abrir detalle
    await card.click({ force: true });
    
    // Esperar a que el encabezado del detalle sea visible, con un selector de texto robusto
    await expect(window.locator('h2').getByText(proyectoTitulo).first()).toBeVisible({ timeout: 15000 });

    // 7. Avanzar fase (a 1ra Discusión)
    await window.getByRole('button', { name: /Avanzar a 1ra Discusión/i }).click({ force: true });
    await expect(window.getByText('Avanzado a: 1ra Discusión').first()).toBeVisible({ timeout: 10000 });

    // 8. Avanzar a la nueva fase (Consulta Pública)
    await window.getByRole('button', { name: 'Avanzar a Consulta Pública' }).click();
    await expect(window.getByText('Avanzado a: Consulta Pública').first()).toBeVisible({ timeout: 10000 });
    
    // Verificar que la fase actual en el detalle sea Consulta Pública
    await expect(window.locator('p.text-indigo-500').first()).toContainText('Consulta Pública');

    // Volver al tablero
    await window.getByText('Volver al Tablero').click();
  });
});
