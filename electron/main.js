import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import * as dotenv from 'dotenv';
import { db, sqlite } from './src/db/index.js';
import { runMigrations } from './src/db/migrate.js';
import { logger } from './src/lib/logger.js';
import { setupIPCHandlers } from './src/ipc/handlers.js';

// Cargar variables de entorno
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 📁 Rutas de datos persistentes
const userDataPath = app.getPath('userData');
const DB_PATH = path.join(userDataPath, 'legis.db');
const BACKUP_PATH = path.join(userDataPath, 'backups');

// Asegurar que las carpetas existan
[BACKUP_PATH].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// 🚀 Ejecutar Migraciones Robustas
try {
  runMigrations(DB_PATH);
} catch (err) {
  logger.error('Critical: Migration failed', err);
}

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
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  
  // Inicializar handlers de IPC una sola vez al arrancar
  setupIPCHandlers(mainWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      // Si la ventana se recrea, podrías necesitar actualizar la referencia en los handlers si estos la usan
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

