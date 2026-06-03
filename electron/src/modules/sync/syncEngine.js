import { z } from 'zod';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { logger } from '../../lib/logger.js';
import { loadToken } from './tokenStorage.js';
import { GitHubClient } from './githubClient.js';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

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
  constructor(owner, repo, branch = 'gh-pages') {
    this.owner = owner;
    this.repo = repo;
    this.branch = branch;
    this.lawsPath = 'public/portal/leyes.json';
    this.legislatorsPath = 'public/portal/legisladores.json';
    this.juntaPath = 'public/portal/junta_directiva.json';
    this.projectsPath = 'public/portal/proyectos.json';
    this.configPath = 'public/portal/config.json';
    this.logoPath = 'public/portal/logo.png';
    this.agreementsPath = 'public/portal/acuerdos.json';
    this.sessionsPath = 'public/portal/sesiones.json';
    this.oficiosPath = 'public/portal/oficios.json';
  }

  /**
   * El portal en `gh-pages` se sirve desde la raíz, no desde `public/portal/`.
   * Esta función convierte la ruta local (usada por el portal en desarrollo)
   * a la ruta remota correcta en el branch `gh-pages`.
   */
  toRemotePath(localPath) {
    const prefix = 'public/portal/';
    if (this.branch === 'gh-pages' && localPath.startsWith(prefix)) {
      return localPath.slice(prefix.length);
    }
    return localPath;
  }

  async syncLaws(client) {
    const localLaws = db.select().from(schema.laws).where(eq(schema.laws.activo, 1)).all();
    const localDocuments = db.select().from(schema.documents).where(eq(schema.documents.activo, 1)).all();
    const remote = await client.getRemoteFile(this.owner, this.repo, this.toRemotePath(this.lawsPath));
    
    const lawsJson = localLaws.map(local => {
      let link = local.driveLink ? this.transformDriveLink(local.driveLink) : null;
      if (local.rutaPdf) {
        link = `documentos/${path.basename(local.rutaPdf)}`;
      }

      // Buscar documentos adicionales en Bóveda Documental con filtro insensible a mayúsculas y numérico
      const extraDocs = localDocuments.filter(d => d.entidadTipo?.toLowerCase() === 'law' && Number(d.entidadId) === Number(local.id));
      const adjuntos = extraDocs.map(d => ({
        id: d.id,
        nombre: d.nombreOriginal,
        relative_path: d.rutaArchivo ? `documentos/${path.basename(d.rutaArchivo)}` : null,
        hash: d.hashIntegridad
      }));

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
        adjuntos: adjuntos,
        tags: local.tags || null,
        updated_at: new Date().toISOString()
      };
    });

    // Guardar localmente para el Portal Ciudadano local
    const localPortalPath = path.join(process.cwd(), this.lawsPath);
    fs.writeFileSync(localPortalPath, JSON.stringify(lawsJson, null, 2));

    await client.updateFile(this.owner, this.repo, this.toRemotePath(this.lawsPath), JSON.stringify(lawsJson, null, 2), `Sync: Leyes ${new Date().toISOString()}`, remote.sha);
    
    // Ensure local public/portal/documentos directory exists
    const portalDocsDir = path.join(process.cwd(), 'public', 'portal', 'documentos');
    if (!fs.existsSync(portalDocsDir)) {
      fs.mkdirSync(portalDocsDir, { recursive: true });
    }

    // Sincronizar archivos físicos de leyes primarias
    for (const law of localLaws) {
      if (law.rutaPdf && fs.existsSync(law.rutaPdf)) {
        const fileName = path.basename(law.rutaPdf);
        const localDocPath = path.join(portalDocsDir, fileName);
        try {
          fs.copyFileSync(law.rutaPdf, localDocPath);
        } catch (e) {
          logger.error(`Error copying local PDF file ${fileName}:`, e);
        }

        const remoteDocPath = this.toRemotePath(`public/portal/documentos/${fileName}`);
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

      // Sincronizar archivos físicos de la Bóveda vinculados a Leyes
      const extraDocs = localDocuments.filter(d => d.entidadTipo?.toLowerCase() === 'law' && Number(d.entidadId) === Number(law.id));
      for (const doc of extraDocs) {
        if (doc.rutaArchivo && fs.existsSync(doc.rutaArchivo)) {
          const fileName = path.basename(doc.rutaArchivo);
          const localDocPath = path.join(portalDocsDir, fileName);
          try {
            fs.copyFileSync(doc.rutaArchivo, localDocPath);
          } catch (e) {
            logger.error(`Error copying extra local PDF file ${fileName}:`, e);
          }

          const remoteDocPath = this.toRemotePath(`public/portal/documentos/${fileName}`);
          const buffer = fs.readFileSync(doc.rutaArchivo);
          
          try {
            const remoteFile = await client.getRemoteFile(this.owner, this.repo, remoteDocPath);
            if (!remoteFile.exists) {
              await client.updateFile(this.owner, this.repo, remoteDocPath, buffer, `Sync: Adjunto Ley ${fileName}`);
            }
          } catch (e) {
            logger.error(`Error syncing law Bóveda PDF ${fileName}:`, e);
          }
        }
      }
    }

    return lawsJson.length;
  }

  async syncProjects(client) {
    const localProjects = db.select().from(schema.projects).where(eq(schema.projects.activo, 1)).all();
    const localLegislators = db.select().from(schema.legislators).all();
    const localCommissions = db.select().from(schema.commissions).all();
    const localDocuments = db.select().from(schema.documents).where(eq(schema.documents.activo, 1)).all();

    const projectsJson = localProjects.map(p => {
      // Buscar documentos de fases en Bóveda Documental con filtro insensible a mayúsculas y numérico
      const projectDocs = localDocuments.filter(d => d.entidadTipo?.toLowerCase() === 'project' && Number(d.entidadId) === Number(p.id));
      const adjuntos = projectDocs.map(d => ({
        id: d.id,
        fase: d.faseEtiqueta,
        nombre: d.nombreOriginal,
        relative_path: d.rutaArchivo ? `documentos/${path.basename(d.rutaArchivo)}` : null,
        hash: d.hashIntegridad
      }));

      return {
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
        adjuntos: adjuntos,
        tags: p.tags || null,
        updated_at: p.ultimaActualizacion
      };
    });

    const remote = await client.getRemoteFile(this.owner, this.repo, this.toRemotePath(this.projectsPath));
    const localPortalPath = path.join(process.cwd(), this.projectsPath);
    fs.writeFileSync(localPortalPath, JSON.stringify(projectsJson, null, 2));

    await client.updateFile(this.owner, this.repo, this.toRemotePath(this.projectsPath), JSON.stringify(projectsJson, null, 2), `Sync: Agenda ${new Date().toISOString()}`, remote.sha);

    // Ensure local public/portal/documentos directory exists
    const portalDocsDir = path.join(process.cwd(), 'public', 'portal', 'documentos');
    if (!fs.existsSync(portalDocsDir)) {
      fs.mkdirSync(portalDocsDir, { recursive: true });
    }

    // Sincronizar archivos físicos de las fases de proyectos a public/portal/documentos/
    for (const p of localProjects) {
      const projectDocs = localDocuments.filter(d => d.entidadTipo?.toLowerCase() === 'project' && Number(d.entidadId) === Number(p.id));
      for (const doc of projectDocs) {
        if (doc.rutaArchivo && fs.existsSync(doc.rutaArchivo)) {
          const fileName = path.basename(doc.rutaArchivo);
          const localDocPath = path.join(portalDocsDir, fileName);
          try {
            fs.copyFileSync(doc.rutaArchivo, localDocPath);
          } catch (e) {
            logger.error(`Error copying project PDF file ${fileName}:`, e);
          }

          const remoteDocPath = this.toRemotePath(`public/portal/documentos/${fileName}`);
          const buffer = fs.readFileSync(doc.rutaArchivo);
          
          try {
            const remoteFile = await client.getRemoteFile(this.owner, this.repo, remoteDocPath);
            if (!remoteFile.exists) {
              await client.updateFile(this.owner, this.repo, remoteDocPath, buffer, `Sync: Adjunto Proyecto ${fileName}`);
            }
          } catch (e) {
            logger.error(`Error syncing project PDF file ${fileName}:`, e);
          }
        }
      }
    }
  }

  async syncAgreements(client) {
    const localAgreements = db.select().from(schema.agreements).where(eq(schema.agreements.activo, 1)).all();
    const localSessions = db.select().from(schema.sessions).all();

    const agreementsJson = localAgreements.map(a => ({
      id: a.id,
      numero_correlativo: a.numeroCorrelativo,
      fecha: a.fecha,
      objeto: a.objeto,
      sesion_numero: localSessions.find(s => s.id === a.sesionId)?.numeroCorrelativo || null,
      drive_link: a.driveLink || null,
      updated_at: new Date().toISOString()
    }));

    const remote = await client.getRemoteFile(this.owner, this.repo, this.toRemotePath(this.agreementsPath));
    const localPortalPath = path.join(process.cwd(), this.agreementsPath);
    fs.writeFileSync(localPortalPath, JSON.stringify(agreementsJson, null, 2));
    await client.updateFile(this.owner, this.repo, this.toRemotePath(this.agreementsPath), JSON.stringify(agreementsJson, null, 2), `Sync: Acuerdos ${new Date().toISOString()}`, remote.sha);
    return agreementsJson.length;
  }

  async syncSessions(client) {
    const localSessions = db.select().from(schema.sessions).where(eq(schema.sessions.activo, 1)).all();

    const sessionsJson = localSessions.map(s => ({
      id: s.id,
      tipo: s.tipo,
      numero_correlativo: s.numeroCorrelativo,
      motivo: s.motivo,
      fecha: s.fecha,
      hora_inicio: s.horaInicio,
      hora_cierre: s.horaCierre,
      periodo: s.periodo,
      observaciones: s.observaciones,
      orden_dia: s.ordenDia,
      acta_pdf: s.actaPdf || null,
      updated_at: new Date().toISOString()
    }));

    const remote = await client.getRemoteFile(this.owner, this.repo, this.toRemotePath(this.sessionsPath));
    const localPortalPath = path.join(process.cwd(), this.sessionsPath);
    fs.writeFileSync(localPortalPath, JSON.stringify(sessionsJson, null, 2));
    await client.updateFile(this.owner, this.repo, this.toRemotePath(this.sessionsPath), JSON.stringify(sessionsJson, null, 2), `Sync: Sesiones ${new Date().toISOString()}`, remote.sha);
    return sessionsJson.length;
  }

  async syncOficios(client) {
    const localOficios = db.select().from(schema.oficios).where(eq(schema.oficios.activo, 1)).all();

    const oficiosJson = localOficios.map(o => ({
      id: o.id,
      numero_oficio: o.numeroOficio,
      fecha: o.fecha,
      organo_receptor: o.organoReceptor,
      asunto: o.asunto,
      vinculado_a: o.vinculadoA || null,
      updated_at: new Date().toISOString()
    }));

    const remote = await client.getRemoteFile(this.owner, this.repo, this.toRemotePath(this.oficiosPath));
    const localPortalPath = path.join(process.cwd(), this.oficiosPath);
    fs.writeFileSync(localPortalPath, JSON.stringify(oficiosJson, null, 2));
    await client.updateFile(this.owner, this.repo, this.toRemotePath(this.oficiosPath), JSON.stringify(oficiosJson, null, 2), `Sync: Oficios ${new Date().toISOString()}`, remote.sha);
    return oficiosJson.length;
  }

  async syncLegislators(client) {
    const localLegislators = db.select().from(schema.legislators).where(eq(schema.legislators.activo, 1)).all();
    const localCommissions = db.select().from(schema.commissions).where(eq(schema.commissions.activo, 1)).all();

    const portalFotosDir = path.join(process.cwd(), 'public', 'portal', 'fotos');
    if (!fs.existsSync(portalFotosDir)) {
      fs.mkdirSync(portalFotosDir, { recursive: true });
    }

    const legislatorsJson = [];
    for (const l of localLegislators) {
      let relativeWebFotoPath = null;
      if (l.foto) {
        if (!l.foto.startsWith('data:image')) {
          const fullPath = path.join(app.getPath('userData'), l.foto);
          if (fs.existsSync(fullPath)) {
            const fileName = path.basename(l.foto);
            const destPath = path.join(portalFotosDir, fileName);
            fs.copyFileSync(fullPath, destPath);
            relativeWebFotoPath = `fotos/${fileName}`;

            // Sync file physically to GitHub Pages via API
            const remoteFotoPath = this.toRemotePath(`public/portal/fotos/${fileName}`);
            const buffer = fs.readFileSync(fullPath);
            try {
              const remoteFile = await client.getRemoteFile(this.owner, this.repo, remoteFotoPath);
              if (!remoteFile.exists) {
                await client.updateFile(this.owner, this.repo, remoteFotoPath, buffer, `Sync: Foto Legislador ${fileName}`);
              }
            } catch (e) {
              logger.error(`Error syncing legislator photo ${fileName}:`, e);
            }
          }
        }
      }

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

      legislatorsJson.push({
        id: l.id,
        nombre: l.nombre,
        partido: l.partidoPolitico,
        biografia: l.biografia,
        foto: relativeWebFotoPath,
        comisiones: coms,
        updated_at: new Date().toISOString()
      });
    }

    const remote = await client.getRemoteFile(this.owner, this.repo, this.toRemotePath(this.legislatorsPath));
    const localPortalPath = path.join(process.cwd(), this.legislatorsPath);
    fs.writeFileSync(localPortalPath, JSON.stringify(legislatorsJson, null, 2));

    await client.updateFile(this.owner, this.repo, this.toRemotePath(this.legislatorsPath), JSON.stringify(legislatorsJson, null, 2), `Sync: Legisladores ${new Date().toISOString()}`, remote.sha);
  }

  async syncJunta(client) {
    const localJunta = db.select().from(schema.juntaDirectiva).where(eq(schema.juntaDirectiva.activo, 1)).all();
    const portalFotosDir = path.join(process.cwd(), 'public', 'portal', 'fotos');
    if (!fs.existsSync(portalFotosDir)) {
      fs.mkdirSync(portalFotosDir, { recursive: true });
    }

    const juntaJson = [];
    for (const j of localJunta) {
      let relativeWebFotoPath = null;
      if (j.foto) {
        if (!j.foto.startsWith('data:image')) {
          const fullPath = path.join(app.getPath('userData'), j.foto);
          if (fs.existsSync(fullPath)) {
            const fileName = path.basename(j.foto);
            const destPath = path.join(portalFotosDir, fileName);
            fs.copyFileSync(fullPath, destPath);
            relativeWebFotoPath = `fotos/${fileName}`;

            // Sync file physically to GitHub Pages via API
            const remoteFotoPath = this.toRemotePath(`public/portal/fotos/${fileName}`);
            const buffer = fs.readFileSync(fullPath);
            try {
              const remoteFile = await client.getRemoteFile(this.owner, this.repo, remoteFotoPath);
              if (!remoteFile.exists) {
                await client.updateFile(this.owner, this.repo, remoteFotoPath, buffer, `Sync: Foto Junta ${fileName}`);
              }
            } catch (e) {
              logger.error(`Error syncing junta photo ${fileName}:`, e);
            }
          }
        }
      }

      juntaJson.push({
        id: j.id,
        rol: j.rol,
        nombre: j.nombre,
        foto: relativeWebFotoPath,
        partido: j.partidoPolitico || 'N/A',
        biografia: j.biografia || '',
        fecha_inicio: j.fechaInicio,
        fecha_fin: j.fechaFin,
        updated_at: new Date().toISOString()
      });
    }

    const remote = await client.getRemoteFile(this.owner, this.repo, this.toRemotePath(this.juntaPath));
    const localPortalPath = path.join(process.cwd(), this.juntaPath);
    fs.writeFileSync(localPortalPath, JSON.stringify(juntaJson, null, 2));

    await client.updateFile(this.owner, this.repo, this.toRemotePath(this.juntaPath), JSON.stringify(juntaJson, null, 2), `Sync: Junta Directiva ${new Date().toISOString()}`, remote.sha);
  }

  async syncConfig(client) {
    const localConfigs = db.select().from(schema.config).all();
    const configObj = localConfigs.reduce((acc, row) => {
      if (['chamber_name', 'timezone'].includes(row.key)) {
        acc[row.key] = row.value;
      }
      return acc;
    }, { last_sync: new Date().toISOString() });

    const remote = await client.getRemoteFile(this.owner, this.repo, this.toRemotePath(this.configPath));
    const localPortalPath = path.join(process.cwd(), this.configPath);
    fs.writeFileSync(localPortalPath, JSON.stringify(configObj, null, 2));

    await client.updateFile(this.owner, this.repo, this.toRemotePath(this.configPath), JSON.stringify(configObj, null, 2), `Sync: Config ${new Date().toISOString()}`, remote.sha);
  }

  async syncLogo(client) {
    const logoConfig = db.select().from(schema.config).where(eq(schema.config.key, 'logo_path')).all();
    if (logoConfig.length > 0 && fs.existsSync(logoConfig[0].value)) {
      const buffer = fs.readFileSync(logoConfig[0].value);
      const remote = await client.getRemoteFile(this.owner, this.repo, this.toRemotePath(this.logoPath));
      await client.updateFile(this.owner, this.repo, this.toRemotePath(this.logoPath), buffer, `Sync: Logo ${new Date().toISOString()}`, remote.sha);
    }
  }

  async syncPortalUI(client) {
    const uiFiles = [
      { local: 'public/portal/index.html', remote: 'public/portal/index.html', binary: false },
      { local: 'public/portal/styles.css', remote: 'public/portal/styles.css', binary: false },
      { local: 'public/portal/app.js', remote: 'public/portal/app.js', binary: false },
      { local: 'public/portal/manifest.json', remote: 'public/portal/manifest.json', binary: false },
      { local: 'public/portal/service-worker.js', remote: 'public/portal/service-worker.js', binary: false },
      { local: 'public/portal/assets/logo-parlamentum.png', remote: 'public/portal/assets/logo-parlamentum.png', binary: true },
      { local: 'public/portal/assets/logo-institucional.png', remote: 'public/portal/assets/logo-institucional.png', binary: true }
    ];

    for (const file of uiFiles) {
      const localPath = path.join(process.cwd(), file.local);
      if (fs.existsSync(localPath)) {
        const content = file.binary ? fs.readFileSync(localPath) : fs.readFileSync(localPath, 'utf8');
        const remotePath = this.toRemotePath(file.remote);
        const remoteFile = await client.getRemoteFile(this.owner, this.repo, remotePath);
        // Solo actualizar si el contenido es diferente (opcional, por ahora siempre actualizamos)
        await client.updateFile(this.owner, this.repo, remotePath, content, `Sync: UI ${path.basename(file.local)}`, remoteFile.sha);
      }
    }
  }

  async run(type = 'all') {
    try {
      const token = await loadToken();
      if (!token) throw new Error('Token de GitHub no configurado.');
      const client = new GitHubClient(token);
      
      const results = { laws: 0, legislators: 0, projects: 0 };

      // Configuración
      try {
        if (type === 'all' || type === 'config') await this.syncConfig(client);
      } catch (e) {
        logger.error('Error sincronizando configuración:', e);
      }

      // Logo
      try {
        if (type === 'all' || type === 'logo') await this.syncLogo(client);
      } catch (e) {
        logger.error('Error sincronizando logo:', e);
      }

      // UI del Portal (HTML, CSS, JS)
      try {
        if (type === 'all' || type === 'ui') await this.syncPortalUI(client);
      } catch (e) {
        logger.error('Error sincronizando UI del portal:', e);
      }

      // Leyes
      try {
        if (type === 'all' || type === 'laws') results.laws = await this.syncLaws(client);
      } catch (e) {
        logger.error('Error sincronizando leyes:', e);
      }

      // Legisladores
      try {
        if (type === 'all' || type === 'legislators') {
          await this.syncLegislators(client);
          await this.syncJunta(client);
        }
      } catch (e) {
        logger.error('Error sincronizando legisladores:', e);
      }

      // Proyectos
      try {
        if (type === 'all' || type === 'projects') await this.syncProjects(client);
      } catch (e) {
        logger.error('Error sincronizando proyectos:', e);
      }

      // Acuerdos
      try {
        if (type === 'all' || type === 'agreements') await this.syncAgreements(client);
      } catch (e) {
        logger.error('Error sincronizando acuerdos:', e);
      }

      // Sesiones
      try {
        if (type === 'all' || type === 'sessions') await this.syncSessions(client);
      } catch (e) {
        logger.error('Error sincronizando sesiones:', e);
      }

      // Oficios
      try {
        if (type === 'all' || type === 'oficios') await this.syncOficios(client);
      } catch (e) {
        logger.error('Error sincronizando oficios:', e);
      }

      logger.info(`Sincronización [${type}] finalizada.`);
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
