import { ipcMain } from 'electron';
import { saveToken, loadToken, clearToken } from './tokenStorage.js';
import { GitHubClient } from './githubClient.js';
import { SyncEngine } from './syncEngine.js';
import { SyncQueueManager } from './syncQueue.js';
import { logger } from '../../lib/logger.js';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { eq } from 'drizzle-orm';

const DEFAULT_OWNER = 'joseamorenoc025';
const DEFAULT_REPO = 'cerebro_legislativo';

/**
 * Obtiene la configuración de repositorio de la DB o usa defaults.
 */
export async function getRepoConfig() {
  const config = db.select().from(schema.config).all();
  const owner = config.find(c => c.key === 'sync_github_owner')?.value || DEFAULT_OWNER;
  const repo = config.find(c => c.key === 'sync_github_repo')?.value || DEFAULT_REPO;
  return { owner, repo };
}

let queueManager = null;

/**
 * Inicializa el gestor de la cola.
 */
async function initQueueManager() {
  if (queueManager) return queueManager;
  const { owner, repo } = await getRepoConfig();
  queueManager = new SyncQueueManager(owner, repo);
  queueManager.startBackgroundWorker();
  return queueManager;
}

/**
 * Encola una tarea de sincronización de forma manual o automática.
 */
export const enqueueTask = async (entityType, entityId, action) => {
  const manager = await initQueueManager();
  return await manager.enqueue(entityType, entityId, action);
};

/**
 * Registra los handlers de IPC para el módulo de sincronización.
 */
export const setupSyncHandlers = async () => {
  try {
    await initQueueManager();
  } catch (error) {
    logger.error('Critical: Failed to initialize SyncQueueManager', error);
  }

  // Guardar token
  ipcMain.handle('sync:github:save-token', async (_, token) => {
    return await saveToken(token);
  });

  // Cargar token
  ipcMain.handle('sync:github:has-token', async () => {
    const token = await loadToken();
    return !!token;
  });

  // Validar conexión
  ipcMain.handle('sync:github:validate', async () => {
    try {
      const token = await loadToken();
      if (!token) throw new Error('No hay un token de GitHub configurado.');
      
      const client = new GitHubClient(token);
      const user = await client.validateToken();
      return { success: true, user: user.login };
    } catch (error) {
      logger.error('Error en sync:github:validate:', error);
      return { success: false, error: error.message };
    }
  });

  // Forzar sincronización
  ipcMain.handle('sync:github:force', async () => {
    try {
      logger.info('Iniciando sincronización forzada (Manual)...');
      if (!queueManager) await initQueueManager();
      await queueManager.processQueue(true); // Forzar procesamiento de toda la cola ignorando backoff
      return { success: true, message: `Sincronización forzada completada exitosamente.` };
    } catch (error) {
      logger.error('Error en sync:github:force:', error);
      return { success: false, error: error.message };
    }
  });

  // Eliminar configuración
  ipcMain.handle('sync:github:clear', async () => {
    return await clearToken();
  });

  // Configurar Repo
  ipcMain.handle('sync:github:set-repo', async (_, { owner, repo }) => {
    try {
      // Upsert owner
      const existingOwner = db.select().from(schema.config).where(eq(schema.config.key, 'sync_github_owner')).all();
      if (existingOwner.length > 0) {
        db.update(schema.config).set({ value: owner }).where(eq(schema.config.key, 'sync_github_owner')).run();
      } else {
        db.insert(schema.config).values({ key: 'sync_github_owner', value: owner }).run();
      }

      // Upsert repo
      const existingRepo = db.select().from(schema.config).where(eq(schema.config.key, 'sync_github_repo')).all();
      if (existingRepo.length > 0) {
        db.update(schema.config).set({ value: repo }).where(eq(schema.config.key, 'sync_github_repo')).run();
      } else {
        db.insert(schema.config).values({ key: 'sync_github_repo', value: repo }).run();
      }

      return { success: true };
    } catch (error) {
      logger.error('Error en sync:github:set-repo:', error);
      throw error;
    }
  });

  ipcMain.handle('sync:github:get-repo', async () => {
    return await getRepoConfig();
  });

  // Handlers de la Cola (Fase 3)
  ipcMain.handle('sync:queue:stats', async () => {
    if (!queueManager) await initQueueManager();
    return queueManager.getStats();
  });

  ipcMain.handle('sync:queue:enqueue', async (_, { entityType, entityId, action }) => {
    if (!queueManager) await initQueueManager();
    return await queueManager.enqueue(entityType, entityId, action);
  });
};
