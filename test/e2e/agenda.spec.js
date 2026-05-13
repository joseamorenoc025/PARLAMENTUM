import { test, _electron as electron, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

test.describe('Agenda Legislativa', () => {
  let electronApp;
  let window;
  let userDataDir;

  test.beforeAll(async () => {
    userDataDir = path.join(os.tmpdir(), `cerebro-test-agenda-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    
    electronApp = await electron.launch({ 
      args: ['.', `--user-data-dir=${userDataDir}`] 
    });
    
    window = await electronApp.firstWindow();
    await window.waitForLoadState('networkidle');

    // Verificar salud
    await expect(async () => {
      const health = await window.evaluate(() => window.legisAPI.invoke('app:health'));
      expect(health.status).toBe('ok');
    }).toPass({ timeout: 15000 });

    // Esperar a que el spinner de carga desaparezca
    await expect(window.locator('.animate-spin')).not.toBeVisible({ timeout: 30000 });

    // Manejar Onboarding si aparece
    const skipButton = window.locator('button:has-text("Configurar más tarde")');
    if (await skipButton.isVisible()) {
      await skipButton.click({ force: true });
      await window.waitForTimeout(500);
    }

    // Registrar un admin para el test
    await window.getByRole('button', { name: 'Registrar nuevo Administrador' }).click({ force: true });
    await window.getByPlaceholder('Ej: Dr. Juan Pérez').fill('Agenda Admin');
    await window.getByPlaceholder('admin').fill('admin_agenda');
    await window.locator('input[type="password"]').fill('Password123!@#');
    await window.getByRole('button', { name: 'Registrar y Configurar' }).click({ force: true });
    
    // Login
    await window.getByPlaceholder('admin').fill('admin_agenda');
    await window.locator('input[type="password"]').fill('Password123!@#');
    await window.getByRole('button', { name: 'Acceder al Sistema' }).click({ force: true });
    
    await expect(window.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 20000 });
  });

  test.afterAll(async () => {
    await electronApp.close();
    if (fs.existsSync(userDataDir)) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        fs.rmSync(userDataDir, { recursive: true, force: true });
      } catch (e) {
        console.warn('Could not clean up userDataDir:', userDataDir);
      }
    }
  });

  test('Debe permitir crear y avanzar un proyecto de ley', async () => {
    // 1. Navegar a Agenda
    await window.getByRole('button', { name: 'Agenda Legislativa' }).click({ force: true });
    await expect(window.getByRole('heading', { name: 'Agenda Legislativa' })).toBeVisible();

    // 2. Abrir formulario
    await window.getByRole('button', { name: 'Nuevo Proyecto' }).click({ force: true });
    
    // 3. Llenar formulario
    const proyectoTitulo = `Proyecto E2E Test ${Date.now()}`;
    await window.getByPlaceholder('Escribe el título institucional completo...').fill(proyectoTitulo);
    
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
    await window.getByRole('button', { name: 'Registrar Proyecto' }).click({ force: true });

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
    await window.getByRole('button', { name: 'Volver al Tablero' }).click();
  });
});
