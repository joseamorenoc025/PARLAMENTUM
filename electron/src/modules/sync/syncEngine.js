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
    this.lawsPath = 'public/portal/leyes.json';
    this.legislatorsPath = 'public/portal/legisladores.json';
    this.projectsPath = 'public/portal/proyectos.json';
    this.configPath = 'public/portal/config.json';
    this.logoPath = 'public/portal/logo.png';
  }

  async syncLaws(client) {
    const localLaws = db.select().from(schema.laws).where(eq(schema.laws.activo, 1)).all();
    const remote = await client.getRemoteFile(this.owner, this.repo, this.lawsPath);
    
    const lawsJson = localLaws.map(local => {
      let link = local.driveLink ? this.transformDriveLink(local.driveLink) : null;
      if (local.rutaPdf) {
        // En GitHub Pages, si el JSON está en public/portal/leyes.json, 
        // y los documentos en public/portal/documentos/, el link relativo es:
        link = `documentos/${path.basename(local.rutaPdf)}`;
      }

      return {
        id: local.id,
        titulo: local.titulo,
        tipo: local.tipo,
        numero: local.numero,
        gaceta: local.gaceta,
        anio: local.anio,
        expediente: local.expediente,
        link_drive: link || this.transformDriveLink(local.contenido?.replace('Enlace de descarga: ', '')),
        fecha_publicacion: local.fechaPublicacion,
        updated_at: new Date().toISOString()
      };
    });

    await client.updateFile(this.owner, this.repo, this.lawsPath, JSON.stringify(lawsJson, null, 2), `Sync: Leyes ${new Date().toISOString()}`, remote.sha);
    
    // Sincronizar archivos físicos
    for (const law of localLaws) {
      if (law.rutaPdf && fs.existsSync(law.rutaPdf)) {
        const fileName = path.basename(law.rutaPdf);
        const remoteDocPath = `public/portal/documentos/${fileName}`;
        const buffer = fs.readFileSync(law.rutaPdf);
        
        try {
          const remoteFile = await client.getRemoteFile(this.owner, this.repo, remoteDocPath);
          if (!remoteFile.exists) {
            await client.updateFile(this.owner, this.repo, remoteDocPath, buffer, `Sync: Documento ${fileName}`);
          }
        } catch (e) {
          logger.error(`Error syncing PDF file ${fileName}:`, e);
        }
      }
    }

    return lawsJson.length;
  }

  async syncProjects(client) {
    const localProjects = db.select().from(schema.projects).where(eq(schema.projects.activo, 1)).all();
    const localLegislators = db.select().from(schema.legislators).all();
    const localCommissions = db.select().from(schema.commissions).all();

    const projectsJson = localProjects.map(p => ({
      id: p.id,
      expediente: p.expediente,
      titulo: p.titulo,
      extracto: p.extracto,
      fase_actual: p.faseActual,
      origen: p.origen,
      urgencia: p.urgenciaParlamentaria,
      estado: p.estado,
      prioridad: p.prioridad,
      fecha_ingreso: p.fechaIngreso,
      ponente: localLegislators.find(l => l.id === p.ponenteId)?.nombre || 'No asignado',
      comision: localCommissions.find(c => c.id === p.comisionId)?.nombre || 'No asignada',
      updated_at: p.ultimaActualizacion
    }));

    const remote = await client.getRemoteFile(this.owner, this.repo, this.projectsPath);
    await client.updateFile(this.owner, this.repo, this.projectsPath, JSON.stringify(projectsJson, null, 2), `Sync: Agenda ${new Date().toISOString()}`, remote.sha);
  }

  async syncLegislators(client) {
    const localLegislators = db.select().from(schema.legislators).where(eq(schema.legislators.activo, 1)).all();
    const localCommissions = db.select().from(schema.commissions).where(eq(schema.commissions.activo, 1)).all();

    const legislatorsJson = localLegislators.map(l => {
      const coms = localCommissions.filter(c => 
        c.presidenteId === l.id || 
        c.vicepresidenteId === l.id || 
        c.miembro1Id === l.id || 
        c.miembro2Id === l.id || 
        c.miembro3Id === l.id
      ).map(c => ({
        nombre: c.nombre,
        cargo: c.presidenteId === l.id ? 'Presidente' : 
               c.vicepresidenteId === l.id ? 'Vicepresidente' : 'Miembro'
      }));

      return {
        id: l.id,
        nombre: l.nombre,
        partido: l.partidoPolitico,
        biografia: l.biografia,
        foto: l.foto,
        comisiones: coms,
        updated_at: new Date().toISOString()
      };
    });

    const remote = await client.getRemoteFile(this.owner, this.repo, this.legislatorsPath);
    await client.updateFile(this.owner, this.repo, this.legislatorsPath, JSON.stringify(legislatorsJson, null, 2), `Sync: Legisladores ${new Date().toISOString()}`, remote.sha);
  }

  async syncConfig(client) {
    const localConfigs = db.select().from(schema.config).all();
    const configObj = localConfigs.reduce((acc, row) => {
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
      const remote = await client.getRemoteFile(this.owner, this.repo, this.logoPath);
      await client.updateFile(this.owner, this.repo, this.logoPath, buffer, `Sync: Logo ${new Date().toISOString()}`, remote.sha);
    }
  }

  async run(type = 'all') {
    try {
      const token = await loadToken();
      if (!token) throw new Error('Token de GitHub no configurado.');
      const client = new GitHubClient(token);
      
      if (type === 'all' || type === 'config') await this.syncConfig(client);
      if (type === 'all' || type === 'logo') await this.syncLogo(client);

      const results = {
        laws: (type === 'all' || type === 'laws') ? await this.syncLaws(client) : 0,
        legislators: (type === 'all' || type === 'legislators') ? await this.syncLegislators(client) : 0,
        projects: (type === 'all' || type === 'projects') ? await this.syncProjects(client) : 0
      };

      logger.info(`Sincronización [${type}] exitosa. Detalle:`, results);
      return { success: true, count: results.laws };
    } catch (error) {
      logger.error(`Error en SyncEngine.run [${type}]:`, error);
      throw error;
    }
  }

  /**
   * Transforma un link de Google Drive a un link de descarga directa
   */
  transformDriveLink(url) {
    if (!url) return url;
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();

      if (host !== 'drive.google.com') return url;

      const match = parsed.pathname.match(/\/d\/([^/]+)/);
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
