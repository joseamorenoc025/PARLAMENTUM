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
    if (c.id) {
      await query('UPDATE commissions SET nombre = ?, presidente_id = ? WHERE id = ?', [c.nombre, c.presidente_id, c.id]);
      return c.id;
    } else {
      const result = await query('INSERT INTO commissions (nombre, presidente_id) VALUES (?, ?)', [c.nombre, c.presidente_id]);
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
  deleteDocument: async (id) => query('UPDATE documents SET activo = 0 WHERE id = ?', [id])
};
