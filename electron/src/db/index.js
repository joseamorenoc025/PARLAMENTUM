import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';
import * as schema from './schema.js';
import { runMigrations } from './migrate.js';

export let db = null;
export let sqlite = null;
let isInitialized = false;

export const dbManager = {
  async initialize({ dataDir = app.getPath('userData'), testMode = false } = {}) {
    if (isInitialized) return { db, sqlite };
    
    const dbPath = path.join(dataDir, 'legis.db');
    console.log(`[DB-MANAGER] Initializing at: ${dbPath} (testMode: ${testMode})`);

    // Asegurar que el directorio de la DB exista
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // 1. Ejecutar migraciones ANTES de abrir la conexión permanente para el ORM
    try {
      console.log(`[DB-MANAGER] Running migrations...`);
      runMigrations(dbPath);
      console.log(`[DB-MANAGER] Migrations finished.`);
    } catch (err) {
      console.error(`[DB-MANAGER] FATAL MIGRATION ERROR:`, err);
      throw err;
    }

    // 2. Abrir conexión permanente y configurar ORM
    sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');
    db = drizzle(sqlite, { schema });
    
    isInitialized = true;
    console.log(`[DB-MANAGER] Database ready.`);
    return { db, sqlite };
  },

  async shutdown() {
    if (!isInitialized) return;
    console.log('[DB-MANAGER] Shutting down database...');
    if (sqlite) {
      sqlite.close();
      sqlite = null;
    }
    db = null;
    isInitialized = false;
  },

  getDB() {
    if (!isInitialized) throw new Error('Database not initialized. Call initialize() first.');
    return db;
  },

  isReady() {
    return isInitialized;
  },

  async resetForTests(options = {}) {
    if (process.env.CEREBO_TEST_MODE !== 'true') {
      console.warn('resetForTests: Ignorado (no estamos en modo test).');
      return { success: false };
    }

    console.log('[DB-MANAGER] Resetting database for tests...');
    try {
      const dbToReset = this.getDB();
      sqlite.transaction(() => {
        sqlite.prepare('DELETE FROM users').run();
        sqlite.prepare('DELETE FROM config').run();
        sqlite.prepare('DELETE FROM sessions').run();
        sqlite.prepare('DELETE FROM oficios').run();
        sqlite.prepare('DELETE FROM projects').run();
        sqlite.prepare('DELETE FROM laws').run();
        sqlite.prepare('DELETE FROM legislators').run();
        sqlite.prepare('DELETE FROM commissions').run();
        sqlite.prepare('DELETE FROM documents').run();
        sqlite.prepare('DELETE FROM audit_logs').run();
        sqlite.prepare('DELETE FROM sync_queue').run();
        sqlite.prepare('DELETE FROM project_versions').run();

        if (options.onboardingCompleted) {
          sqlite.prepare("INSERT INTO config (key, value) VALUES ('onboarding_completed', 'true')").run();
        }
      })();
      return { success: true };
    } catch (err) {
      console.error('[DB-MANAGER] Reset failed:', err);
      return { success: false, error: err.message };
    }
  }
};
