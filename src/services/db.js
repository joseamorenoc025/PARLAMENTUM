/**
 * Servicio de Base de Datos para Segundo Cerebro Legislativo
 * Se comunica con el proceso principal de Electron a través de IPC
 */

const select = async (table, where = {}) => {
  if (!window.legisAPI) return [];
  return await window.legisAPI.invoke('db:select', { table, where });
};

const upsert = async (table, data) => {
  if (!window.legisAPI) return { lastInsertRowid: 0 };
  return await window.legisAPI.invoke('db:upsert', { table, data });
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
      // TODO: Migrar a handler específico si se requieren filtros complejos
      return await window.legisAPI.invoke('db:query', { 
          sql: 'SELECT * FROM project_versions WHERE project_id = ? ORDER BY fecha_creacion DESC', 
          params: [projectId] 
      });
  },
  saveProjectVersion: async (v) => {
    return await upsert('projectVersions', {
        ...v,
        snapshot: JSON.stringify(v.snapshot),
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
  getUserByUsername: async (username) => {
    if (!window.legisAPI) return null;
    return await window.legisAPI.invoke('auth:get-user', username);
  },
  saveUser: async (u) => {
    const result = await upsert('users', u);
    return u.id || result.lastInsertRowid;
  },
  updateLastLogin: async (id) => {
    if (!window.legisAPI) return null;
    return await window.legisAPI.invoke('auth:update-login', id);
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
