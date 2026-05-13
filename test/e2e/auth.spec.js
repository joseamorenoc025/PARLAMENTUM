import { test, _electron as electron, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

test.describe('Autenticación', () => {
  let electronApp;
  let window;
  let userDataDir;

  test.beforeEach(async () => {
    // Directorio único por cada TEST para evitar contaminación entre pruebas
    userDataDir = path.join(os.tmpdir(), `cerebro-test-auth-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    
    electronApp = await electron.launch({ 
      args: ['.', `--user-data-dir=${userDataDir}`] 
    });
    
    window = await electronApp.firstWindow();
    await window.waitForLoadState('networkidle');

    // Verificar salud de la app e IPC antes de proceder
    await expect(async () => {
      const health = await window.evaluate(() => window.legisAPI.invoke('app:health'));
      expect(health.status).toBe('ok');
    }).toPass({ timeout: 10000 });

    // Esperar a que desaparezca cualquier spinner inicial
    const loader = window.locator('.animate-spin');
    if (await loader.isVisible()) {
      await loader.waitFor({ state: 'detached', timeout: 30000 });
    }

    // Saltar onboarding si es necesario para llegar al login
    const skipButton = window.locator('button:has-text("Configurar más tarde")');
    if (await skipButton.isVisible()) {
      await skipButton.click({ force: true });
      await window.waitForTimeout(500); // Pequeña pausa para transición
    }
  });

  test.afterEach(async () => {
    await electronApp.close();
    if (fs.existsSync(userDataDir)) {
      try {
        // En Windows, fs.rmSync puede fallar si el proceso de Electron aún tiene bloqueado el archivo
        // Intentamos limpiar con un pequeño delay o ignoramos el error ya que es temporal
        await new Promise(resolve => setTimeout(resolve, 1000));
        fs.rmSync(userDataDir, { recursive: true, force: true });
      } catch (e) {
        console.warn('Could not clean up userDataDir (process lock):', userDataDir);
      }
    }
  });

  test.skip('Debe mostrar error con credenciales inválidas', async () => {
    await window.getByPlaceholder('admin').fill('usuario_inexistente');
    const passwordInput = window.locator('input[type="password"]');
    await passwordInput.fill('wrongpassword');
    
    // Presionar Enter es más robusto en Electron que un clic forzado
    await passwordInput.press('Enter');

    // Esperar por el texto del toast sin depender de atributos internos de Sonner
    // Aumentamos el timeout para dar tiempo a la animación de React
    await expect(window.getByText('Usuario no encontrado').first()).toBeVisible({ timeout: 15000 });
  });

  test('Debe permitir registrar un nuevo administrador y loguearse', async () => {
    await window.getByRole('button', { name: 'Registrar nuevo Administrador' }).click();
    
    const timestamp = Date.now();
    const username = `admin_${timestamp}`;
    
    await window.getByPlaceholder('Ej: Dr. Juan Pérez').fill('Admin de Prueba');
    await window.getByPlaceholder('admin').fill(username);
    await window.locator('input[type="password"]').fill('Password123!@#');
    
    await window.getByRole('button', { name: 'Registrar y Configurar' }).click();
    
    // Esperar a que el formulario desaparezca y estemos en el login
    await expect(window.getByText('Segundo Cerebro')).toBeVisible();

    // Loguearse con el nuevo usuario
    await window.getByPlaceholder('admin').fill(username);
    await window.locator('input[type="password"]').fill('Password123!@#');
    await window.getByRole('button', { name: 'Acceder al Sistema' }).click();

    // Verificar que entró al Dashboard
    await expect(window.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 20000 });
    // Verificar nombre de usuario en el sidebar, evitando ambigüedad con posibles toasts
    await expect(window.locator('aside').getByText('Admin de Prueba')).toBeVisible();
  });

  test('Debe permitir cerrar sesión', async () => {
    // Primero debemos estar logueados (usamos un setup rápido para este test)
    await window.getByRole('button', { name: 'Registrar nuevo Administrador' }).click();
    await window.getByPlaceholder('Ej: Dr. Juan Pérez').fill('Logout User');
    await window.getByPlaceholder('admin').fill('logout_test');
    await window.locator('input[type="password"]').fill('Password123!@#');
    await window.getByRole('button', { name: 'Registrar y Configurar' }).click();
    
    await window.getByPlaceholder('admin').fill('logout_test');
    await window.locator('input[type="password"]').fill('Password123!@#');
    await window.getByRole('button', { name: 'Acceder al Sistema' }).click();

    await expect(window.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    
    // Cerrar sesión
    await window.getByRole('button', { name: 'Cerrar Sesión' }).click();
    await expect(window.getByText('Segundo Cerebro')).toBeVisible();
  });
});
