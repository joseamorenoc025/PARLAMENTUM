import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { schema } from './schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../../legis.db');

const db = new Database(dbPath);

console.log('Ejecutando migraciones...');
db.exec(schema);
console.log('Migraciones completadas con éxito.');
db.close();
