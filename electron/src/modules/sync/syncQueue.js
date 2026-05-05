import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { logger } from '../../lib/logger.js';
import { SyncEngine } from './syncEngine.js';
import { eq, and, lte, or, asc, sql } from 'drizzle-orm';

/**
 * Gestor de la cola de sincronización.
 */
export class SyncQueueManager {
  constructor(owner, repo) {
    this.owner = owner;
    this.repo = repo;
    this.isProcessing = false;
    this.timer = null;
  }

  /**
   * Añade una tarea a la cola.
   */
  async enqueue(entityType, entityId, action) {
    try {
      db.insert(schema.syncQueue).values({
        entityType,
        entityId,
        action,
        status: 'pending',
        createdAt: new Date().toISOString()
      }).run();
      
      logger.info(`Tarea encolada: ${action} ${entityType} (${entityId})`);
      this.processQueue(); // Intentar procesar inmediatamente
    } catch (error) {
      logger.error('Error al encolar tarea de sync:', error);
    }
  }

  /**
   * Inicia el proceso de la cola en segundo plano.
   */
  startBackgroundWorker(intervalMs = 60000) {
    if (this.timer) return;
    this.timer = setInterval(() => this.processQueue(), intervalMs);
    logger.info('Background Sync Worker iniciado.');
  }

  /**
   * Detiene el proceso en segundo plano.
   */
  stopBackgroundWorker() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Procesa las tareas pendientes en la cola.
   */
  async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const now = new Date().toISOString();
      const pendingTasks = db.select()
        .from(schema.syncQueue)
        .where(
          and(
            or(eq(schema.syncQueue.status, 'pending'), eq(schema.syncQueue.status, 'failed')),
            or(eq(schema.syncQueue.nextRetry, null), lte(schema.syncQueue.nextRetry, now))
          )
        )
        .orderBy(asc(schema.syncQueue.createdAt))
        .all();

      if (pendingTasks.length === 0) {
        this.isProcessing = false;
        return;
      }

      logger.info(`Procesando cola de sincronización: ${pendingTasks.length} tareas.`);

      // Por ahora, como nuestra sincronización es "todo o nada" (leyes.json completo),
      // solo necesitamos ejecutar el SyncEngine una vez si hay cambios pendientes.
      // En el futuro, si sincronizamos leyes individuales, procesaríamos uno a uno.
      
      const engine = new SyncEngine(this.owner, this.repo);
      const result = await engine.run();

      if (result.success) {
        // Marcar todas las tareas procesadas como sincronizadas
        for (const task of pendingTasks) {
          db.update(schema.syncQueue)
            .set({ 
              status: 'synced', 
              updatedAt: new Date().toISOString(),
              lastError: null
            })
            .where(eq(schema.syncQueue.id, task.id))
            .run();
        }
      }
    } catch (error) {
      logger.error('Error al procesar la cola de sync:', error);
      
      // Manejar fallos y reintentos para las tareas que fallaron
      const pendingTasks = db.select().from(schema.syncQueue).where(eq(schema.syncQueue.status, 'pending')).all();
      for (const task of pendingTasks) {
        const nextAttempts = (task.attempts || 0) + 1;
        const delayMinutes = Math.pow(2, nextAttempts); // Backoff exponencial: 2, 4, 8, 16... minutos
        const nextRetry = new Date();
        nextRetry.setMinutes(nextRetry.getMinutes() + delayMinutes);

        db.update(schema.syncQueue)
          .set({
            status: 'failed',
            attempts: nextAttempts,
            lastError: error.message,
            nextRetry: nextRetry.toISOString(),
            updatedAt: new Date().toISOString()
          })
          .where(eq(schema.syncQueue.id, task.id))
          .run();
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Obtiene el estado actual de la cola.
   */
  getStats() {
    const stats = db.select({
      status: schema.syncQueue.status,
      count: sql`count(*)`
    }).from(schema.syncQueue).groupBy(schema.syncQueue.status).all();
    
    return stats.reduce((acc, curr) => {
      acc[curr.status] = curr.count;
      return acc;
    }, {});
  }
}
