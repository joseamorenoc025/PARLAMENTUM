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
    
    // Healing: Asegurar tablas y columnas que suelen faltar si migraciones anteriores fallaron
    
    // 1. Asegurar tabla sync_queue (crítica para el motor de sincronización)
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
      logger.info('✅ Tabla sync_queue verificada/creada');
    } catch (e) {
      logger.error('Error asegurando tabla sync_queue:', e);
    }

    // 2. Asegurar columnas específicas
    const columnsToEnsure = [
      // Tabla: commissions
      { table: 'commissions', column: 'vicepresidente_id', type: 'INTEGER' },
      { table: 'commissions', column: 'miembro_1_id', type: 'INTEGER' },
      { table: 'commissions', column: 'miembro_2_id', type: 'INTEGER' },
      { table: 'commissions', column: 'miembro_3_id', type: 'INTEGER' },
      { table: 'commissions', column: 'miembro_3_nombre', type: 'TEXT' },
      
      // Tabla: sessions
      { table: 'sessions', column: 'numero_correlativo', type: 'TEXT' },
      { table: 'sessions', column: 'motivo', type: 'TEXT' },
      { table: 'sessions', column: 'hora_inicio', type: 'TEXT' },
      { table: 'sessions', column: 'hora_cierre', type: 'TEXT' },
      { table: 'sessions', column: 'periodo', type: 'TEXT' },
      { table: 'sessions', column: 'observaciones', type: 'TEXT' },
      
      // Tabla: oficios
      { table: 'oficios', column: 'numero_oficio', type: 'TEXT' },
      { table: 'oficios', column: 'organo_receptor', type: 'TEXT' },
      { table: 'oficios', column: 'asunto', type: 'TEXT' },
      { table: 'oficios', column: 'sesion_id', type: 'INTEGER' },
      
      // Tabla: laws
      { table: 'laws', column: 'titulo', type: 'TEXT' },
      { table: 'laws', column: 'expediente', type: 'TEXT' },
      { table: 'laws', column: 'fecha_publicacion', type: 'TEXT' },
      { table: 'laws', column: 'contenido', type: 'TEXT' },
      { table: 'laws', column: 'file_hash', type: 'TEXT' },
      
      // Tabla: projects
      { table: 'projects', column: 'fecha_actualizacion', type: 'TEXT' },
      { table: 'projects', column: 'urgencia_parlamentaria', type: 'INTEGER' },
      
      // Tabla: audit_logs
      { table: 'audit_logs', column: 'entity_type', type: 'TEXT' },
      { table: 'audit_logs', column: 'entity_id', type: 'INTEGER' },
    ];

    for (const item of columnsToEnsure) {
      try {
        sqlite.prepare(`ALTER TABLE \`${item.table}\` ADD COLUMN \`${item.column}\` ${item.type}`).run();
        logger.info(`✅ Columna añadida: ${item.table}.${item.column}`);
      } catch (e) {
        // Ignorar si la columna ya existe
        if (!e.message.includes('duplicate column name')) {
          // Si la tabla no existe, fallará aquí pero migrate() la creará después
        }
      }
    }

    const db = drizzle(sqlite);
    
    logger.info('Iniciando migraciones de base de datos...');
    
    migrate(db, {
      migrationsFolder: path.join(__dirname, 'migrations'),
    });
    
    logger.info('✅ Migraciones aplicadas exitosamente');
    sqlite.close();
  } catch (error) {
    logger.error('❌ Error aplicando migraciones:', error);
    // No salimos del proceso aquí para permitir que la app intente arrancar o mostrar un error UI
    throw error;
  }
};
