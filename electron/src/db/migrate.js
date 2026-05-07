import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../lib/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const runMigrations = (dbPath) => {
  try {
    const sqlite = new Database(dbPath);
    
    // Healing: Asegurar tablas críticas tras simplificación previa
    const tables = [
      {
        name: 'legislators',
        sql: `CREATE TABLE IF NOT EXISTS \`legislators\` (
          \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
          \`nombre\` text NOT NULL,
          \`partido_politico\` text,
          \`contacto\` text,
          \`notas\` text,
          \`biografia\` text,
          \`foto\` text,
          \`activo\` integer DEFAULT 1
        )`
      },
      {
        name: 'commissions',
        sql: `CREATE TABLE IF NOT EXISTS \`commissions\` (
          \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
          \`nombre\` text NOT NULL,
          \`presidente_id\` integer,
          \`vicepresidente_id\` integer,
          \`miembro1_id\` integer,
          \`miembro2_id\` integer,
          \`miembro3_id\` integer,
          \`miembro3_nombre\` text,
          \`activo\` integer DEFAULT 1
        )`
      },
      {
        name: 'projects',
        sql: `CREATE TABLE IF NOT EXISTS \`projects\` (
          \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
          \`expediente\` text,
          \`titulo\` text NOT NULL,
          \`extracto\` text,
          \`fecha_presentacion\` text,
          \`ponente_id\` integer,
          \`comision_id\` integer,
          \`estado\` text DEFAULT 'en_comision',
          \`prioridad\` text DEFAULT 'media',
          \`tags\` text,
          \`ultima_actualizacion\` text DEFAULT CURRENT_TIMESTAMP,
          \`activo\` integer DEFAULT 1
        )`
      },
      {
        name: 'project_versions',
        sql: `CREATE TABLE IF NOT EXISTS \`project_versions\` (
          \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
          \`project_id\` integer,
          \`version\` integer NOT NULL,
          \`motivo\` text,
          \`snapshot\` text,
          \`fecha_creacion\` text DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'sync_queue',
        sql: `CREATE TABLE IF NOT EXISTS \`sync_queue\` (
          \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
          \`entity_type\` text DEFAULT 'laws',
          \`entity_id\` integer,
          \`action\` text,
          \`status\` text DEFAULT 'pending',
          \`attempts\` integer DEFAULT 0,
          \`last_error\` text,
          \`next_retry\` text,
          \`created_at\` text DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` text
        )`
      }
    ];

    for (const table of tables) {
      try {
        sqlite.prepare(table.sql).run();
      } catch (e) {
        logger.error(`Error healing table ${table.name}:`, e);
      }
    }

    const db = drizzle(sqlite);
    
    logger.info('Iniciando migraciones de base de datos...');
    
    try {
      migrate(db, {
        migrationsFolder: path.join(__dirname, 'migrations'),
      });
      logger.info('✅ Migraciones aplicadas exitosamente');
    } catch (error) {
      logger.error('❌ Error aplicando migraciones con Drizzle:', error);
      throw error;
    }
    
    sqlite.close();
  } catch (error) {
    logger.error('❌ Error en el proceso de migración:', error);
    throw error;
  }
};
