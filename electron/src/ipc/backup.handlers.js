import { ipcMain, app, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { encryptData, decryptData } from '../lib/cryptoUtils.js';
import { logger } from '../lib/logger.js';
import { validateIPCInput } from './validate.js';
import { dbManager, db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';

const backupRestoreSchema = z.object({
  filePath: z.string().min(1),
  password: z.string().min(8)
});

export const setupBackupHandlers = (mainWindow) => {
  
  // Handler para exportar manualmente a una ubicación elegida por el usuario
  ipcMain.handle('db:backup:export', async (_, { password }) => {
    try {
      const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
        title: 'Exportar Copia de Seguridad',
        defaultPath: `legis-backup-${new Date().toISOString().slice(0,10)}.clbak`,
        filters: [
          { name: 'Cerebro Backup (.clbak)', extensions: ['clbak'] },
          { name: 'Archivo Encriptado (.enc)', extensions: ['enc'] }
        ]
      });

      if (canceled || !filePath) return { success: false, error: 'CANCELED' };

      const userDataPath = app.getPath('userData');
      const currentDbPath = path.join(userDataPath, 'legis.db');
      
      if (!fs.existsSync(currentDbPath)) {
        return { success: false, error: 'DB_NOT_FOUND' };
      }

      const dbBuffer = fs.readFileSync(currentDbPath);
      const encrypted = await encryptData(dbBuffer, password);
      
      const chamberConfig = db.select().from(schema.config).where(eq(schema.config.key, 'chamber_name')).get();

      const backupObj = {
        ...encrypted,
        salt: encrypted.salt.toString('base64'),
        iv: encrypted.iv.toString('base64'),
        ciphertext: encrypted.ciphertext.toString('base64'),
        authTag: encrypted.authTag.toString('base64'),
        metadata: {
          timestamp: new Date().toISOString(),
          appVersion: app.getVersion(),
          platform: process.platform,
          chamberName: chamberConfig?.value || 'Unknown'
        }
      };

      fs.writeFileSync(filePath, JSON.stringify(backupObj, null, 2));
      logger.info('backup:export_success', { filePath });

      return { success: true, path: filePath };
    } catch (err) {
      logger.error('backup:export_failed', { error: err.message });
      return { success: false, error: err.message };
    }
  });

  // Nuevo handler para validar y restaurar
  ipcMain.handle('backup:validateAndRestore', async (_, rawData) => {
    let validation;
    try {
      validation = validateIPCInput(backupRestoreSchema, rawData, 'backup:validateAndRestore');
    } catch (err) {
      return { error: 'INVALID_PAYLOAD', details: err.message };
    }

    const { filePath, password } = validation.data;

    try {
      // 1. Verificar extensión y existencia
      const isAcceptedExtension = filePath.endsWith('.enc') || filePath.endsWith('.clbak');
      if (!isAcceptedExtension) {
        return { error: 'INVALID_FILE_TYPE' };
      }
      if (!fs.existsSync(filePath)) {
        return { error: 'FILE_NOT_FOUND' };
      }

      // 2. Leer y parsear el archivo
      const fileBuffer = fs.readFileSync(filePath);
      let backupData;
      try {
        // Asumiendo que el archivo .enc es un JSON stringificado o un buffer estructurado
        // Según el prompt, parece ser un objeto que contiene Buffers
        const rawJson = JSON.parse(fileBuffer.toString());
        backupData = {
          ...rawJson,
          salt: Buffer.from(rawJson.salt, 'base64'),
          iv: Buffer.from(rawJson.iv, 'base64'),
          ciphertext: Buffer.from(rawJson.ciphertext, 'base64'),
          authTag: Buffer.from(rawJson.authTag, 'base64')
        };
      } catch {
        return { error: 'CORRUPTED_FILE' };
      }

      // 3. Desencriptar
      let decryptedDb;
      try {
        decryptedDb = await decryptData(backupData, password);
      } catch (err) {
        if (err.message === 'INVALID_CREDENTIALS' || err.message === 'CORRUPTED_FILE') {
          return { error: err.message };
        }
        throw err;
      }

      // 4. Backup automático de la DB actual antes de reemplazar
      const userDataPath = app.getPath('userData');
      const currentDbPath = path.join(userDataPath, 'legis.db');
      const backupsDir = path.join(userDataPath, 'backups');
      if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

      if (fs.existsSync(currentDbPath)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const preRestoreBackup = path.join(backupsDir, `pre-restore-${timestamp}.db`);
        // Copia simple para seguridad interna
        fs.copyFileSync(currentDbPath, preRestoreBackup);
      }

      // 5. Cerrar conexiones actuales si existen
      await dbManager.shutdown();

      // 6. Reemplazar DB
      fs.writeFileSync(currentDbPath, decryptedDb);

      // 7. Re-inicializar DB para aplicar cambios
      // Resetear el estado de dbManager
      // Nota: Esto asume que podemos reinicializar sin problemas.
      // En un entorno Electron real, tal vez sea mejor reiniciar la app, 
      // pero el prompt pide navegar directamente al Dashboard.
      
      await dbManager.initialize({ dataDir: userDataPath });

      // 8. Marcar onboarding como completado si no lo estaba
      await db.insert(schema.config).values({
        key: 'onboarding_completed',
        value: 'true'
      }).onConflictDoUpdate({
        target: schema.config.key,
        set: { value: 'true' }
      }).run();

      // 9. Obtener info del usuario para el frontend
      const adminUser = db.select().from(schema.users).where(eq(schema.users.role, 'admin')).get();
      const chamberConfig = db.select().from(schema.config).where(eq(schema.config.key, 'chamber_name')).get();

      logger.info('backup:restore_success', { filePath });

      return { 
        success: true, 
        userInfo: { 
          username: adminUser?.username || 'admin', 
          chamberName: chamberConfig?.value || 'Cámara Legislativa' 
        } 
      };

    } catch (err) {
      logger.error('backup:restore_failed', { error: err.message, filePath });
      return { error: 'INTERNAL_ERROR', details: err.message };
    }
  });

  // Actualizar el handler de backup para generar archivos .enc compatibles
  ipcMain.handle('db:backup:encrypted', async (_, { password }) => {
    try {
      const userDataPath = app.getPath('userData');
      const currentDbPath = path.join(userDataPath, 'legis.db');
      
      if (!fs.existsSync(currentDbPath)) {
        return { success: false, error: 'DB_NOT_FOUND' };
      }

      const dbBuffer = fs.readFileSync(currentDbPath);
      const encrypted = await encryptData(dbBuffer, password);
      
      const chamberConfig = db.select().from(schema.config).where(eq(schema.config.key, 'chamber_name')).get();

      const backupObj = {
        ...encrypted,
        salt: encrypted.salt.toString('base64'),
        iv: encrypted.iv.toString('base64'),
        ciphertext: encrypted.ciphertext.toString('base64'),
        authTag: encrypted.authTag.toString('base64'),
        metadata: {
          timestamp: new Date().toISOString(),
          appVersion: app.getVersion(),
          platform: process.platform,
          chamberName: chamberConfig?.value || 'Unknown'
        }
      };

      const backupsDir = path.join(userDataPath, 'backups');
      if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupsDir, `legis-backup-${timestamp}.enc`);
      
      fs.writeFileSync(backupPath, JSON.stringify(backupObj, null, 2));

      return { success: true, path: backupPath };
    } catch (err) {
      logger.error('backup:create_failed', { error: err.message });
      return { success: false, error: err.message };
    }
  });

  const cloudBackupSchema = z.object({
    filePath: z.string().min(1, 'El path no puede estar vacío')
  });

  ipcMain.handle('backup:uploadToCloud', async (_, rawData) => {
    try {
      const validation = validateIPCInput(cloudBackupSchema, rawData, 'backup:uploadToCloud');
      const { filePath } = validation.data;

      // 1. Check if file exists
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'FILE_NOT_FOUND', details: 'El archivo de respaldo no existe localmente.' };
      }

      // 2. Get GitHub config
      const repoConfig = db.select().from(schema.config).where(eq(schema.config.key, 'sync_github_repo')).get();
      const ownerConfig = db.select().from(schema.config).where(eq(schema.config.key, 'sync_github_owner')).get();
      
      const repo = repoConfig?.value;
      const owner = ownerConfig?.value;

      if (!repo || !owner) {
        return { success: false, error: 'CONFIG_MISSING', details: 'Repositorio de GitHub no configurado.' };
      }

      // 3. Get token from DPAPI
      const { loadToken } = await import('../modules/sync/tokenStorage.js');
      const token = await loadToken();

      if (!token) {
        return { success: false, error: 'TOKEN_MISSING', details: 'No hay credenciales de GitHub almacenadas.' };
      }

      // 4. Upload to GitHub
      const { uploadBackupToGitHub } = await import('../modules/backup/githubBackup.js');
      const result = await uploadBackupToGitHub(token, owner, repo, filePath);

      return result;
    } catch (err) {
      logger.error('Error in backup:uploadToCloud handler:', err);
      return { success: false, error: 'UPLOAD_FAILED', details: err.message };
    }
  });

  ipcMain.handle('backup:checkCloudToken', async () => {
    try {
      const { loadToken } = await import('../modules/sync/tokenStorage.js');
      const token = await loadToken();
      return { exists: !!token };
    } catch (err) {
      return { exists: false, error: err.message };
    }
  });

  const setTokenSchema = z.object({
    token: z.string().min(1, 'El token no puede estar vacío')
  });

  ipcMain.handle('backup:setCloudToken', async (_, rawData) => {
    try {
      const validation = validateIPCInput(setTokenSchema, rawData, 'backup:setCloudToken');
      const { saveToken } = await import('../modules/sync/tokenStorage.js');
      await saveToken(validation.data.token);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('backup:downloadFromCloud', async () => {
    try {
      const { loadToken } = await import('../modules/sync/tokenStorage.js');
      const token = await loadToken();
      if (!token) return { success: false, error: 'TOKEN_MISSING' };

      const repoConfig = db.select().from(schema.config).where(eq(schema.config.key, 'sync_github_repo')).get();
      const ownerConfig = db.select().from(schema.config).where(eq(schema.config.key, 'sync_github_owner')).get();
      
      const repo = repoConfig?.value;
      const owner = ownerConfig?.value;

      if (!repo || !owner) {
        return { success: false, error: 'CONFIG_MISSING' };
      }

      const { downloadBackupFromGitHub } = await import('../modules/backup/githubBackup.js');
      const userDataPath = app.getPath('userData');
      const tempPath = path.join(userDataPath, `cloud-backup-${Date.now()}.clbak`);
      
      const result = await downloadBackupFromGitHub(token, owner, repo, tempPath);
      
      return { success: true, filePath: tempPath, date: result.date };
    } catch (err) {
      logger.error('Error in backup:downloadFromCloud handler:', err);
      return { success: false, error: 'DOWNLOAD_FAILED', details: err.message };
    }
  });
};
