import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/sqlite-core';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import * as schema from './schema.js';
import { logger } from '../lib/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const runMigrations = (dbPath) => {
  console.log(`[MIGRATE] STARTING for path: ${dbPath}`);
  const migrationsDir = path.join(__dirname, 'migrations');
  console.log(`[MIGRATE] Migrations directory: ${migrationsDir}`);
  
  if (!fs.existsSync(migrationsDir)) {
    console.error(`[MIGRATE] ERROR: Migrations directory not found at ${migrationsDir}`);
  }

  const sqlite = new Database(dbPath);
  console.log(`[MIGRATE] Database opened.`);
  
  try {
    // 1. Intentar migraciones oficiales de Drizzle primero
    const db = drizzle(sqlite);
    console.log('[MIGRATE] Drizzle instance created.');
    try {
      console.log('[MIGRATE] Running drizzle-orm migrations...');
      migrate(db, { migrationsFolder: migrationsDir });
      console.log('[MIGRATE] Drizzle migrations success.');
    } catch (err) {
      console.error(`[MIGRATE] Drizzle migration error: ${err.message}`);
    }

    // 2. REPARACIÓN DE EMERGENCIA
    console.log('[MIGRATE] Starting emergency repairs...');
    sqlite.prepare(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        \`username\` text NOT NULL,
        \`password_hash\` text NOT NULL
      )
    `).run();
    console.log('[MIGRATE] Users table ensured.');

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
          console.log(`[MIGRATE] Emergency fix: Added ${fix.t}.${fix.c}`);
        }
      } catch (e) {
        // Ignorar si la tabla no existe todavía (el Healer la creará)
      }
    }

    // 3. Healer Dinámico
    console.log('[MIGRATE] Starting Dynamic Healer...');
    for (const [key, table] of Object.entries(schema)) {
      try {
        const config = getTableConfig(table);
        if (!config || !config.name) continue;
        
        console.log(`[MIGRATE] Healing table: ${config.name}`);
        
        // Crear tabla si no existe
        sqlite.prepare(`CREATE TABLE IF NOT EXISTS \`${config.name}\` (id INTEGER PRIMARY KEY AUTOINCREMENT)`).run();
        
        const dbCols = sqlite.prepare(`PRAGMA table_info(${config.name})`).all();
        const existing = new Set(dbCols.map(c => c.name));
        
        for (const col of config.columns) {
          if (!existing.has(col.name)) {
            let type = col.getSQLType().includes('integer') ? 'INTEGER' : 'TEXT';
            sqlite.prepare(`ALTER TABLE ${config.name} ADD COLUMN ${col.name} ${type}`).run();
            console.log(`[MIGRATE] Added column: ${config.name}.${col.name}`);
          }
        }
      } catch (err) {
        console.error(`[MIGRATE] Healer error for ${key}: ${err.message}`);
      }
    }

    console.log('[MIGRATE] Migration process finished successfully.');
  } catch (error) {
    console.error(`[MIGRATE] FATAL ERROR: ${error.message}`);
  } finally {
    sqlite.close();
    console.log('[MIGRATE] Database closed.');
  }
};
