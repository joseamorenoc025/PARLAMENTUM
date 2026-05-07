import { z } from 'zod';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { logger } from '../../lib/logger.js';
import { loadToken } from './tokenStorage.js';
import { GitHubClient } from './githubClient.js';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// Esquema de validación para una ley en el JSON remoto
const LawMetadataSchema = z.object({
  id: z.number(),
  titulo: z.string(),
  expediente: z.string().optional().nullable(),
  tipo: z.string().optional().nullable(),
  anio: z.number().optional().nullable(),
  fecha_publicacion: z.string().optional().nullable(),
  link_drive: z.string().url().optional().nullable(),
  updated_at: z.string()
});

const LeyesJsonSchema = z.array(LawMetadataSchema);

/**
 * Motor de sincronización entre DB local y GitHub.
 */
export class SyncEngine {
  constructor(owner, repo) {
    this.owner = owner;
    this.repo = repo;
    this.lawsPath = 'leyes.json';
    this.configPath = 'config.json';
    this.logoPath = 'logo.png';
  }

  async syncLaws(client) {
    const localLaws = db.select().from(schema.laws).where(eq(schema.laws.activo, 1)).all();
    const remote = await client.getRemoteFile(this.owner, this.repo, this.lawsPath);
    let remoteLaws = [];
    if (remote.exists) {
      try {
        remoteLaws = JSON.parse(remote.content);
        LeyesJsonSchema.parse(remoteLaws);
      } catch (e) { 
        logger.error('Error parsing remote laws, starting fresh', e);
        remoteLaws = []; 
      }
    }
    const updatedJson = this.mergeLaws(localLaws, remoteLaws);
    const contentString = JSON.stringify(updatedJson, null, 2);
    await client.updateFile(this.owner, this.repo, this.lawsPath, contentString, `Sync: Leyes ${new Date().toISOString()}`, remote.sha);
    return updatedJson.length;
  }

  async syncConfig(client) {
    const localConfigs = db.select().from(schema.config).all();
    const configObj = localConfigs.reduce((acc, row) => {
      // Solo sincronizar configs públicas
      if (['chamber_name', 'timezone'].includes(row.key)) {
        acc[row.key] = row.value;
      }
      return acc;
    }, { last_sync: new Date().toISOString() });

    const remote = await client.getRemoteFile(this.owner, this.repo, this.configPath);
    await client.updateFile(this.owner, this.repo, this.configPath, JSON.stringify(configObj, null, 2), `Sync: Config ${new Date().toISOString()}`, remote.sha);
  }

  async syncLogo(client) {
    const logoConfig = db.select().from(schema.config).where(eq(schema.config.key, 'logo_path')).all();
    if (logoConfig.length > 0 && fs.existsSync(logoConfig[0].value)) {
      const buffer = fs.readFileSync(logoConfig[0].value);
      const remote = await client.getRemoteFile(this.owner, this.repo, this.logoPath); // Solo para el SHA
      await client.updateFile(this.owner, this.repo, this.logoPath, buffer, `Sync: Logo ${new Date().toISOString()}`, remote.sha);
    }
  }

  /**
   * Ejecuta el proceso completo de sincronización.
   */
  async run(type = 'all') {
    try {
      const token = await loadToken();
      if (!token) throw new Error('Token de GitHub no configurado.');
      const client = new GitHubClient(token);
      
      if (type === 'all' || type === 'laws') await this.syncLaws(client);
      if (type === 'all' || type === 'config') await this.syncConfig(client);
      if (type === 'all' || type === 'logo') await this.syncLogo(client);

      logger.info(`Sincronización [${type}] exitosa.`);
      return { success: true };
    } catch (error) {
      logger.error(`Error en SyncEngine.run [${type}]:`, error);
      throw error;
    }
  }

  /**
   * Transforma un link de Google Drive a un link de descarga directa
   */
  transformDriveLink(url) {
    if (!url || !url.includes('drive.google.com')) return url;
    try {
      const match = url.match(/\/d\/(.+?)(\/|$|\?)/);
      if (match && match[1]) {
        return `https://drive.google.com/uc?export=download&id=${match[1]}`;
      }
    } catch (e) {
      logger.error('Error transformando link de Drive en SyncEngine:', e);
    }
    return url;
  }

  /**
   * Mezcla las leyes locales con las remotas preservando campos extra (como links de drive manuales).
   */
  mergeLaws(localLaws, remoteLaws) {
    const remoteMap = new Map(remoteLaws.map(l => [l.id, l]));
    
    const merged = localLaws.map(local => {
      const remote = remoteMap.get(local.id);
      const rawLink = remote?.link_drive || (local.qrData?.startsWith('http') ? local.qrData : null);
      
      // Mapeo de campos de DB local a JSON público
      return {
        id: local.id,
        titulo: local.titulo || local.nombre || 'Sin título',
        expediente: local.expediente,
        tipo: local.tipo,
        anio: local.anio,
        fecha_publicacion: local.fechaPublicacion,
        link_drive: this.transformDriveLink(rawLink),
        updated_at: new Date().toISOString()
      };
    });

    return merged;
  }
}
