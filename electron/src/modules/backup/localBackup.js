import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const ITERATIONS = 100000;
const KEY_LENGTH = 32;

/**
 * Genera un backup cifrado del sistema (DB + Config)
 * @param {string} dbPath - Ruta a la base de datos
 * @param {string} configPath - Ruta al config.json
 * @param {string} password - Contraseña para el cifrado
 * @returns {Promise<Buffer>} - Buffer cifrado listo para guardar
 */
export async function createBackupBuffer(dbPath, configPath, password) {
  const dbContent = fs.readFileSync(dbPath);
  const configContent = fs.existsSync(configPath) ? fs.readFileSync(configPath) : Buffer.from('{}');

  // Empaquetar: [DB_SIZE (4)] [DB_DATA] [CONFIG_DATA]
  const dbSizeBuf = Buffer.alloc(4);
  dbSizeBuf.writeUInt32BE(dbContent.length);

  const payload = Buffer.concat([dbSizeBuf, dbContent, configContent]);

  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Estructura: SALT (64) + IV (12) + TAG (16) + ENCRYPTED_DATA
  return Buffer.concat([salt, iv, authTag, encrypted]);
}

/**
 * Restaura el sistema desde un buffer cifrado
 * @param {Buffer} backupBuffer - El buffer cargado desde archivo
 * @param {string} targetDbPath - Donde guardar la DB
 * @param {string} targetConfigPath - Donde guardar el config
 * @param {string} password - Contraseña utilizada
 */
export async function restoreFromBuffer(backupBuffer, targetDbPath, targetConfigPath, password) {
  try {
    const salt = backupBuffer.subarray(0, SALT_LENGTH);
    const iv = backupBuffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = backupBuffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encryptedData = backupBuffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    
    // Desempaquetar
    const dbSize = decrypted.readUInt32BE(0);
    const dbData = decrypted.subarray(4, 4 + dbSize);
    const configData = decrypted.subarray(4 + dbSize);

    fs.writeFileSync(targetDbPath, dbData);
    fs.writeFileSync(targetConfigPath, configData);
    
    return true;
  } catch (error) {
    console.error('Error al descifrar el backup:', error);
    throw new Error('Contraseña incorrecta o archivo de backup dañado.');
  }
}
