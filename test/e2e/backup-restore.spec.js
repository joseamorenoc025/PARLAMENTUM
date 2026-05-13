import { test, expect } from '@playwright/test';
import { launchTestApp, cleanupTestApp } from './electron-test-setup';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.describe('Backup Restore Flow', () => {
  let testContext;
  const FIXTURE_PATH = path.join(__dirname, '../fixtures/valid-backup.clbak');
  const TEST_PASSWORD = 'Test1234!';

  test.beforeEach(async () => {
    testContext = await launchTestApp();
  });

  test.afterEach(async () => {
    await cleanupTestApp(testContext);
  });

  test('Debe restaurar backup .clbak y redirigir al Dashboard', async () => {
    const { window } = testContext;
    
    // 1. Ir al paso de restauración
    await expect(window.getByTestId('onboarding-welcome-title')).toBeVisible({ timeout: 15000 });
    
    // El botón en OnboardingWizard.jsx tiene el texto "Restaurar desde backup"
    await window.getByText('Restaurar desde backup').click({ force: true });
    await expect(window.getByTestId('backup-restore-step')).toBeVisible();
    
    // 2. Seleccionar archivo .clbak
    const fileInput = window.getByTestId('backup-file-input');
    await fileInput.setInputFiles(FIXTURE_PATH);
    await expect(window.getByTestId('selected-file-name')).toContainText('valid-backup.clbak');
    
    // 3. Ingresar contraseña correcta
    await window.getByTestId('backup-password-input').fill(TEST_PASSWORD);
    
    // 4. Ejecutar restauración
    await window.getByTestId('btn-validate-restore').click({ force: true });
    
    // 5. Esperar redirección al Dashboard
    // Nota: Si la DB no es válida, fallará aquí, pero estamos probando el flujo.
    await expect(window.getByTestId('dashboard-title')).toBeVisible({ timeout: 20000 });
  });

  test('Debe mostrar error genérico con contraseña incorrecta', async () => {
    const { window } = testContext;
    await expect(window.getByTestId('onboarding-welcome-title')).toBeVisible({ timeout: 15000 });
    await window.getByText('Restaurar desde backup').click({ force: true });
    
    const fileInput = window.getByTestId('backup-file-input');
    await fileInput.setInputFiles(FIXTURE_PATH);
    
    await window.getByTestId('backup-password-input').fill('ContraseñaIncorrecta123');
    await window.getByTestId('btn-validate-restore').click({ force: true });
    
    // Error genérico
    await expect(window.getByTestId('restore-error')).toBeVisible({ timeout: 10000 });
    await expect(window.getByTestId('restore-error-message')).toContainText('La contraseña es incorrecta');
  });

  test('Debe rechazar archivos con extensión no soportada', async () => {
    const { window } = testContext;
    await expect(window.getByTestId('onboarding-welcome-title')).toBeVisible({ timeout: 15000 });
    await window.getByText('Restaurar desde backup').click({ force: true });
    
    const tempInvalid = path.join(__dirname, '../fixtures/invalid-backup.txt');
    await fs.writeFile(tempInvalid, 'fake content');
    
    const fileInput = window.getByTestId('backup-file-input');
    await fileInput.setInputFiles(tempInvalid);
    
    await expect(window.getByTestId('file-extension-error')).toBeVisible({ timeout: 5000 });
    await fs.unlink(tempInvalid).catch(() => {});
  });
});
