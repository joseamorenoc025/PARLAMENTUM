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
    
    // 1. Ejecutar migraciones estándar de Drizzle
    try {
      migrate(db, {
        migrationsFolder: path.join(__dirname, 'migrations'),
      });
      logger.info('✅ Migraciones de Drizzle aplicadas');
    } catch (error) {
      logger.error('❌ Error en migraciones de Drizzle:', error);
    }

    // 2. Verificación Manual Forzada (Parche para columnas faltantes)
    try {
      logger.info('Verificando integridad de columnas en "projects"...');
      const tableInfo = sqlite.prepare("PRAGMA table_info(projects)").all();
      const existingColumns = tableInfo.map(c => c.name);
      
      const missingColumns = [
        ['fase_actual', "text DEFAULT 'Estudio en Comisión'"],
        ['link_1ra_discusion', "text"],
        ['link_consulta_publica', "text"],
        ['link_2da_discusion', "text"],
        ['link_3ra_discusion', "text"],
        ['fecha_consulta_publica', "text"],
        ['urgencia_parlamentaria', "integer DEFAULT 0"],
        ['fecha_ingreso', "text"],
        ['fecha_actualizacion', "text DEFAULT CURRENT_TIMESTAMP"]
      ];

      for (const [col, def] of missingColumns) {
        if (!existingColumns.includes(col)) {
          logger.info(`Añadiendo columna faltante: ${col}`);
          sqlite.prepare(`ALTER TABLE projects ADD COLUMN ${col} ${def}`).run();
        }
      }

      // 3. Asegurar tabla de acuerdos
      sqlite.prepare(`
        CREATE TABLE IF NOT EXISTS agreements (
          id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
          numero_correlativo text UNIQUE,
          fecha text NOT NULL,
          objeto text NOT NULL,
          sesion_id integer,
          drive_link text,
          activo integer DEFAULT 1,
          FOREIGN KEY (sesion_id) REFERENCES sessions(id)
        )
      `).run();

      logger.info('✅ Integridad de base de datos verificada');
    } catch (error) {
      logger.error('❌ Error en verificación manual de esquema:', error);
    }
    
    sqlite.close();
  } catch (error) {
    logger.error('❌ Error crítico en el proceso de base de datos:', error);
    throw error;
  }
};
