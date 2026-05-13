import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 📁 Importar dbManager (sin ejecutar nada al nivel superior)
import { dbManager } from './src/db/index.js';
import { logger } from './src/lib/logger.js';
import { setupIPCHandlers } from './src/ipc/handlers.js';
import { setupSyncHandlers } from './src/modules/sync/index.js';
import { setupBackupHandlers } from './src/ipc/backup.handlers.js';
import { analytics } from './src/services/analytics.js';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'Segundo Cerebro Legislativo',
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173/app.html');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/app.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    console.log('[MAIN] Starting application initialization...');

    // 1. Inicializar DB y Migraciones
    await dbManager.initialize({
      dataDir: app.getPath('userData'),
      testMode: process.env.CEREBO_TEST_MODE === 'true'
    });

    // 2. Inicializar servicios que dependen de DB
    await analytics.init();
    await setupSyncHandlers();
    
    // 3. Crear ventana y registrar handlers IPC
    createWindow();
    setupIPCHandlers(mainWindow);
    setupBackupHandlers(mainWindow);

    // 4. Configuración de Auto-Updates
    if (process.env.NODE_ENV !== 'development') {
      autoUpdater.checkForUpdatesAndNotify();
    }

    autoUpdater.on('update-available', () => {
      logger.info('Update available');
    });

    autoUpdater.on('update-downloaded', () => {
      dialog.showMessageBox({
        type: 'info',
        title: 'Actualización Lista',
        message: 'Una nueva versión ha sido descargada. ¿Deseas reiniciar para aplicar los cambios?',
        buttons: ['Reiniciar y Actualizar', 'Más tarde']
      }).then((result) => {
        if (result.response === 0) autoUpdater.quitAndInstall();
      });
    });

    console.log('[MAIN] Initialization complete.');
  } catch (error) {
    console.error('[MAIN] FATAL STARTUP ERROR:', error);
    dialog.showErrorBox('Error de Inicio', `No se pudo inicializar la aplicación:\n${error.message}`);
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
