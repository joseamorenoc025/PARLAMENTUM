import { test, expect } from '@playwright/test';
import { launchTestApp, cleanupTestApp } from './electron-test-setup';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Suite de Pruebas de Flujo Legislativo Completo
 * Incluye validación de Temas (Dark/Light) en cada módulo.
 */
test.describe('Flujo Legislativo y UX Transversal', () => {
  let testContext;
  let window;

  test.beforeAll(async () => {
    // 1. Lanzar app en un entorno aislado y limpio
    testContext = await launchTestApp();
    window = testContext.window;

    // 2. Completar el Onboarding Wizard para crear el admin
    await window.getByTestId('btn-start-setup').click({ force: true });
    await window.getByTestId('admin-password-input').fill('Password123!');
    await window.getByTestId('admin-confirm-password-input').fill('Password123!');
    await window.getByTestId('btn-onboarding-next').click({ force: true });
    await window.getByTestId('chamber-name-input').fill('Cámara Workflow');
    await window.getByTestId('btn-onboarding-finish').click({ force: true });
    await window.getByTestId('btn-onboarding-start-using').click({ force: true });

    // 3. Iniciar sesión y validar Dashboard
    await window.locator('input[type="password"]').fill('Password123!');
    await window.getByRole('button', { name: 'Acceder al Sistema' }).click({ force: true });
    await expect(window.getByRole('banner').getByText('Dashboard').first()).toBeVisible({ timeout: 10000 });
  });

  test.afterAll(async () => {
    await cleanupTestApp(testContext);
  });

  test('Configuración Inicial y Dashboard (Modo Oscuro/Claro)', async () => {
    // Verificar Dashboard (ahora debería estar visible por defecto gracias al beforeAll)
    await expect(window.getByRole('banner').getByText('Dashboard').first()).toBeVisible({ timeout: 10000 });
    
    // Test de Tema Transversal
    const body = window.locator('body');
    const themeBtn = window.locator('header button:has(svg.lucide-sun), header button:has(svg.lucide-moon)').last();
    
    // Verificar estado inicial (Oscuro por defecto)
    await expect(body.locator('xpath=..')).toHaveClass(/dark/);
    
    // Cambiar a Claro
    await themeBtn.click();
    await expect(body.locator('xpath=..')).not.toHaveClass(/dark/);
    
    // Regresar a Oscuro para los siguientes tests
    await themeBtn.click();
  });

  test('Ciclo de Vida de Proyectos en Agenda', async () => {
    // 1. Navegar a Agenda
    await window.getByTestId('nav-agenda').click();
    await expect(window.locator('h1')).toContainText('Agenda Legislativa');
    // 2. Crear Nuevo Proyecto
    await window.getByTestId('btn-new-project').click({ force: true });
    await window.getByTestId('project-title-input').fill('Proyecto de Prueba E2E');
    await window.fill('input[placeholder*="Google Drive Link"]', 'https://drive.google.com/test-e2e');
    
    await window.getByTestId('btn-save-project').click({ force: true });
    
    // 3. Verificar creación en vista Kanban o Lista
    await expect(window.locator('text=Proyecto de Prueba E2E')).toBeVisible();

    // 4. Probar Edición (Sincronización de Drive)
    // Buscamos el botón de editar en la tarjeta
    await window.click('button[title="Editar proyecto"]');
    await window.fill('input[placeholder*="https://drive.google.com"]', 'https://drive.google.com/updated-link');
    await window.getByTestId('btn-save-project').click({ force: true });
    
    await expect(window.locator('text=Proyecto guardado exitosamente')).toBeVisible();
  });

  test('Módulo de Acuerdos y Acceso QR', async () => {
    // 1. Navegar a Acuerdos
    await window.getByTestId('nav-acuerdos').click();
    await expect(window.locator('h1').first()).toContainText('Acuerdos de Cámara');
    
    // Crear PDF falso para probar ingesta y QR
    const tempPdfPath = path.join(os.tmpdir(), `test_acuerdo_${Date.now()}.pdf`);
    fs.writeFileSync(tempPdfPath, 'fake pdf content for agreement');

    // 2. Crear Acuerdo
    await window.click('button:has-text("Nuevo Acuerdo")');
    await window.fill('input[placeholder="Ej: 001-2024"]', 'ACU-2026-001');
    await window.fill('textarea[placeholder*="objeto"]', 'Acuerdo de prueba para validación de flujo E2E.');
    await window.fill('input[placeholder*="drive.google.com"]', 'https://drive.google.com/acuerdo-test');
    
    // Inyectar el mock en la ventana para dialog:open-pdf
    await window.evaluate((pdfPath) => {
      const originalInvoke = window.legisAPI.invoke;
      window.legisAPI.invoke = async (channel, ...args) => {
        if (channel === 'dialog:open-pdf') {
          return pdfPath;
        }
        return originalInvoke(channel, ...args);
      };
    }, tempPdfPath);

    // Adjuntar PDF local
    await window.getByRole('button', { name: /Seleccionar PDF desde mi PC/i }).click();
    await expect(window.getByText(path.basename(tempPdfPath)).first()).toBeVisible();

    await window.click('button:has-text("Registrar")');

    // 3. Verificar visibilidad y QR
    await expect(window.locator('text=ACU-2026-001')).toBeVisible();
    
    // Probar apertura de QR (abre nueva ventana en Electron)
    await window.click('button[title="QR Acceso"]');
    // Nota: Validar que no hay errores al abrir la ventana popup

    // 4. Probar "Estampar QR" en PDF
    const estamparBtn = window.getByRole('button', { name: /Estampar QR/i }).first();
    await expect(estamparBtn).toBeVisible();
    
    // Interceptamos pdf:stamp-qr para no fallar si no hay PDFLib/Ghostscript real en CI
    await window.evaluate(() => {
      window.legisAPI.invoke = async (channel, ...args) => {
        if (channel === 'pdf:stamp-qr') return { success: true };
        if (channel === 'dialog:open-pdf') return null;
        // Restaurar para otros (solo mockeamos stamp)
      };
    });

    await estamparBtn.click();
    await expect(window.getByText('QR estampado exitosamente').first()).toBeVisible({ timeout: 15000 });

    if (fs.existsSync(tempPdfPath)) {
      fs.unlinkSync(tempPdfPath);
    }
  });

  test('Integridad Visual y Logout', async () => {
    // Volver a dashboard
    await window.getByTestId('nav-dashboard').click({ force: true });
    
    // Logout
    await window.click('button:has-text("Cerrar Sesión")');
    await expect(window.locator('h1')).toContainText('Segundo Cerebro');
  });
});
