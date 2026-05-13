import { _electron as electron } from '@playwright/test';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, readdirSync } from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Lanza la aplicación Electron para pruebas con un ambiente aislado.
 */
export async function launchTestApp() {
  // 1. Crear directorio temporal único para este test
  const testUserDataDir = await fs.mkdtemp(
    path.join(os.tmpdir(), 'cerebro-e2e-')
  );

  console.log(`[Test] Usando userDataDir aislado: ${testUserDataDir}`);

  // 2. Lanzar Electron apuntando a ese directorio limpio
  const electronApp = await electron.launch({
    args: [
      '.', 
      `--user-data-dir=${testUserDataDir}`, // CLAVE: Aísla datos
      '--test-mode=true',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage'
    ],
    env: {
      ...process.env,
      CEREBO_TEST_MODE: 'true',
      NODE_ENV: 'test'
    },
    cwd: path.join(__dirname, '../..'),
    timeout: 30000
  });

  // Capturar logs del proceso principal de Electron
  electronApp.process().stdout.on('data', data => console.log(`[MAIN-STDOUT] ${data.toString()}`));
  electronApp.process().stderr.on('data', data => console.error(`[MAIN-STDERR] ${data.toString()}`));

  const window = await electronApp.firstWindow({ timeout: 15000 });
  
  // Capturar logs de la consola para depuración
  window.on('console', msg => console.log(`[BROWSER] ${msg.text()}`));
  electronApp.on('window', async (win) => {
    win.on('console', msg => console.log(`[BROWSER-NEW] ${msg.text()}`));
  });

  // Esperar a que la app señale que está lista
  console.log('Esperando selector [data-testid="app-root"]...');
  try {
    await window.waitForSelector('[data-testid="app-root"]', { state: 'attached', timeout: 45000 });
    console.log('App Root detectado en el DOM.');
  } catch (e) {
    console.error('Timeout esperando [data-testid="app-root"]. Contenido de testUserDataDir:');
    if (existsSync(testUserDataDir)) {
      console.log(readdirSync(testUserDataDir));
    }
    throw e;
  }

  return { electronApp, window, testUserDataDir };
}

/**
 * Limpia el ambiente de pruebas.
 */
export async function cleanupTestApp({ electronApp, testUserDataDir }) {
  if (electronApp) {
    await electronApp.close();
  }
  
  // 3. ELIMINAR la carpeta temporal para limpiar rastro
  if (testUserDataDir && existsSync(testUserDataDir)) {
    try {
      // Pequeña espera para asegurar que los procesos de Electron soltaron los archivos
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fs.rm(testUserDataDir, { recursive: true, force: true });
      console.log(`[Test] Carpeta eliminada: ${testUserDataDir}`);
    } catch (e) {
      console.warn('[Test] No se pudo eliminar carpeta temporal:', testUserDataDir, e.message);
    }
  }
}
