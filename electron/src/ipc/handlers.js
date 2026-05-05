import { ipcMain, dialog, app } from 'electron';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import path from 'path';
import { db, sqlite } from '../db/index.js';
import * as schema from '../db/schema.js';
import { eq, sql as drizzleSql } from 'drizzle-orm';
import { logger } from '../lib/logger.js';
import { validateIPCInput } from './validate.js';
import { authVerifySchema, authGetUserSchema, authUpdateLoginSchema } from './schemas/auth.js';
import { dbSelectSchema, dbUpsertSchema, dbQuerySchema } from './schemas/db.js';
import { lawImportSchema } from './schemas/laws.js';
import { extractTextFromPDF, extractTitleFromContent } from '../services/fileIngestor.js';

import { analytics } from '../services/analytics.js';
import { enqueueTask } from '../modules/sync/index.js';

export const setupIPCHandlers = (mainWindow) => {
  // ...
  // Laws
  ipcMain.handle('laws:import', async (_, rawData) => {
    const validation = validateIPCInput(lawImportSchema, rawData, 'laws:import');
    const { filePath, metadata } = validation.data;
    try {
      const content = await extractTextFromPDF(filePath);
      const title = metadata.titulo || extractTitleFromContent(content);
      
      const newLaw = {
        titulo: title,
        nombre: title,
        expediente: metadata.expediente || 'S/E',
        contenido: content,
        fechaPublicacion: new Date().toISOString(),
        tipo: metadata.tipo || 'General',
        activo: 1
      };
      
      const result = db.insert(schema.laws).values(newLaw).run();
      
      // Encolar sincronización (Fase 3)
      try {
        await enqueueTask('laws', result.lastInsertRowid, 'add');
      } catch (e) {
        logger.error('Error auto-enqueuing law sync:', e);
      }

      return { success: true, id: result.lastInsertRowid };
    } catch (err) {
      logger.error('Error importing law:', err);
      throw err;
    }
  });

  // Auth
  ipcMain.handle('auth:hash', async (_, password) => {
    return await bcrypt.hash(password, 10);
  });

  ipcMain.handle('auth:verify', async (_, rawData) => {
    const validation = validateIPCInput(authVerifySchema, rawData, 'auth:verify');
    const { password, hash } = validation.data;
    return await bcrypt.compare(password, hash);
  });

  ipcMain.handle('auth:get-user', async (_, rawData) => {
    const validation = validateIPCInput(authGetUserSchema, rawData, 'auth:get-user');
    const username = validation.data;
    try {
      const results = db.select().from(schema.users).where(eq(schema.users.username, username)).all();
      return results[0] || null;
    } catch (err) {
      logger.error('Auth get user error:', err);
      throw err;
    }
  });

  ipcMain.handle('auth:update-login', async (_, rawData) => {
    const validation = validateIPCInput(authUpdateLoginSchema, rawData, 'auth:update-login');
    const id = validation.data;
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

  // DB
  ipcMain.handle('db:backup:local', async () => {
    try {
      const BACKUP_PATH = path.join(app.getPath('userData'), 'backups');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(BACKUP_PATH, `legis-backup-${timestamp}.db`);
      await sqlite.backup(backupFile);
      return { success: true, path: backupFile };
    } catch (err) {
      logger.error('Backup error:', err);
      throw err;
    }
  });

  ipcMain.handle('db:query', async (_, rawData) => {
    const validation = validateIPCInput(dbQuerySchema, rawData, 'db:query');
    const { sql, params } = validation.data;
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

  ipcMain.handle('db:select', async (_, rawData) => {
    const validation = validateIPCInput(dbSelectSchema, rawData, 'db:select');
    const { table, where } = validation.data;
    try {
      const tableSchema = schema[table];
      if (!tableSchema) throw new Error(`Table ${table} not found in schema`);
      
      let queryBuilder = db.select().from(tableSchema);
      
      if (tableSchema.activo) {
        queryBuilder = queryBuilder.where(eq(tableSchema.activo, 1));
      }

      return queryBuilder.all();
    } catch (err) {
      logger.error(`Select error [${table}]:`, err);
      throw err;
    }
  });

  ipcMain.handle('db:upsert', async (_, rawData) => {
    const validation = validateIPCInput(dbUpsertSchema, rawData, 'db:upsert');
    const { table, data } = validation.data;
    try {
      const tableSchema = schema[table];
      if (!tableSchema) throw new Error(`Table ${table} not found in schema`);

      // Manejo especial para tabla config (PK es 'key')
      if (table === 'config') {
        const { key, ...updateData } = data;
        if (!key) throw new Error('Config key is required for upsert');
        
        // Intentar actualizar, si falla (no existe), insertar
        const existing = db.select().from(tableSchema).where(eq(tableSchema.key, key)).all();
        if (existing.length > 0) {
          return db.update(tableSchema)
            .set(updateData)
            .where(eq(tableSchema.key, key))
            .run();
        } else {
          return db.insert(tableSchema)
            .values(data)
            .run();
        }
      }

      if (data.id) {
        const { id, ...updateData } = data;
        const result = db.update(tableSchema)
          .set(updateData)
          .where(eq(tableSchema.id, id))
          .run();
        
        // Sincronización automática para leyes
        if (table === 'laws') {
          try { await enqueueTask('laws', id, 'update'); } catch (e) { logger.error('Auto-sync error:', e); }
        }
        return result;
      } else {
        const result = db.insert(tableSchema)
          .values(data)
          .run();
        
        // Sincronización automática para leyes
        if (table === 'laws') {
          try { await enqueueTask('laws', result.lastInsertRowid, 'add'); } catch (e) { logger.error('Auto-sync error:', e); }
        }
        return result;
      }
    } catch (err) {
      logger.error(`Upsert error [${table}]:`, err);
      throw err;
    }
  });

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

  ipcMain.handle('app:health', async () => {
    try {
      const dbCheck = sqlite.prepare('SELECT 1 as ok').get();
      return {
        status: 'ok',
        version: app.getVersion(),
        platform: process.platform,
        arch: process.arch,
        database: dbCheck?.ok === 1 ? 'connected' : 'error',
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      logger.error('Health check failed:', err);
      return { status: 'error', error: err.message };
    }
  });

  ipcMain.handle('app:analytics:status', () => {
    return {
      enabled: analytics.enabled,
      anonymousId: analytics.anonymousId
    };
  });

  ipcMain.handle('app:analytics:set-opt-in', async (_, enabled) => {
    try {
      await analytics.setOptIn(enabled);
      return { success: true, enabled: analytics.enabled };
    } catch (err) {
      logger.error('Error setting analytics opt-in:', err);
      throw err;
    }
  });

  // Misc
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

  ipcMain.handle('dialog:open-pdf', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'Documentos PDF', extensions: ['pdf'] }]
    });
    
    if (result.canceled) return null;
    return result.filePaths[0];
  });
};
