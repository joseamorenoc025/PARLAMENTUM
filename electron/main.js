import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import QRCode from 'qrcode';
import fs from 'fs';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { db, sqlite } from './src/db/index.js';
import { runMigrations } from './src/db/migrate.js';
import * as schema from './src/db/schema.js';
import { eq, like, desc, sql as drizzleSql } from 'drizzle-orm';

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
    await sqlite.backup(backupFile);
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

// Manejador genérico para consultas a la DB (Legacy support)
ipcMain.handle('db:query', (_, { sql, params = [] }) => {
  try {
    const stmt = sqlite.prepare(sql);
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

// --- Nuevos Handlers usando Drizzle ---

// Stats
ipcMain.handle('db:get-stats', async () => {
  try {
    const leyesCount = db.select({ count: drizzleSql`count(*)` }).from(schema.laws).all();
    const sesionesCount = db.select({ count: drizzleSql`count(*)` }).from(schema.sessions).where(eq(schema.sessions.activo, 1)).all();
    const proyectosCount = db.select({ count: drizzleSql`count(*)` }).from(schema.projects).where(eq(schema.projects.activo, 1)).all();
    
    return {
      leyes: leyesCount[0]?.count || 0,
      sesiones: sesionesCount[0]?.count || 0,
      proyectos: proyectosCount[0]?.count || 0,
    };
  } catch (err) {
    logger.error('Drizzle stats error:', err);
    throw err;
  }
});

// Auth & Users
ipcMain.handle('auth:get-user', async (_, username) => {
  try {
    const results = db.select().from(schema.users).where(eq(schema.users.username, username)).all();
    return results[0] || null;
  } catch (err) {
    logger.error('Auth get user error:', err);
    throw err;
  }
});

ipcMain.handle('auth:update-login', async (_, id) => {
  try {
    return db.update(schema.users)
      .set({ ultimoLogin: new Date().toISOString() })
      .where(eq(schema.users.id, id))
      .run();
  } catch (err) {
    logger.error('Auth update login error:', err);
    throw err;
  }
});

// CRUD Genérico (Aproximación inicial para migración rápida)
ipcMain.handle('db:select', async (_, { table, where = {} }) => {
  try {
    const tableSchema = schema[table];
    if (!tableSchema) throw new Error(`Table ${table} not found in schema`);
    
    let queryBuilder = db.select().from(tableSchema);
    
    // Filtro simple por activo=1 por defecto si la columna existe
    if (tableSchema.activo) {
      queryBuilder = queryBuilder.where(eq(tableSchema.activo, 1));
    }

    return queryBuilder.all();
  } catch (err) {
    logger.error(`Select error [${table}]:`, err);
    throw err;
  }
});

ipcMain.handle('db:upsert', async (_, { table, data }) => {
  try {
    const tableSchema = schema[table];
    if (!tableSchema) throw new Error(`Table ${table} not found in schema`);

    if (data.id) {
      const { id, ...updateData } = data;
      return db.update(tableSchema)
        .set(updateData)
        .where(eq(tableSchema.id, id))
        .run();
    } else {
      return db.insert(tableSchema)
        .values(data)
        .run();
    }
  } catch (err) {
    logger.error(`Upsert error [${table}]:`, err);
    throw err;
  }
});
