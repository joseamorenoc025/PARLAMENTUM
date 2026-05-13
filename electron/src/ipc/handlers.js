import { ipcMain, dialog, app } from 'electron';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { db, sqlite, dbManager } from '../db/index.js';
import * as schema from '../db/schema.js';
import { eq, sql as drizzleSql } from 'drizzle-orm';
import { logger } from '../lib/logger.js';
import { validateIPCInput } from './validate.js';
import { authVerifySchema, authGetUserSchema, authUpdateLoginSchema, authHashSchema } from './schemas/auth.js';
import { dbSelectSchema, dbUpsertSchema, dbQuerySchema } from './schemas/db.js';
import { lawImportSchema } from './schemas/laws.js';
import { setupInitializeSchema } from './schemas/setup.js';
import { logSchema, qrGenerateSchema, analyticsOptInSchema } from './schemas/misc.js';

import { analytics } from '../services/analytics.js';
import { enqueueTask } from '../modules/sync/index.js';

export const setupIPCHandlers = (mainWindow) => {
  // DB Ready Check
  ipcMain.handle('db:isReady', async () => {
    return dbManager.isReady();
  });

  // DB Reset para Tests
  ipcMain.handle('db:reset-for-tests', async (_, options) => {
    return await dbManager.resetForTests(options);
  });

  // Laws
  ipcMain.handle('laws:import', async (_, rawData) => {
    const validation = validateIPCInput(lawImportSchema, rawData, 'laws:import');
    const { metadata } = validation.data;
    try {
      let rutaPdf = null;
      if (metadata.localFilePath && fs.existsSync(metadata.localFilePath)) {
        const docsPath = path.join(app.getPath('userData'), 'documents');
        if (!fs.existsSync(docsPath)) fs.mkdirSync(docsPath, { recursive: true });
        
        const fileName = `ley_${Date.now()}_${path.basename(metadata.localFilePath).replace(/\s+/g, '_')}`;
        rutaPdf = path.join(docsPath, fileName);
        fs.copyFileSync(metadata.localFilePath, rutaPdf);
      }

      const newLaw = {
        titulo: metadata.titulo,
        nombre: metadata.titulo,
        expediente: `${metadata.gaceta} - ${metadata.anio}`, // Usamos gaceta y año como identificador
        contenido: metadata.driveLink ? `Enlace de descarga: ${metadata.driveLink}` : null,
        driveLink: metadata.driveLink || null,
        rutaPdf: rutaPdf,
        fechaPublicacion: new Date().toISOString(),
        tipo: metadata.gaceta,
        anio: metadata.anio,
        gaceta: metadata.gaceta,
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
  ipcMain.handle('auth:hash', async (_, rawData) => {
    const validation = validateIPCInput(authHashSchema, rawData, 'auth:hash');
    const password = validation.data;
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
      if (!fs.existsSync(BACKUP_PATH)) {
        fs.mkdirSync(BACKUP_PATH, { recursive: true });
      }
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
    const { table, data: rawDataObj } = validation.data;

    // Normalizar datos para SQLite (Drizzle/Better-SQLite3)
    const data = Object.entries(rawDataObj).reduce((acc, [key, value]) => {
      if (value === undefined) return acc;
      if (typeof value === 'boolean') {
        acc[key] = value ? 1 : 0;
      } else if (value !== null && typeof value === 'object' && !Buffer.isBuffer(value)) {
        acc[key] = JSON.stringify(value);
      } else {
        acc[key] = value;
      }
      return acc;
    }, {});

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
        
        // Sincronización automática
        if (table === 'laws') {
          try { await enqueueTask('laws', id, 'update'); } catch (e) { logger.error('Auto-sync error:', e); }
        }
        if (table === 'legislators' || table === 'commissions') {
          try { await enqueueTask('legislators', 0, 'sync'); } catch (e) { logger.error('Auto-sync error:', e); }
        }
        if (table === 'projects') {
          try { await enqueueTask('projects', 0, 'sync'); } catch (e) { logger.error('Auto-sync error:', e); }
        }
        return result;
      } else {
        const result = db.insert(tableSchema)
          .values(data)
          .run();
        
        // Sincronización automática
        if (table === 'laws') {
          try { await enqueueTask('laws', result.lastInsertRowid, 'add'); } catch (e) { logger.error('Auto-sync error:', e); }
        }
        if (table === 'legislators' || table === 'commissions') {
          try { await enqueueTask('legislators', 0, 'sync'); } catch (e) { logger.error('Auto-sync error:', e); }
        }
        if (table === 'projects') {
          try { await enqueueTask('projects', 0, 'sync'); } catch (e) { logger.error('Auto-sync error:', e); }
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

  ipcMain.handle('app:analytics:set-opt-in', async (_, rawData) => {
    try {
      const validation = validateIPCInput(analyticsOptInSchema, rawData, 'app:analytics:set-opt-in');
      const enabled = validation.data;
      await analytics.setOptIn(enabled);
      return { success: true, enabled: analytics.enabled };
    } catch (err) {
      logger.error('Error setting analytics opt-in:', err);
      throw err;
    }
  });

  ipcMain.handle('app:get-logo', async () => {
    try {
      const logoPathConfig = db.select().from(schema.config).where(eq(schema.config.key, 'logo_path')).all();
      if (logoPathConfig.length > 0 && fs.existsSync(logoPathConfig[0].value)) {
        const buffer = fs.readFileSync(logoPathConfig[0].value);
        const ext = path.extname(logoPathConfig[0].value).substring(1) || 'png';
        return `data:image/${ext};base64,${buffer.toString('base64')}`;
      }
      return null;
    } catch (err) {
      logger.error('Error fetching logo:', err);
      return null;
    }
  });

  // Misc
  ipcMain.handle('log', (_, rawData) => {
    const validation = validateIPCInput(logSchema, rawData, 'log');
    const { level, message } = validation.data;
    logger.log(level, message);
    return true;
  });

  ipcMain.handle('qr:generate', async (_, rawData) => {
    try {
      const validation = validateIPCInput(qrGenerateSchema, rawData, 'qr:generate');
      const data = validation.data;
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

  ipcMain.handle('dialog:open-image', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'Imágenes', extensions: ['jpg', 'png', 'jpeg'] }]
    });
    
    if (result.canceled) return null;
    const filePath = result.filePaths[0];
    const buffer = fs.readFileSync(filePath);
    return { filePath, buffer };
  });

  ipcMain.handle('dialog:open-backup', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Cerebro Backup (.clbak, .enc)', extensions: ['clbak', 'enc'] },
        { name: 'Todos los archivos', extensions: ['*'] }
      ]
    });
    
    if (result.canceled) return null;
    return result.filePaths[0];
  });

  // Setup / Onboarding
  ipcMain.handle('app:get-setup-status', async () => {
    try {
      const userCount = db.select({ count: drizzleSql`count(*)` }).from(schema.users).all();
      const onboardingCompleted = db.select().from(schema.config).where(eq(schema.config.key, 'onboarding_completed')).all();
      
      return {
        needsOnboarding: (userCount[0]?.count === 0) || (onboardingCompleted[0]?.value !== 'true'),
        onboardingCompleted: onboardingCompleted[0]?.value === 'true',
        hasUsers: (userCount[0]?.count || 0) > 0
      };
    } catch (err) {
      logger.error('Error checking setup status:', err);
      return { needsOnboarding: true, error: err.message };
    }
  });

  ipcMain.handle('setup:initialize', async (_, rawData) => {
    const validation = validateIPCInput(setupInitializeSchema, rawData, 'setup:initialize');
    const { 
      username, password, securityQuestion, securityAnswer, 
      chamberName, timezone, logoBuffer 
    } = validation.data;

    try {
      // 1. Hashear credenciales
      const passwordHash = await bcrypt.hash(password, 10);
      const securityAnswerHash = crypto.createHash('sha256').update(securityAnswer + 'salt-legislativo').digest('hex');
      
      // Generar código de recuperación
      const rawRecoveryCode = crypto.randomBytes(4).toString('hex').toUpperCase().match(/.{1,4}/g).join('-');
      const recoveryCodeHash = crypto.createHash('sha256').update(rawRecoveryCode).digest('hex');

      // 2. Procesar Logo si existe
      let logoPath = null;
      if (logoBuffer) {
        const assetsPath = path.join(app.getPath('userData'), 'assets');
        if (!fs.existsSync(assetsPath)) fs.mkdirSync(assetsPath, { recursive: true });
        
        logoPath = path.join(assetsPath, 'logo.png');
        // El logoBuffer viene como Uint8Array desde el frontend
        fs.writeFileSync(logoPath, Buffer.from(logoBuffer));
      }

      // 3. Transacción atómica
      db.transaction((tx) => {
        // Crear Admin
        tx.insert(schema.users).values({
          username,
          passwordHash,
          role: 'admin',
          nombreCompleto: 'Administrador General',
          securityQuestion,
          securityAnswerHash,
          recoveryCodeHash,
          passwordResetRequired: 0,
          activo: 1
        }).run();

        // Guardar config institucional
        const configs = [
          { key: 'chamber_name', value: chamberName },
          { key: 'timezone', value: timezone },
          { key: 'onboarding_completed', value: 'true' }
        ];
        if (logoPath) configs.push({ key: 'logo_path', value: logoPath });

        for (const c of configs) {
          tx.insert(schema.config).values(c)
            .onConflictDoUpdate({ target: schema.config.key, set: { value: c.value } })
            .run();
        }
      });

      // Encolar sincronización de Logo y Configuración tras éxito
      try {
        if (logoPath) await enqueueTask('logo', 0, 'sync');
        await enqueueTask('config', 0, 'sync');
      } catch (e) {
        logger.error('Error enqueuing initial sync tasks:', e);
      }

      return { success: true, recoveryCode: rawRecoveryCode };
    } catch (err) {
      logger.error('Error during setup initialization:', err);
      throw err;
    }
  });
};
