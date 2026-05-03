/**
 * Servicio de Base de Datos para Segundo Cerebro Legislativo
 * Se comunica con el proceso principal de Electron a través de IPC
 */

const query = async (sql, params = []) => {
  return await window.legisAPI.invoke('db:query', { sql, params });
};

export const dbService = {
  // Configuración
  getConfig: async () => {
    const rows = await query('SELECT * FROM config');
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
      await query('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)', [key, JSON.stringify(value)]);
    }
  },

  // Legisladores
  getLegislators: async () => query('SELECT * FROM legislators WHERE activo = 1'),
  saveLegislator: async (l) => {
    if (l.id) {
      await query(
        'UPDATE legislators SET nombre = ?, partido_politico = ?, contacto = ?, notas = ? WHERE id = ?',
        [l.nombre, l.partido_politico, l.contacto, l.notas, l.id]
      );
      return l.id;
    } else {
      const result = await query(
        'INSERT INTO legislators (nombre, partido_politico, contacto, notas) VALUES (?, ?, ?, ?)',
        [l.nombre, l.partido_politico, l.contacto, l.notas]
      );
      return result.lastInsertRowid;
    }
  },
  deleteLegislator: async (id) => query('UPDATE legislators SET activo = 0 WHERE id = ?', [id]),

  // Comisiones
  getCommissions: async () => query('SELECT * FROM commissions WHERE activo = 1'),
  saveCommission: async (c) => {
    const params = [
      c.nombre, 
      c.presidente_id || null, 
      c.vicepresidente_id || null, 
      c.miembro_1_id || null, 
      c.miembro_2_id || null, 
      c.miembro_3_id || null,
      c.miembro_3_nombre || null
    ];
    if (c.id) {
      await query(
        'UPDATE commissions SET nombre = ?, presidente_id = ?, vicepresidente_id = ?, miembro_1_id = ?, miembro_2_id = ?, miembro_3_id = ?, miembro_3_nombre = ? WHERE id = ?', 
        [...params, c.id]
      );
      return c.id;
    } else {
      const result = await query(
        'INSERT INTO commissions (nombre, presidente_id, vicepresidente_id, miembro_1_id, miembro_2_id, miembro_3_id, miembro_3_nombre) VALUES (?, ?, ?, ?, ?, ?, ?)', 
        params
      );
      return result.lastInsertRowid;
    }
  },
  deleteCommission: async (id) => query('UPDATE commissions SET activo = 0 WHERE id = ?', [id]),

  // Sesiones
  getSessions: async () => query('SELECT * FROM sessions WHERE activo = 1 ORDER BY fecha DESC'),
  saveSession: async (s) => {
    const params = [s.tipo, s.numero_correlativo, s.motivo, s.fecha, s.hora_inicio, s.hora_cierre, s.periodo, s.observaciones];
    if (s.id) {
      await query(
        'UPDATE sessions SET tipo = ?, numero_correlativo = ?, motivo = ?, fecha = ?, hora_inicio = ?, hora_cierre = ?, periodo = ?, observaciones = ? WHERE id = ?',
        [...params, s.id]
      );
      return s.id;
    } else {
      const result = await query(
        'INSERT INTO sessions (tipo, numero_correlativo, motivo, fecha, hora_inicio, hora_cierre, periodo, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        params
      );
      return result.lastInsertRowid;
    }
  },
  deleteSession: async (id) => query('UPDATE sessions SET activo = 0 WHERE id = ?', [id]),

  // Oficios
  getOficios: async () => query('SELECT * FROM oficios WHERE activo = 1 ORDER BY fecha DESC'),
  saveOficio: async (o) => {
    const params = [o.numero_oficio, o.fecha, o.organo_receptor, o.asunto, o.sesion_id];
    if (o.id) {
      await query(
        'UPDATE oficios SET numero_oficio = ?, fecha = ?, organo_receptor = ?, asunto = ?, sesion_id = ? WHERE id = ?',
        [...params, o.id]
      );
      return o.id;
    } else {
      const result = await query(
        'INSERT INTO oficios (numero_oficio, fecha, organo_receptor, asunto, sesion_id) VALUES (?, ?, ?, ?, ?)',
        params
      );
      return result.lastInsertRowid;
    }
  },
  deleteOficio: async (id) => query('UPDATE oficios SET activo = 0 WHERE id = ?', [id]),

  // Proyectos
  getProjects: async () => query('SELECT * FROM projects WHERE activo = 1 ORDER BY fecha_actualizacion DESC'),
  saveProject: async (p) => {
    const params = [p.titulo, p.origen, p.comision_id, p.ponente_id, p.fase_actual, p.urgencia_parlamentaria, p.fecha_ingreso, p.fecha_actualizacion];
    if (p.id) {
      await query(
        'UPDATE projects SET titulo = ?, origen = ?, comision_id = ?, ponente_id = ?, fase_actual = ?, urgencia_parlamentaria = ?, fecha_ingreso = ?, fecha_actualizacion = ? WHERE id = ?',
        [...params, p.id]
      );
      return p.id;
    } else {
      const result = await query(
        'INSERT INTO projects (titulo, origen, comision_id, ponente_id, fase_actual, urgencia_parlamentaria, fecha_ingreso, fecha_actualizacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        params
      );
      return result.lastInsertRowid;
    }
  },
  deleteProject: async (id) => query('UPDATE projects SET activo = 0 WHERE id = ?', [id]),

  // Versiones de Proyectos
  getProjectVersions: async (projectId) => query('SELECT * FROM project_versions WHERE project_id = ? ORDER BY fecha_creacion DESC', [projectId]),
  saveProjectVersion: async (v) => {
    const params = [v.project_id, v.version_label, v.mensaje, JSON.stringify(v.snapshot), new Date().toISOString(), v.autor];
    const result = await query(
      'INSERT INTO project_versions (project_id, version_label, mensaje, snapshot, fecha_creacion, autor) VALUES (?, ?, ?, ?, ?, ?)',
      params
    );
    return result.lastInsertRowid;
  },

  // Documentos
  getDocuments: async () => query('SELECT * FROM documents WHERE activo = 1 ORDER BY fecha_subida DESC'),
  saveDocument: async (d) => {
    const params = [d.entidad_tipo, d.entidad_id, d.fase_etiqueta, d.ruta_archivo, d.nombre_original, d.tipo_mime, d.tamano_bytes, d.hash_integridad, d.fecha_subida, d.contenido_base64];
    const result = await query(
      'INSERT INTO documents (entidad_tipo, entidad_id, fase_etiqueta, ruta_archivo, nombre_original, tipo_mime, tamano_bytes, hash_integridad, fecha_subida, contenido_base64) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      params
    );
    return result.lastInsertRowid;
  },
  deleteDocument: async (id) => query('UPDATE documents SET activo = 0 WHERE id = ?', [id]),

  // Usuarios y Autenticación
  getUsers: async () => query('SELECT id, username, role, nombre_completo, ultimo_login, activo FROM users WHERE activo = 1'),
  getUserByUsername: async (username) => {
    const rows = await query('SELECT * FROM users WHERE username = ? AND activo = 1', [username]);
    return rows[0] || null;
  },
  saveUser: async (u) => {
    if (u.id) {
      await query(
        'UPDATE users SET username = ?, role = ?, nombre_completo = ? WHERE id = ?',
        [u.username, u.role, u.nombre_completo, u.id]
      );
      return u.id;
    } else {
      // Si es un usuario nuevo, ya debe venir con el password_hash generado
      const result = await query(
        'INSERT INTO users (username, password_hash, role, nombre_completo) VALUES (?, ?, ?, ?)',
        [u.username, u.password_hash, u.role, u.nombre_completo]
      );
      return result.lastInsertRowid;
    }
  },
  updateLastLogin: async (id) => query('UPDATE users SET ultimo_login = ? WHERE id = ?', [new Date().toISOString(), id]),

  // Backups
  createLocalBackup: async () => await window.legisAPI.db.backupLocal(),

  // Auditoría
  getAuditLogs: async () => query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 500'),
  addAuditLog: async (log) => {
    // Obtener el último hash para encadenar
    const lastLogs = await query('SELECT signature FROM audit_logs ORDER BY id DESC LIMIT 1');
    const prevSignature = lastLogs.length > 0 ? lastLogs[0].signature : 'GENESIS';
    
    // Crear una "firma" simple (en un entorno real usaríamos crypto.createHash)
    const dataToHash = `${prevSignature}|${log.action}|${log.entity_type}|${log.entity_id}|${log.timestamp || new Date().toISOString()}`;
    const signature = `sha256:${Array.from(dataToHash).reduce((a, c) => a + c.charCodeAt(0), 0).toString(16).padStart(64, '0')}`;

    const params = [
      new Date().toISOString(),
      log.level || 'INFO',
      log.userId || 'admin',
      log.action,
      log.entity_type,
      log.entity_id,
      log.changes ? JSON.stringify(log.changes) : null,
      signature
    ];

    await query(
      'INSERT INTO audit_logs (timestamp, level, userId, action, entity_type, entity_id, changes, signature) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      params
    );
  }
};
