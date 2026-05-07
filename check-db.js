import Database from 'better-sqlite3';
const db = new Database('legis.db');
try {
    const row = db.prepare('SELECT COUNT(*) as count FROM sync_queue').get();
    console.log(`sync_queue count: ${row.count}`);
} catch (e) {
    console.log('sync_queue does not exist or error:', e.message);
}
db.close();
