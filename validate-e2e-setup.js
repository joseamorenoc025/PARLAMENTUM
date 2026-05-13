import { _electron as electron } from '@playwright/test';
import path from 'path';

(async () => {
  try {
    console.log('Iniciando lanzamiento de prueba...');
    const app = await electron.launch({
      args: ['.', '--no-sandbox', '--disable-gpu'],
      env: { 
        ...process.env,
        NODE_ENV: 'test', 
        CEREBO_TEST_MODE: 'true' 
      },
      cwd: process.cwd(),
      timeout: 30000
    });
    console.log('✅ Electron launched');
    
    const win = await app.firstWindow({ timeout: 15000 });
    console.log('✅ Window opened');
    
    // Esperar a que la app señale que está lista
    await win.waitForFunction(() => window.__CEREBO_READY === true, { timeout: 30000 });
    console.log('✅ Cerebro signal received');

    const appRoot = await win.waitForSelector('[data-testid="app-root"]', { timeout: 15000 });
    if (appRoot) {
      console.log('✅ app-root found');
    }
    
    await app.close();
    console.log('✅ Test launch complete');
    process.exit(0);
  } catch (e) {
    console.error('❌ Launch failed:', e.message);
    process.exit(1);
  }
})();
