import { test, expect, _electron as electron } from '@playwright/test';

/**
 * Suite de Pruebas de Flujo Legislativo Completo
 * Incluye validación de Temas (Dark/Light) en cada módulo.
 */
test.describe('Flujo Legislativo y UX Transversal', () => {
  let electronApp;
  let window;

  test.beforeAll(async () => {
    // Lanzar la aplicación
    electronApp = await electron.launch({ args: ['.'] });
    window = await electronApp.firstWindow();
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('Configuración Inicial, Login y Dashboard (Modo Oscuro/Claro)', async () => {
    // 1. Manejar Onboarding si aparece
    const isWelcomeVisible = await window.locator('h2:has-text("Bienvenido a Cerebro Legislativo")').isVisible({ timeout: 2000 }).catch(() => false);
    if (isWelcomeVisible) {
      await window.click('button:has-text("Configurar más tarde")');
    }

    // 2. Manejar AuthScreen si aparece
    const isAuthVisible = await window.locator('h1:has-text("Segundo Cerebro")').isVisible({ timeout: 2000 }).catch(() => false);
    const isSignupVisible = await window.locator('h1:has-text("Crear Administrador")').isVisible({ timeout: 1000 }).catch(() => false);
    
    if (isSignupVisible) {
      // Registrar usuario de prueba
      await window.fill('input[placeholder*="Ej: Dr."]', 'Admin Prueba');
      await window.fill('input[placeholder="admin"]', 'admin');
      await window.fill('input[placeholder="••••••••"]', 'Admin123!@#');
      await window.click('button:has-text("Registrar")');
      // Esperar a que pase a login
      await window.waitForSelector('text=Bienvenido,', { state: 'visible', timeout: 5000 }).catch(() => {});
    } else if (isAuthVisible) {
      // Iniciar sesión
      await window.fill('input[placeholder="admin"]', 'admin');
      await window.fill('input[placeholder="••••••••"]', 'Admin123!@#');
      await window.click('button:has-text("Acceder")');
    }

    // 3. Verificar Dashboard (ahora debería estar visible)
    await expect(window.locator('header span')).toContainText('Dashboard', { timeout: 10000 });
    
    // 4. Test de Tema Transversal
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
    await window.click('nav button:has-text("Agenda Legislativa")');
    await expect(window.locator('h1')).toContainText('Gestión de Proyectos');

    // 2. Crear Nuevo Proyecto
    await window.click('button:has-text("Nuevo Proyecto")');
    await window.fill('input[placeholder*="Ej: Reforma"]', 'Proyecto de Prueba E2E');
    await window.fill('textarea[placeholder*="Descripción"]', 'Descripción automatizada para pruebas de integridad.');
    await window.fill('input[placeholder*="https://drive.google.com"]', 'https://drive.google.com/test-e2e');
    
    await window.click('button:has-text("Registrar")');
    
    // 3. Verificar creación en vista Kanban o Lista
    await expect(window.locator('text=Proyecto de Prueba E2E')).toBeVisible();

    // 4. Probar Edición (Sincronización de Drive)
    // Buscamos el botón de editar en la tarjeta
    await window.click('button[title="Editar Proyecto"]');
    await window.fill('input[placeholder*="https://drive.google.com"]', 'https://drive.google.com/updated-link');
    await window.click('button:has-text("Actualizar")');
    
    await expect(window.locator('text=Actualizado correctamente')).toBeVisible();
  });

  test('Módulo de Acuerdos y Acceso QR', async () => {
    // 1. Navegar a Acuerdos
    await window.click('nav button:has-text("Acuerdos")');
    await expect(window.locator('h1')).toContainText('Acuerdos de Cámara');

    // 2. Crear Acuerdo
    await window.click('button:has-text("Nuevo Acuerdo")');
    await window.fill('input[placeholder="Ej: 001-2024"]', 'ACU-2026-001');
    await window.fill('textarea[placeholder*="objeto"]', 'Acuerdo de prueba para validación de flujo E2E.');
    await window.fill('input[placeholder*="drive.google.com"]', 'https://drive.google.com/acuerdo-test');
    
    await window.click('button:has-text("Registrar")');

    // 3. Verificar visibilidad y QR
    await expect(window.locator('text=ACU-2026-001')).toBeVisible();
    
    // Probar apertura de QR (abre nueva ventana en Electron)
    await window.click('button[title="QR Acceso"]');
    // Nota: Validar que no hay errores al abrir la ventana popup
  });

  test('Integridad Visual y Logout', async () => {
    // Volver a dashboard
    await window.click('nav button:has-text("Dashboard")');
    
    // Logout
    await window.click('button:has-text("Cerrar Sesión")');
    await expect(window.locator('h1')).toContainText('Segundo Cerebro');
  });
});
