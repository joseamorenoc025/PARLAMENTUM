import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/sqlite-core';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import * as schema from './schema.js';
import { logger } from '../lib/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const runMigrations = (dbPath) => {
  const sqlite = new Database(dbPath);
  
  try {
    // 1. Intentar migraciones oficiales de Drizzle primero
    const db = drizzle(sqlite);
    logger.info('Intentando migraciones oficiales de Drizzle...');
    try {
      migrate(db, { migrationsFolder: path.join(__dirname, 'migrations') });
      logger.info('✅ Migraciones completadas exitosamente.');
    } catch (err) {
      logger.error('⚠️ Migración Drizzle interrumpida (posible conflicto), procediendo a auto-reparación:', err.message);
    }

    // 2. REPARACIÓN DE EMERGENCIA (Garantiza columnas críticas aunque falle la migración)
    // Asegurar que la tabla users existe
    sqlite.prepare(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        \`username\` text NOT NULL,
        \`password_hash\` text NOT NULL
      )
    `).run();

    const emergencyFixes = [
      { t: 'users', c: 'created_at', d: 'TEXT DEFAULT CURRENT_TIMESTAMP' },
      { t: 'users', c: 'role', d: "TEXT DEFAULT 'admin'" },
      { t: 'users', c: 'nombre_completo', d: 'TEXT' },
      { t: 'users', c: 'ultimo_login', d: 'TEXT' },
      { t: 'projects', c: 'ultima_actualizacion', d: 'TEXT DEFAULT CURRENT_TIMESTAMP' },
      { t: 'legislators', c: 'biografia', d: 'TEXT' },
      { t: 'sessions', c: 'orden_dia', d: 'TEXT' }
    ];

    for (const fix of emergencyFixes) {
      try {
        const info = sqlite.prepare(`PRAGMA table_info(${fix.t})`).all();
        if (!info.some(col => col.name === fix.c)) {
          sqlite.prepare(`ALTER TABLE ${fix.t} ADD COLUMN ${fix.c} ${fix.d}`).run();
          logger.info(`[FIX] Columna forzada: ${fix.t}.${fix.c}`);
        }
      } catch (e) {
        logger.error(`Error reparando columna ${fix.t}.${fix.c}:`, e.message);
      }
    }

    // 3. Healer Dinámico (Cubre todo el schema.js automáticamente)
    for (const [key, table] of Object.entries(schema)) {
      try {
        const config = getTableConfig(table);
        if (!config || !config.name) continue;
        
        const dbCols = sqlite.prepare(`PRAGMA table_info(${config.name})`).all();
        const existing = new Set(dbCols.map(c => c.name));
        
        for (const col of config.columns) {
          if (!existing.has(col.name)) {
            let type = col.getSQLType().includes('integer') ? 'INTEGER' : 'TEXT';
            sqlite.prepare(`ALTER TABLE ${config.name} ADD COLUMN ${col.name} ${type}`).run();
            logger.info(`[HEAL] Columna detectada y añadida: ${config.name}.${col.name}`);
          }
        }
      } catch (err) {
        // Ignorar exportaciones que no son tablas
      }
    }

    logger.info('🚀 Base de datos verificada y lista para operar.');
  } catch (error) {
    logger.error('❌ Error crítico irrecuperable en la base de datos:', error);
  } finally {
    sqlite.close();
  }
};
