import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import * as schema from './schema.js';

const userDataPath = app.getPath('userData');
const DB_PATH = path.join(userDataPath, 'legis.db');

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });
export { sqlite };
