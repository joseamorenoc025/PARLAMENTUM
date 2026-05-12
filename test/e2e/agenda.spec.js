import { test, _electron as electron, expect } from '@playwright/test';

test.describe('Agenda Legislativa', () => {
  let electronApp;
  let window;

  test.beforeAll(async () => {
    electronApp = await electron.launch({ args: ['.'] });
    window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // Manejar Login si es necesario
    const isLoginVisible = await window.isVisible('button:has-text("Acceder al Sistema")');
    if (isLoginVisible) {
      await window.fill('input[placeholder="admin"]', 'admin');
      await window.fill('input[placeholder="••••••••"]', 'admin123'); // Asumiendo credenciales por defecto para el test
      await window.click('button:has-text("Acceder al Sistema")');
      await expect(window.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    }
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('Debe permitir crear y avanzar un proyecto de ley', async () => {
    // 1. Navegar a Agenda
    await window.click('button:has-text("Agenda Legislativa")');
    await expect(window.locator('h1')).toContainText('Agenda Legislativa');

    // 2. Abrir formulario
    await window.click('button:has-text("Nuevo Proyecto")');
    
    // 3. Llenar formulario
    const proyectoTitulo = `Proyecto E2E Test ${Date.now()}`;
    await window.fill('textarea[placeholder="Escribe el título institucional completo..."]', proyectoTitulo);
    
    // Seleccionar comisión si es necesario (el primero disponible)
    const comisionSelect = window.locator('select').nth(1);
    if (await comisionSelect.isVisible()) {
      await comisionSelect.selectOption({ index: 1 });
    }

    // 4. Guardar
    await window.click('button:has-text("Registrar Proyecto")');

    // 5. Verificar en Kanban (columna Estudio en Comisión)
    await expect(window.locator(`text=${proyectoTitulo}`)).toBeVisible();

    // 6. Abrir detalle
    await window.click(`text=${proyectoTitulo}`);
    await expect(window.locator('h2')).toContainText(proyectoTitulo);

    // 7. Avanzar fase (a 1ra Discusión)
    await window.click('button:has-text("Avanzar a 1ra Discusión")');
    await expect(window.locator('text=Avanzado a: 1ra Discusión')).toBeVisible();

    // 8. Avanzar a la nueva fase (Consulta Pública)
    await window.click('button:has-text("Avanzar a Consulta Pública")');
    await expect(window.locator('text=Avanzado a: Consulta Pública')).toBeVisible();
    
    // Verificar que la fase actual en el detalle sea Consulta Pública
    await expect(window.locator('p.text-indigo-500')).toContainText('Consulta Pública');

    // Volver al tablero
    await window.click('button:has-text("Volver al Tablero")');
  });
});
