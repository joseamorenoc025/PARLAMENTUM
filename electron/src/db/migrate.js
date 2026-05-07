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
    
    // Healing: Asegurar tabla sync_queue (si no existe por alguna razón)
    try {
      sqlite.prepare(`
        CREATE TABLE IF NOT EXISTS \`sync_queue\` (
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
        )
      `).run();
    } catch (e) {
      // Ignorar
    }

    // Healing 2: Asegurar columnas de seguridad en la tabla users
    const columnsToEnsure = [
      { name: 'security_question', type: 'text' },
      { name: 'security_answer_hash', type: 'text' },
      { name: 'recovery_code_hash', type: 'text' },
      { name: 'password_reset_required', type: 'integer DEFAULT 0' }
    ];

    for (const col of columnsToEnsure) {
      try {
        sqlite.prepare(`ALTER TABLE \`users\` ADD COLUMN \`${col.name}\` ${col.type}`).run();
        logger.info(`✅ Columna [${col.name}] añadida manualmente a la tabla users`);
      } catch (e) {
        if (!e.message.includes('duplicate column name')) {
          logger.warn(`⚠️ No se pudo añadir la columna [${col.name}]: ${e.message}`);
        }
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
      // Si el error es por columna duplicada, es probable que el "healing" previo haya hecho su trabajo
      // pero Drizzle no haya registrado la migración.
      if (error.message.includes('duplicate column name')) {
        logger.warn('⚠️ Se detectaron columnas duplicadas en la migración. El esquema parece estar actualizado pero el diario de Drizzle está desincronizado.');
        logger.info('Intentando continuar con el esquema actual...');
      } else {
        throw error;
      }
    }
    
    sqlite.close();
  } catch (error) {
    logger.error('❌ Error aplicando migraciones:', error);
    // No salimos del proceso aquí para permitir que la app intente arrancar o mostrar un error UI
    throw error;
  }
};
