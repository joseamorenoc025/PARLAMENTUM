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
