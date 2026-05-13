import crypto from 'crypto';
import { promisify } from 'util';

const pbkdf2 = promisify(crypto.pbkdf2);

/**
 * Deriva una clave de 32 bytes a partir de una contraseña y un salt.
 */
export async function deriveKey(password, salt) {
  return await pbkdf2(password, salt, 100000, 32, 'sha256');
}

/**
 * Genera un hash SHA-256 de un buffer.
 */
export function generateHash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Encripta un buffer usando AES-256-GCM.
 */
export async function encryptData(data, password) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = await deriveKey(password, salt);
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  const hash = generateHash(Buffer.concat([ciphertext, authTag]));
  
  return {
    version: 1,
    algorithm: 'aes-256-gcm',
    kdf: 'pbkdf2-sha256',
    salt,
    iv,
    ciphertext,
    authTag,
    hash
  };
}

/**
 * Desencripta un buffer usando AES-256-GCM.
 */
export async function decryptData(encryptedData, password) {
  const { salt, iv, ciphertext, authTag, hash } = encryptedData;
  
  // Validar integridad del hash antes de intentar desencriptar
  const calculatedHash = generateHash(Buffer.concat([ciphertext, authTag]));
  if (!crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(calculatedHash))) {
    throw new Error('CORRUPTED_FILE');
  }

  const key = await deriveKey(password, salt);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  try {
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted;
  } catch (err) {
    throw new Error('INVALID_CREDENTIALS');
  }
}
