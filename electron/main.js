import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import winston from 'winston';
import QRCode from 'qrcode';
import fs from 'fs';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { schema } from './src/db/schema.js';

// Cargar variables de entorno
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 📁 Rutas de datos persistentes
const userDataPath = app.getPath('userData');
const DB_PATH = path.join(userDataPath, 'legis.db');
const LOG_PATH = path.join(userDataPath, 'logs');
const BACKUP_PATH = path.join(userDataPath, 'backups');

// Asegurar que las carpetas existan
[LOG_PATH, BACKUP_PATH].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

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

// 🛠️ Migraciones de Esquema (Asegurar que existan nuevas columnas)
try {
  const tableInfo = db.prepare("PRAGMA table_info(commissions)").all();
  const columns = tableInfo.map(c => c.name);
  
  if (!columns.includes('vicepresidente_id')) {
    db.exec("ALTER TABLE commissions ADD COLUMN vicepresidente_id INTEGER REFERENCES legislators(id)");
  }
  if (!columns.includes('miembro_1_id')) {
    db.exec("ALTER TABLE commissions ADD COLUMN miembro_1_id INTEGER REFERENCES legislators(id)");
  }
  if (!columns.includes('miembro_2_id')) {
    db.exec("ALTER TABLE commissions ADD COLUMN miembro_2_id INTEGER REFERENCES legislators(id)");
  }
  if (!columns.includes('miembro_3_id')) {
    db.exec("ALTER TABLE commissions ADD COLUMN miembro_3_id INTEGER REFERENCES legislators(id)");
  }
  if (!columns.includes('miembro_3_nombre')) {
    db.exec("ALTER TABLE commissions ADD COLUMN miembro_3_nombre TEXT");
  }
} catch (err) {
  logger.error('Migration error:', err);
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

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// 🔌 IPC Handlers
ipcMain.handle('auth:hash', async (_, password) => {
  return await bcrypt.hash(password, 10);
});

ipcMain.handle('auth:verify', async (_, { password, hash }) => {
  return await bcrypt.compare(password, hash);
});

ipcMain.handle('db:backup:local', async () => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_PATH, `legis-backup-${timestamp}.db`);
    await db.backup(backupFile);
    return { success: true, path: backupFile };
  } catch (err) {
    logger.error('Backup error:', err);
    return { success: false, error: err.message };
  }
});

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
