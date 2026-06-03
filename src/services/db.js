/**
 * Servicio de Base de Datos para PARLAMENTUM
 * Se comunica con el proceso principal de Electron a través de IPC
 */

const select = async (table, where = {}) => {
  if (!window.legisAPI) return [];
  return await window.legisAPI.db.select(table, where);
};

const upsert = async (table, data) => {
  if (!window.legisAPI) return { lastInsertRowid: 0 };
  return await window.legisAPI.db.upsert(table, data);
};

export const dbService = {
  // Configuración
  getConfig: async () => {
    const rows = await select('config');
    return rows.reduce((acc, row) => {
      try {
        acc[row.key] = JSON.parse(row.value);
      } catch {
        acc[row.key] = row.value;
      }
      return acc;
    }, {});
  },
  saveConfig: async (config) => {
    for (const [key, value] of Object.entries(config)) {
      await upsert('config', { key, value: JSON.stringify(value) });
    }
  },

  // Legisladores
  getLegislators: async () => select('legislators'),
  saveLegislator: async (l) => {
    const result = await upsert('legislators', l);
    return l.id || result.lastInsertRowid;
  },
  deleteLegislator: async (id) => upsert('legislators', { id, activo: 0 }),

  // Comisiones
  getCommissions: async () => select('commissions'),
  saveCommission: async (c) => {
    const result = await upsert('commissions', c);
    return c.id || result.lastInsertRowid;
  },
  deleteCommission: async (id) => upsert('commissions', { id, activo: 0 }),

  // Sesiones
  getSessions: async () => select('sessions'),
  saveSession: async (s) => {
    const result = await upsert('sessions', s);
    return s.id || result.lastInsertRowid;
  },
  deleteSession: async (id) => upsert('sessions', { id, activo: 0 }),

  // Oficios
  getOficios: async () => select('oficios'),
  saveOficio: async (o) => {
    const result = await upsert('oficios', o);
    return o.id || result.lastInsertRowid;
  },
  deleteOficio: async (id) => upsert('oficios', { id, activo: 0 }),

  // Acuerdos
  getAgreements: async () => select('agreements'),
  saveAgreement: async (a) => {
    const result = await upsert('agreements', a);
    return a.id || result.lastInsertRowid;
  },
  deleteAgreement: async (id) => upsert('agreements', { id, activo: 0 }),

  // Proyectos
  getProjects: async () => select('projects'),
  saveProject: async (p) => {
    const result = await upsert('projects', p);
    return p.id || result.lastInsertRowid;
  },
  deleteProject: async (id) => upsert('projects', { id, activo: 0 }),

  // Versiones de Proyectos
  getProjectVersions: async (projectId) => {
      if (!window.legisAPI) return [];
      const rows = await window.legisAPI.db.query(
          'SELECT * FROM project_versions WHERE project_id = ? ORDER BY fecha_creacion DESC',
          [projectId]
      );
      return rows.map(r => {
          let snapshotData = {};
          try {
              snapshotData = JSON.parse(r.snapshot || '{}');
          } catch (e) {
              console.error('Error parsing version snapshot:', e);
          }
          return {
              id: r.id,
              projectId: r.project_id,
              version: r.version,
              versionLabel: r.motivo || `Fase ${r.version}`,
              mensaje: snapshotData.mensaje || r.motivo || '',
              fechaCreacion: r.fecha_creacion,
              autor: snapshotData.autor || 'Sistema'
          };
      });
  },
  saveProjectVersion: async (v) => {
    // Calcular el número de versión secuencial
    let nextVersionNumber = 1;
    try {
      const existing = await dbService.getProjectVersions(v.projectId);
      nextVersionNumber = existing.length + 1;
    } catch (e) {
      console.error('Error fetching existing versions, defaulting to 1:', e);
    }

    return await upsert('projectVersions', {
        projectId: v.projectId,
        version: nextVersionNumber,
        motivo: v.versionLabel || `Fase ${nextVersionNumber}`,
        snapshot: JSON.stringify({
            mensaje: v.mensaje,
            autor: v.autor,
            project: v.snapshot
        }),
        fechaCreacion: new Date().toISOString()
    });
  },

  // Documentos
  getDocuments: async () => select('documents'),
  saveDocument: async (d) => {
    const result = await upsert('documents', d);
    return d.id || result.lastInsertRowid;
  },
  deleteDocument: async (id) => upsert('documents', { id, activo: 0 }),

  // Biblioteca de Leyes
  getLaws: async () => select('laws'),
  saveLaw: async (l) => {
    const result = await upsert('laws', l);
    return l.id || result.lastInsertRowid;
  },
  deleteLaw: async (id) => upsert('laws', { id, activo: 0 }),

  // Usuarios y Autenticación
  getUsers: async () => select('users'),
  getUserByUsername: async () => {
    if (!window.legisAPI) return null;
    return await window.legisAPI.auth.getUser();
  },
  saveUser: async (u) => {
    const result = await upsert('users', u);
    return u.id || result.lastInsertRowid;
  },
  updateLastLogin: async (id) => {
    if (!window.legisAPI) return null;
    return await window.legisAPI.auth.updateLogin(id);
  },

  // Backups
  createLocalBackup: async () => {
    if (!window.legisAPI) return { success: false, error: 'Bridge not available' };
    return await window.legisAPI.db.backupLocal();
  },

  // Auditoría
  getAuditLogs: async () => select('auditLogs'),
  addAuditLog: async (log) => {
    // La lógica de firma se podría mover al Proceso Principal para mayor seguridad
    // Por ahora simplificamos el guardado
    await upsert('auditLogs', {
        ...log,
        timestamp: new Date().toISOString(),
        changes: log.changes ? JSON.stringify(log.changes) : null
    });
  }
};
