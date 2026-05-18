import { test, expect } from '@playwright/test';
import { launchTestApp, cleanupTestApp } from './electron-test-setup';
import fs from 'fs';
import path from 'path';
import os from 'os';

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

    // Seed database with a commission and legislator BEFORE reloading and logging in
    await window.evaluate(async () => {
      await window.legisAPI.invoke('db:upsert', { 
        table: 'commissions', 
        data: { nombre: 'Comisión de Educación, Cultura y Deportes', activo: 1 } 
      });
      await window.legisAPI.invoke('db:upsert', { 
        table: 'legislators', 
        data: { nombre: 'Dip. E2E Test Ponente', activo: 1 } 
      });
    });

    // Reload window so React loads the seeded data on initial render
    await window.reload();
    await window.waitForSelector('[data-testid="app-root"]', { state: 'attached', timeout: 30000 });
    
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
      expect(count).toBeGreaterThan(1);
    }).toPass({ timeout: 15000 });

    if (await comisionSelect.isVisible()) {
      await comisionSelect.selectOption({ index: 1 });
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

  test('Debe permitir adjuntar documentos PDF por fase', async () => {
    // 1. Crear un archivo PDF temporal real para que el backend lo pueda copiar
    const tempPdfPath = path.join(os.tmpdir(), `test_doc_${Date.now()}.pdf`);
    fs.writeFileSync(tempPdfPath, 'fake pdf content');

    // 2. Navegar a Agenda y abrir un proyecto
    await window.getByTestId('nav-agenda').click();
    await window.getByTestId('agenda-page-title').waitFor({ state: 'visible' });
    
    // Crear proyecto para asegurar que tenemos uno
    await window.getByTestId('btn-new-project').click({ force: true });
    const proyectoDoc = `Proyecto Docs E2E ${Date.now()}`;
    await window.getByTestId('project-title-input').fill(proyectoDoc);
    
    // Seleccionar comisión
    const comisionSelect = window.locator('select').nth(1);
    await expect(async () => {
      const count = await comisionSelect.locator('option').count();
      expect(count).toBeGreaterThan(1);
    }).toPass({ timeout: 15000 });
    await comisionSelect.selectOption({ index: 1 });

    await window.getByTestId('btn-save-project').click({ force: true });
    
    const card = window.getByText(proyectoDoc).first();
    await expect(card).toBeVisible({ timeout: 20000 });
    await card.click({ force: true });
    await expect(window.locator('h2').getByText(proyectoDoc).first()).toBeVisible();

    // 3. Inyectar el mock escribiendo en mock_open_pdf_path.txt en testUserDataDir
    fs.writeFileSync(path.join(testContext.testUserDataDir, 'mock_open_pdf_path.txt'), tempPdfPath);

    // 4. Hacer clic en "Adjuntar PDF Local" en la fase actual
    const attachBtn = window.getByRole('button', { name: /Adjuntar PDF Local/i }).first();
    await expect(attachBtn).toBeVisible();
    await attachBtn.click({ force: true });

    // 5. Verificar que se muestra el mensaje de éxito
    await expect(window.getByText('PDF cargado exitosamente en Bóveda').first()).toBeVisible({ timeout: 15000 });

    // 6. Verificar que la UI muestra el archivo vinculado
    const fileNameElement = window.getByText(path.basename(tempPdfPath)).first();
    await expect(fileNameElement).toBeVisible();

    // Limpiar archivo temporal
    if (fs.existsSync(tempPdfPath)) {
      fs.unlinkSync(tempPdfPath);
    }
  });
});
