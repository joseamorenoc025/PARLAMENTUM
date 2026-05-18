import { test, expect } from '@playwright/test';
import { launchTestApp, cleanupTestApp } from './electron-test-setup';
import fs from 'fs';
import path from 'path';

test.describe('Portal Export y Sincronización', () => {
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
    await window.getByTestId('chamber-name-input').fill('Cámara Sync');
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

  test('Debe generar el export del portal correctamente estructurado', async () => {
    // 1. Ir a Dashboard y hacer clic en forzar sincronización
    const syncBtn = window.getByRole('button', { name: /Sincronizar|Última vez/i }).first();
    await expect(syncBtn).toBeVisible();
    await syncBtn.click({ force: true });

    // Esperar un mensaje de sincronización completa (si existe, sino solo esperamos un poco)
    await window.waitForTimeout(3000);

    // 2. Leer los archivos JSON generados en la carpeta public/portal
    // Sabemos que el backend en modo test o dev podría estar exportando a public/portal.
    // Vamos a buscar el path real usando Node en el test.
    const portalPath = path.join(process.cwd(), 'public', 'portal');
    const proyectosPath = path.join(portalPath, 'proyectos.json');
    const leyesPath = path.join(portalPath, 'leyes.json');

    expect(fs.existsSync(proyectosPath)).toBe(true);
    expect(fs.existsSync(leyesPath)).toBe(true);

    const proyectos = JSON.parse(fs.readFileSync(proyectosPath, 'utf8'));
    const leyes = JSON.parse(fs.readFileSync(leyesPath, 'utf8'));

    expect(Array.isArray(proyectos)).toBe(true);
    expect(Array.isArray(leyes)).toBe(true);

    // Validar estructura de adjuntos en leyes (si las hay)
    if (leyes.length > 0) {
      expect(leyes[0]).toHaveProperty('adjuntos');
    }
  });
});
