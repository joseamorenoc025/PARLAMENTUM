import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import winston from 'winston';
import QRCode from 'qrcode';
import fs from 'fs';
import * as dotenv from 'dotenv';
import { schema } from './src/db/schema.js';

// Cargar variables de entorno
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 📁 Rutas de datos persistentes
const userDataPath = app.getPath('userData');
const DB_PATH = path.join(userDataPath, 'legis.db');
const LOG_PATH = path.join(userDataPath, 'logs');

// Asegurar que las carpetas existan
if (!fs.existsSync(LOG_PATH)) {
  fs.mkdirSync(LOG_PATH, { recursive: true });
}

// 🪵 Configuración de Winston (Logger Profesional)
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: path.join(LOG_PATH, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(LOG_PATH, 'combined.log') }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// 🗄️ Inicializar Base de Datos
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// 🚀 Inicializar esquema si no existe
db.exec(schema);

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

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// 🔌 IPC Handlers
ipcMain.handle('log', (_, { level, message }) => {
  logger.log(level, message);
  return true;
});

ipcMain.handle('qr:generate', async (_, data) => {
  try {
    return await QRCode.toDataURL(data);
  } catch (err) {
    logger.error('Error generating QR:', err);
    throw err;
  }
});

// Manejador genérico para consultas a la DB
ipcMain.handle('db:query', (_, { sql, params = [] }) => {
  try {
    const stmt = db.prepare(sql);
    if (sql.trim().toLowerCase().startsWith('select')) {
      return stmt.all(...params);
    } else {
      return stmt.run(...params);
    }
  } catch (err) {
    logger.error('Database query error:', err);
    throw err;
  }
});
