import { app, safeStorage } from 'electron';
import path from 'path';
import fs from 'fs';
import { logger } from '../../lib/logger.js';

const STORAGE_FILE = 'github_sync_config.json';

const getStoragePath = () => {
  return path.join(app.getPath('userData'), STORAGE_FILE);
};

/**
 * Guarda el token de GitHub de forma segura.
 * @param {string} token 
 */
export const saveToken = async (token) => {
  try {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('La encriptación no está disponible en este sistema.');
    }

    const encryptedToken = safeStorage.encryptString(token);
    const storagePath = getStoragePath();
    
    let config = {};
    if (fs.existsSync(storagePath)) {
      config = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
    }

    config.github_token = encryptedToken.toString('base64');
    config.updated_at = new Date().toISOString();

    fs.writeFileSync(storagePath, JSON.stringify(config, null, 2));
    logger.info('Token de GitHub guardado con éxito.');
    return true;
  } catch (error) {
    logger.error('Error al guardar el token de GitHub:', error);
    throw error;
  }
};

/**
 * Recupera el token de GitHub y lo desencripta.
 * @returns {Promise<string|null>}
 */
export const loadToken = async () => {
  try {
    const storagePath = getStoragePath();
    if (!fs.existsSync(storagePath)) return null;

    const config = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
    if (!config.github_token) return null;

    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('La encriptación no está disponible para desencriptar el token.');
    }

    const encryptedBuffer = Buffer.from(config.github_token, 'base64');
    return safeStorage.decryptString(encryptedBuffer);
  } catch (error) {
    logger.error('Error al cargar el token de GitHub:', error);
    return null;
  }
};

/**
 * Elimina el token guardado.
 */
export const clearToken = async () => {
  try {
    const storagePath = getStoragePath();
    if (fs.existsSync(storagePath)) {
      const config = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
      delete config.github_token;
      fs.writeFileSync(storagePath, JSON.stringify(config, null, 2));
    }
    logger.info('Token de GitHub eliminado.');
    return true;
  } catch (error) {
    logger.error('Error al eliminar el token de GitHub:', error);
    throw error;
  }
};
