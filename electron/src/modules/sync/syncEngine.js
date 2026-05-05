import { z } from 'zod';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { logger } from '../../lib/logger.js';
import { loadToken } from './tokenStorage.js';
import { GitHubClient } from './githubClient.js';
import { eq } from 'drizzle-orm';

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
    this.filePath = 'leyes.json';
  }

  /**
   * Ejecuta el proceso completo de sincronización.
   */
  async run() {
    try {
      const token = await loadToken();
      if (!token) throw new Error('Token de GitHub no configurado.');

      const client = new GitHubClient(token);
      
      // 1. Obtener datos locales
      const localLaws = db.select().from(schema.laws).where(eq(schema.laws.activo, 1)).all();
      
      // 2. Obtener datos remotos
      const remote = await client.getRemoteFile(this.owner, this.repo, this.filePath);
      let remoteLaws = [];
      let sha = null;

      if (remote.exists) {
        try {
          remoteLaws = JSON.parse(remote.content);
          sha = remote.sha;
          // Validar formato
          LeyesJsonSchema.parse(remoteLaws);
        } catch (e) {
          logger.error('Error al parsear o validar leyes.json remoto. Se sobrescribirá.', e);
          remoteLaws = [];
        }
      }

      // 3. Generar Delta / Merge
      const updatedJson = this.mergeLaws(localLaws, remoteLaws);

      // 4. Validar resultado final antes de subir
      LeyesJsonSchema.parse(updatedJson);

      // 5. Subir a GitHub
      const contentString = JSON.stringify(updatedJson, null, 2);
      const message = `Sync: Actualización automática de leyes (${new Date().toISOString()})`;
      
      await client.updateFile(this.owner, this.repo, this.filePath, contentString, message, sha);

      logger.info(`Sincronización exitosa: ${updatedJson.length} leyes publicadas.`);
      return { success: true, count: updatedJson.length };

    } catch (error) {
      logger.error('Error en SyncEngine.run:', error);
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
