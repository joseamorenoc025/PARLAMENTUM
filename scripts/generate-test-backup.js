import { encryptData } from '../electron/src/lib/cryptoUtils.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, '../test/fixtures');
const OUTPUT_BACKUP = path.join(FIXTURES_DIR, 'valid-backup.clbak');
const PASSWORD = 'Test1234!';

async function generate() {
  if (!fs.existsSync(FIXTURES_DIR)) fs.mkdirSync(FIXTURES_DIR, { recursive: true });

  // 1. Crear una "DB" mínima (solo el header de SQLite para que no explote al abrir)
  const dbBuffer = Buffer.alloc(4096);
  dbBuffer.write("SQLite format 3\0", 0, "utf8");

  // 3. Encriptar
  const encrypted = await encryptData(dbBuffer, PASSWORD);

  // 4. Formatear como el objeto que espera la app (con Base64)
  const backupObj = {
    ...encrypted,
    salt: encrypted.salt.toString('base64'),
    iv: encrypted.iv.toString('base64'),
    ciphertext: encrypted.ciphertext.toString('base64'),
    authTag: encrypted.authTag.toString('base64'),
    metadata: {
      timestamp: new Date().toISOString(),
      appVersion: '1.0.0-test',
      platform: 'test',
      chamberName: 'Cámara de Pruebas E2E'
    }
  };

  // 5. Guardar
  fs.writeFileSync(OUTPUT_BACKUP, JSON.stringify(backupObj, null, 2));
  
  console.log(`✅ Fixture generado en: ${OUTPUT_BACKUP}`);
  console.log(`🔑 Contraseña: ${PASSWORD}`);
}

generate().catch(console.error);
