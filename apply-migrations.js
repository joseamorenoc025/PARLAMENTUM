import { runMigrations } from './electron/src/db/migrate.js';
import path from 'path';
import { fileURLToPath } from 'url';

const DB_PATH = path.resolve('legis.db');
console.log(`Applying migrations to ${DB_PATH}...`);

try {
  runMigrations(DB_PATH);
  console.log('Success!');
} catch (err) {
  console.error('Failed:', err);
  process.exit(1);
}
